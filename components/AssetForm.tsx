"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ASSET_TYPES, SPLIT_RATIOS, type AssetType } from "@/lib/constants";

const ASSET_LABELS: Record<AssetType, string> = {
  POLE: "Pole",
  NODE: "Node",
  AMPLIFIER: "Amplifier",
  SPLITTER: "Splitter",
  COUPLER: "Coupler",
};

interface Props {
  initialData?: Record<string, unknown>;
  assetId?: string;
}

export default function AssetForm({ initialData, assetId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    name: (initialData?.name as string) ?? "",
    type: (initialData?.type as AssetType) ?? "POLE",
    lat: (initialData?.lat as string) ?? "",
    lng: (initialData?.lng as string) ?? "",
    address: (initialData?.address as string) ?? "",
    notes: (initialData?.notes as string) ?? "",
    // Splitter
    splitRatio: (initialData?.splitRatio as string) ?? "1:8",
    // Coupler
    couplerRatio: (initialData?.couplerRatio as string) ?? "",
    insertionLoss: (initialData?.insertionLoss as string) ?? "",
    // Amplifier
    gainDb: (initialData?.gainDb as string) ?? "",
    inputLevel: (initialData?.inputLevel as string) ?? "",
    outputLevel: (initialData?.outputLevel as string) ?? "",
    // Node
    nodeType: (initialData?.nodeType as string) ?? "hfc",
    portCount: (initialData?.portCount as string) ?? "",
    // Pole
    poleHeight: (initialData?.poleHeight as string) ?? "",
    poleMaterial: (initialData?.poleMaterial as string) ?? "wood",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", pos.coords.latitude.toFixed(6));
        set("lng", pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError("Could not get location");
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = assetId ? `/api/assets/${assetId}` : "/api/assets";
    const method = assetId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/assets/${data.id}`);
    router.refresh();
  }

  const Field = ({ label, name, type = "text", placeholder = "" }: { label: string; name: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={(form as Record<string, string>)[name]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Asset Type</label>
        <div className="grid grid-cols-5 gap-1">
          {ASSET_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className={`py-2 text-xs rounded-lg border transition-colors ${
                form.type === t
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300"
              }`}
            >
              {ASSET_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <Field label="Name *" name="name" placeholder="e.g. Pole-042" />

      {/* Location */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Location *</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={form.lat}
            onChange={(e) => set("lat", e.target.value)}
            placeholder="Latitude"
            step="any"
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            value={form.lng}
            onChange={(e) => set("lng", e.target.value)}
            placeholder="Longitude"
            step="any"
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="mt-1.5 text-xs text-blue-400 underline disabled:opacity-50"
        >
          {locating ? "Getting location…" : "Use my current location"}
        </button>
      </div>

      <Field label="Address" name="address" placeholder="Street / area (optional)" />

      {/* Type-specific fields */}
      {form.type === "SPLITTER" && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Split Ratio</label>
          <select
            value={form.splitRatio}
            onChange={(e) => set("splitRatio", e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {SPLIT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {form.type === "COUPLER" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Coupling Ratio" name="couplerRatio" placeholder="e.g. 10dB" />
          <Field label="Insertion Loss (dB)" name="insertionLoss" type="number" placeholder="0.5" />
        </div>
      )}

      {form.type === "AMPLIFIER" && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Gain (dB)" name="gainDb" type="number" placeholder="20" />
          <Field label="Input Level" name="inputLevel" type="number" placeholder="-10" />
          <Field label="Output Level" name="outputLevel" type="number" placeholder="10" />
        </div>
      )}

      {form.type === "NODE" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Node Type</label>
            <select
              value={form.nodeType}
              onChange={(e) => set("nodeType", e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="hfc">HFC</option>
              <option value="fiber">Fiber</option>
            </select>
          </div>
          <Field label="Port Count" name="portCount" type="number" placeholder="8" />
        </div>
      )}

      {form.type === "POLE" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (m)" name="poleHeight" type="number" placeholder="9" />
          <div>
            <label className="block text-xs text-slate-400 mb-1">Material</label>
            <select
              value={form.poleMaterial}
              onChange={(e) => set("poleMaterial", e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="wood">Wood</option>
              <option value="concrete">Concrete</option>
              <option value="steel">Steel</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Any additional notes…"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "Saving…" : assetId ? "Save Changes" : "Add Asset"}
      </button>
    </form>
  );
}
