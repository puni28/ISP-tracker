"use client";
import { useEffect, useRef, useState } from "react";
import {
  ASSET_COLORS, CABLE_COLORS, ASSET_LABELS, CABLE_LABELS,
  CABLE_TYPES, ASSET_TYPES, type AssetType, type CableType,
} from "@/lib/constants";

interface Asset {
  id: string; name: string; type: string;
  lat: number; lng: number;
  splitRatio?: string | null; gainDb?: number | null; nodeType?: string | null;
}
interface Reading { value: number; unit: string; }
interface Cable {
  id: string; name: string; type: string; pathJson: string; status: string;
  fromAsset: { id: string; name: string };
  toAsset: { id: string; name: string };
  readings: Reading[];
}
interface Props { assets: Asset[]; cables: Cable[]; focusId?: string; }

const TILE_LAYERS = {
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri", maxZoom: 19 },
  light:     { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19 },
  street:    { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 },
};
type TileKey = keyof typeof TILE_LAYERS;

// ─── default cable form ───────────────────────────────────────────────────────
const defaultCableForm = { name: "", type: "F4" as CableType, fromAssetId: "", toAssetId: "", notes: "" };
const defaultAssetForm = { name: "", type: "POLE" as AssetType };

export default function MapView({ assets: initAssets, cables: initCables, focusId }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInst     = useRef<unknown>(null);   // L.Map
  const tileRef     = useRef<unknown>(null);   // L.TileLayer
  const LRef        = useRef<unknown>(null);   // cached Leaflet import
  const drawerRef   = useRef<unknown>(null);   // active L.Draw.Polyline instance
  const drawnItems  = useRef<unknown>(null);   // L.FeatureGroup for drawn layers

  const [tileKey, setTileKey]     = useState<TileKey>("satellite");
  const [initialized, setInit]    = useState(false);

  // live asset/cable lists (updated without page reload after creation)
  const [assets, setAssets] = useState(initAssets);
  const [cables, setCables] = useState(initCables);

  // ── draw cable state ──────────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnGeoJson, setDrawnGeoJson] = useState("");
  const [showCableModal, setShowCableModal] = useState(false);
  const [cableForm, setCableForm] = useState(defaultCableForm);
  const [cableSaving, setCableSaving] = useState(false);
  const [cableError, setCableError]   = useState("");

  // ── place asset state ─────────────────────────────────────────────────────
  const [placingAsset, setPlacingAsset]     = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [clickedLL, setClickedLL]           = useState<{ lat: number; lng: number } | null>(null);
  const [assetForm, setAssetForm]           = useState(defaultAssetForm);
  const [assetSaving, setAssetSaving]       = useState(false);
  const [assetError, setAssetError]         = useState("");

  // refs so Leaflet event handlers always see current values
  const placingRef  = useRef(false);
  useEffect(() => { placingRef.current = placingAsset; }, [placingAsset]);

  // ── helpers to add items to the live map ──────────────────────────────────
  function addMarkerToMap(L: any, map: any, asset: Asset) {
    const color = ASSET_COLORS[asset.type as AssetType] ?? "#6b7280";
    const icon = L.divIcon({
      className: "",
      html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.5)">${asset.type.slice(0, 2)}</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
    const info = [
      `<b>${asset.name}</b>`,
      ASSET_LABELS[asset.type as AssetType] ?? asset.type,
      asset.splitRatio ? `Ratio: ${asset.splitRatio}` : "",
      asset.gainDb != null ? `Gain: ${asset.gainDb} dB` : "",
    ].filter(Boolean).join("<br/>");
    L.marker([asset.lat, asset.lng], { icon })
      .addTo(map)
      .bindPopup(`${info}<br/><a href="/assets/${asset.id}" style="color:#60a5fa">View →</a>`)
      .on("click", function(this: any) { this.openPopup(); });
  }

  function addPolylineToMap(L: any, map: any, cable: Cable, allAssets: Asset[]) {
    let coords: [number, number][] = [];
    try {
      const parsed = JSON.parse(cable.pathJson);
      if (parsed?.coordinates?.length > 1) {
        coords = parsed.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      }
    } catch { /* fall through */ }
    if (coords.length < 2) {
      const from = allAssets.find((a) => a.id === cable.fromAsset.id);
      const to   = allAssets.find((a) => a.id === cable.toAsset.id);
      if (from && to) coords = [[from.lat, from.lng], [to.lat, to.lng]];
    }
    if (coords.length < 2) return;

    const color   = CABLE_COLORS[cable.type as CableType] ?? "#94a3b8";
    const reading = cable.readings[0];
    const opacity = cable.status === "DECOMMISSIONED" ? 0.3 : cable.status === "FAULTY" ? 0.7 : 1;
    const label   = [
      `<b>${cable.name}</b>`,
      CABLE_LABELS[cable.type as CableType] ?? cable.type,
      `${cable.fromAsset.name} → ${cable.toAsset.name}`,
      reading ? `Signal: ${reading.value} ${reading.unit}` : "",
      cable.status !== "ACTIVE" ? `<span style="color:#f87171">Status: ${cable.status}</span>` : "",
    ].filter(Boolean).join("<br/>");

    L.polyline(coords, { color, weight: 4, opacity, dashArray: cable.status === "FAULTY" ? "8 4" : undefined })
      .addTo(map)
      .bindPopup(`${label}<br/><a href="/cables/${cable.id}" style="color:#60a5fa">View →</a>`);
  }

  // ── map initialisation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    Promise.all([import("leaflet"), import("leaflet-draw" as any)]).then(([L]) => {
      // fix webpack marker icon paths
      const proto = L.Icon.Default.prototype as any;
      delete proto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      });

      const focusAsset = focusId ? initAssets.find((a) => a.id === focusId) : null;
      const center: [number, number] = focusAsset
        ? [focusAsset.lat, focusAsset.lng]
        : initAssets.length > 0 ? [initAssets[0].lat, initAssets[0].lng] : [20, 0];
      const zoom = focusAsset ? 17 : initAssets.length > 0 ? 14 : 3;

      const map = L.map(mapRef.current!, { zoomControl: true }).setView(center, zoom);
      const tile = TILE_LAYERS[tileKey];
      tileRef.current = L.tileLayer(tile.url, { attribution: tile.attribution, maxZoom: tile.maxZoom }).addTo(map);

      // render initial assets & cables
      initAssets.forEach((a) => addMarkerToMap(L, map, a));
      initCables.forEach((c) => addPolylineToMap(L, map, c, initAssets));

      // feature group to hold drawn shapes (required by leaflet-draw)
      const drawn = new (L as any).FeatureGroup().addTo(map);
      drawnItems.current = drawn;

      // listen for completed drawings
      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        drawn.clearLayers();
        drawn.addLayer(e.layer);
        const lls: any[] = e.layer.getLatLngs();
        const geoCoords   = lls.map((ll: any) => [ll.lng, ll.lat]);
        setDrawnGeoJson(JSON.stringify({ type: "LineString", coordinates: geoCoords }));
        setIsDrawing(false);
        setShowCableModal(true);
        drawerRef.current = null;
      });

      // listen for draw cancelled
      map.on((L as any).Draw.Event.DRAWSTOP, () => {
        setIsDrawing(false);
        drawerRef.current = null;
      });

      // tap to place asset
      map.on("click", (e: any) => {
        if (!placingRef.current) return;
        setClickedLL({ lat: e.latlng.lat, lng: e.latlng.lng });
        setShowAssetModal(true);
        setPlacingAsset(false);
        placingRef.current = false;
        map.getContainer().style.cursor = "";
      });

      LRef.current  = L;
      mapInst.current = map;
      setInit(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // switch tile layer
  useEffect(() => {
    if (!mapInst.current || !initialized) return;
    import("leaflet").then((L) => {
      const map = mapInst.current as L.Map;
      if (tileRef.current) map.removeLayer(tileRef.current as L.TileLayer);
      const tile = TILE_LAYERS[tileKey];
      tileRef.current = L.tileLayer(tile.url, { attribution: tile.attribution, maxZoom: tile.maxZoom }).addTo(map);
    });
  }, [tileKey, initialized]);

  // ── actions ───────────────────────────────────────────────────────────────
  function startDrawCable() {
    if (!LRef.current || !mapInst.current) return;
    const L   = LRef.current as any;
    const map = mapInst.current as any;
    const drawer = new L.Draw.Polyline(map, {
      shapeOptions: { color: "#60a5fa", weight: 4 },
      metric: true,
      showLength: true,
    });
    drawerRef.current = drawer;
    drawer.enable();
    setIsDrawing(true);
  }

  function cancelDraw() {
    if (drawerRef.current) (drawerRef.current as any).disable();
    drawerRef.current = null;
    (drawnItems.current as any)?.clearLayers();
    setIsDrawing(false);
    setShowCableModal(false);
    setDrawnGeoJson("");
    setCableForm(defaultCableForm);
    setCableError("");
  }

  function startPlaceAsset() {
    setPlacingAsset(true);
    placingRef.current = true;
    if (mapInst.current) (mapInst.current as any).getContainer().style.cursor = "crosshair";
  }

  function cancelPlaceAsset() {
    setPlacingAsset(false);
    placingRef.current = false;
    if (mapInst.current) (mapInst.current as any).getContainer().style.cursor = "";
  }

  async function saveCable() {
    if (!cableForm.name || !cableForm.fromAssetId || !cableForm.toAssetId) {
      setCableError("Name, From and To are required");
      return;
    }
    setCableSaving(true);
    setCableError("");
    const res = await fetch("/api/cables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cableForm.name, type: cableForm.type,
        fromAssetId: cableForm.fromAssetId, toAssetId: cableForm.toAssetId,
        pathJson: drawnGeoJson, notes: cableForm.notes,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setCableError(d.error ?? "Failed to save");
      setCableSaving(false);
      return;
    }
    const saved = await res.json();
    const newCable: Cable = {
      ...saved,
      fromAsset: assets.find((a) => a.id === cableForm.fromAssetId)!,
      toAsset:   assets.find((a) => a.id === cableForm.toAssetId)!,
      readings: [],
    };
    setCables((prev) => [...prev, newCable]);
    // add polyline live
    addPolylineToMap(LRef.current as any, mapInst.current as any, newCable, assets);
    (drawnItems.current as any)?.clearLayers();
    setShowCableModal(false);
    setDrawnGeoJson("");
    setCableForm(defaultCableForm);
    setCableSaving(false);
  }

  async function saveAsset() {
    if (!assetForm.name || !clickedLL) { setAssetError("Name is required"); return; }
    setAssetSaving(true);
    setAssetError("");
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...assetForm, lat: clickedLL.lat, lng: clickedLL.lng }),
    });
    if (!res.ok) {
      const d = await res.json();
      setAssetError(d.error ?? "Failed to save");
      setAssetSaving(false);
      return;
    }
    const saved = await res.json();
    setAssets((prev) => [...prev, saved]);
    addMarkerToMap(LRef.current as any, mapInst.current as any, saved);
    setShowAssetModal(false);
    setClickedLL(null);
    setAssetForm(defaultAssetForm);
    setAssetSaving(false);
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {!initialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <p className="text-slate-400 text-sm animate-pulse">Loading map…</p>
        </div>
      )}

      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full" />

      {/* ── Cable legend (top-left) ── */}
      {initialized && (
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 rounded-xl p-3 shadow-lg space-y-1.5">
          {(Object.keys(CABLE_COLORS) as CableType[]).map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div style={{ background: CABLE_COLORS[t], width: 22, height: 4, borderRadius: 2, flexShrink: 0 }} />
              <span className="text-slate-300 text-xs">{CABLE_LABELS[t]}</span>
            </div>
          ))}
          <div className="border-t border-slate-700 pt-1.5 space-y-1">
            <div className="flex items-center gap-2"><div className="w-5 h-1 bg-slate-400 rounded" style={{ borderTop: "4px dashed #f87171" }} /><span className="text-xs text-slate-400">Faulty</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-1 rounded" style={{ background: "#94a3b8", opacity: 0.3, height: 4 }} /><span className="text-xs text-slate-400">Decomm.</span></div>
          </div>
        </div>
      )}

      {/* ── Tile layer switcher (top-right) ── */}
      {initialized && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5">
          {(Object.keys(TILE_LAYERS) as TileKey[]).map((k) => (
            <button key={k} onClick={() => setTileKey(k)}
              className={`px-3 py-1.5 text-xs rounded-lg shadow-lg font-medium ${tileKey === k ? "bg-blue-600 text-white" : "bg-slate-800/90 text-slate-300 border border-slate-600"}`}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* ── Bottom toolbar ── */}
      {initialized && !showCableModal && !showAssetModal && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          {isDrawing ? (
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-blue-700/90 backdrop-blur text-white text-sm py-3 px-4 rounded-xl font-medium text-center">
                Tap waypoints · Double-tap to finish
              </div>
              <button onClick={cancelDraw} className="bg-slate-800/90 text-slate-300 text-sm px-4 py-3 rounded-xl border border-slate-600">
                Cancel
              </button>
            </div>
          ) : placingAsset ? (
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-emerald-700/90 backdrop-blur text-white text-sm py-3 px-4 rounded-xl font-medium text-center">
                Tap the map to place asset
              </div>
              <button onClick={cancelPlaceAsset} className="bg-slate-800/90 text-slate-300 text-sm px-4 py-3 rounded-xl border border-slate-600">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={startPlaceAsset}
                className="flex-1 bg-slate-800/90 backdrop-blur text-white text-sm py-3 rounded-xl border border-slate-600 font-medium">
                + Asset
              </button>
              <button onClick={startDrawCable}
                className="flex-1 bg-blue-600/90 backdrop-blur text-white text-sm py-3 rounded-xl font-semibold">
                ✏ Draw Cable
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Asset count badge ── */}
      {initialized && !isDrawing && !placingAsset && !showCableModal && !showAssetModal && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur rounded-full px-3 py-1 text-xs text-slate-400">
          {assets.length} assets · {cables.length} cables
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          Cable creation bottom sheet
      ──────────────────────────────────────────────────────────────────── */}
      {showCableModal && (
        <div className="absolute inset-x-0 bottom-0 z-[2000] bg-slate-900 rounded-t-2xl border-t border-slate-700 shadow-2xl">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
          <div className="px-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between py-1">
              <h2 className="text-white font-semibold text-lg">New Cable</h2>
              <button onClick={cancelDraw} className="text-slate-400 text-2xl leading-none p-1">✕</button>
            </div>

            {/* Cable type */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Cable Type</label>
              <div className="grid grid-cols-3 gap-2">
                {CABLE_TYPES.map((t) => (
                  <button key={t} type="button"
                    onClick={() => setCableForm((f) => ({ ...f, type: t }))}
                    className="py-2.5 text-sm rounded-lg border font-medium transition-colors"
                    style={cableForm.type === t
                      ? { background: CABLE_COLORS[t], borderColor: CABLE_COLORS[t], color: "#fff" }
                      : { background: "#1e293b", borderColor: "#334155", color: "#cbd5e1" }}>
                    {CABLE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cable Name *</label>
              <input
                value={cableForm.name}
                onChange={(e) => setCableForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pole 12 → Node A"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* From / To */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">From asset *</label>
                <select
                  value={cableForm.fromAssetId}
                  onChange={(e) => setCableForm((f) => ({ ...f, fromAssetId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
                  <option value="">Select…</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">To asset *</label>
                <select
                  value={cableForm.toAssetId}
                  onChange={(e) => setCableForm((f) => ({ ...f, toAssetId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
                  <option value="">Select…</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <input
                value={cableForm.notes}
                onChange={(e) => setCableForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {cableError && <p className="text-red-400 text-sm">{cableError}</p>}

            <button
              onClick={saveCable}
              disabled={cableSaving}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:bg-blue-700">
              {cableSaving ? "Saving…" : "Save Cable"}
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          Asset placement bottom sheet
      ──────────────────────────────────────────────────────────────────── */}
      {showAssetModal && clickedLL && (
        <div className="absolute inset-x-0 bottom-0 z-[2000] bg-slate-900 rounded-t-2xl border-t border-slate-700 shadow-2xl">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
          <div className="px-5 pb-8 space-y-4">
            <div className="flex items-center justify-between py-1">
              <h2 className="text-white font-semibold text-lg">New Asset</h2>
              <button onClick={() => { setShowAssetModal(false); setAssetError(""); }} className="text-slate-400 text-2xl leading-none p-1">✕</button>
            </div>

            <p className="text-xs text-slate-400 bg-slate-800 rounded-lg px-3 py-2">
              📍 {clickedLL.lat.toFixed(6)}, {clickedLL.lng.toFixed(6)}
            </p>

            {/* Asset type */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Asset Type</label>
              <div className="grid grid-cols-3 gap-2">
                {ASSET_TYPES.map((t) => (
                  <button key={t} type="button"
                    onClick={() => setAssetForm((f) => ({ ...f, type: t }))}
                    className="py-2.5 text-sm rounded-lg border font-medium transition-colors"
                    style={assetForm.type === t
                      ? { background: ASSET_COLORS[t], borderColor: ASSET_COLORS[t], color: "#fff" }
                      : { background: "#1e293b", borderColor: "#334155", color: "#cbd5e1" }}>
                    {ASSET_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input
                value={assetForm.name}
                onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pole 12"
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {assetError && <p className="text-red-400 text-sm">{assetError}</p>}

            <button
              onClick={saveAsset}
              disabled={assetSaving}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:bg-emerald-700">
              {assetSaving ? "Saving…" : "Place Asset"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
