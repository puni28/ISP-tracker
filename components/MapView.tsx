"use client";
import { useEffect, useRef, useState } from "react";
import { ASSET_COLORS, CABLE_COLORS, ASSET_LABELS, CABLE_LABELS, type AssetType, type CableType } from "@/lib/constants";

interface Asset { id: string; name: string; type: string; lat: number; lng: number; splitRatio?: string | null; gainDb?: number | null; nodeType?: string | null; }
interface Reading { value: number; unit: string; }
interface Cable { id: string; name: string; type: string; pathJson: string; status: string; fromAsset: { id: string; name: string }; toAsset: { id: string; name: string }; readings: Reading[]; }

interface Props { assets: Asset[]; cables: Cable[]; focusId?: string; }

const TILE_LAYERS = {
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri", maxZoom: 19 },
  light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: "&copy; OpenStreetMap contributors &copy; CARTO", maxZoom: 19 },
  street: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 },
};

type TileKey = keyof typeof TILE_LAYERS;

export default function MapView({ assets, cables, focusId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const tileLayerRef = useRef<unknown>(null);
  const [tileKey, setTileKey] = useState<TileKey>("satellite");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Fix default Leaflet marker icon path resolution in webpack
      const proto = L.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete proto._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });

      const focusedAsset = focusId ? assets.find((a) => a.id === focusId) : null;
      const center: [number, number] = focusedAsset ? [focusedAsset.lat, focusedAsset.lng] : assets.length > 0 ? [assets[0].lat, assets[0].lng] : [20, 0];
      const zoom = focusedAsset ? 17 : assets.length > 0 ? 14 : 3;

      const map = L.map(mapRef.current!, { zoomControl: true }).setView(center, zoom);

      const tile = TILE_LAYERS[tileKey];
      tileLayerRef.current = L.tileLayer(tile.url, { attribution: tile.attribution, maxZoom: tile.maxZoom }).addTo(map);

      // Add asset markers
      assets.forEach((asset) => {
        const color = ASSET_COLORS[asset.type as AssetType] ?? "#6b7280";
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${asset.type.slice(0, 2)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const label = [
          `<b>${asset.name}</b>`,
          ASSET_LABELS[asset.type as AssetType],
          asset.splitRatio ? `Ratio: ${asset.splitRatio}` : "",
          asset.gainDb != null ? `Gain: ${asset.gainDb}dB` : "",
        ].filter(Boolean).join("<br/>");

        L.marker([asset.lat, asset.lng], { icon })
          .addTo(map)
          .bindPopup(`${label}<br/><a href="/assets/${asset.id}" style="color:#60a5fa">View details →</a>`)
          .on("click", function (this: L.Marker) { this.openPopup(); });
      });

      // Draw cables
      cables.forEach((cable) => {
        let coords: [number, number][] = [];
        try {
          const parsed = JSON.parse(cable.pathJson);
          if (parsed?.coordinates?.length > 1) {
            coords = parsed.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
          } else if (cable.fromAsset && cable.toAsset) {
            const from = assets.find((a) => a.id === cable.fromAsset.id);
            const to = assets.find((a) => a.id === cable.toAsset.id);
            if (from && to) coords = [[from.lat, from.lng], [to.lat, to.lng]];
          }
        } catch {
          const from = assets.find((a) => a.id === cable.fromAsset.id);
          const to = assets.find((a) => a.id === cable.toAsset.id);
          if (from && to) coords = [[from.lat, from.lng], [to.lat, to.lng]];
        }

        if (coords.length < 2) return;

        const color = CABLE_COLORS[cable.type as CableType] ?? "#94a3b8";
        const reading = cable.readings[0];
        const label = [
          `<b>${cable.name}</b>`,
          CABLE_LABELS[cable.type as CableType],
          `${cable.fromAsset.name} → ${cable.toAsset.name}`,
          reading ? `Signal: ${reading.value} ${reading.unit}` : "",
          cable.status !== "ACTIVE" ? `Status: ${cable.status}` : "",
        ].filter(Boolean).join("<br/>");

        const opacity = cable.status === "DECOMMISSIONED" ? 0.3 : cable.status === "FAULTY" ? 0.7 : 1;

        L.polyline(coords, { color, weight: 4, opacity, dashArray: cable.status === "FAULTY" ? "8 4" : undefined })
          .addTo(map)
          .bindPopup(`${label}<br/><a href="/cables/${cable.id}" style="color:#60a5fa">View details →</a>`);
      });

      mapInstanceRef.current = map;
      setInitialized(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !initialized) return;
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current as L.Map;
      if (tileLayerRef.current) map.removeLayer(tileLayerRef.current as L.TileLayer);
      const tile = TILE_LAYERS[tileKey];
      tileLayerRef.current = L.tileLayer(tile.url, { attribution: tile.attribution, maxZoom: tile.maxZoom }).addTo(map);
    });
  }, [tileKey, initialized]);

  return (
    <div className="relative w-full h-full">
      {!initialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <div className="text-slate-400 text-sm">Loading map…</div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />

      {/* Layer toggle */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
        {(Object.keys(TILE_LAYERS) as TileKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTileKey(k)}
            className={`px-3 py-1.5 text-xs rounded-lg shadow-lg font-medium ${tileKey === k ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 border border-slate-600"}`}
          >
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* Quick link */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <a href="/assets/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">+ Add Asset</a>
      </div>
    </div>
  );
}
