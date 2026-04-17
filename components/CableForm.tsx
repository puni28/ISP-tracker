"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CABLE_TYPES, CABLE_LABELS, type CableType } from "@/lib/constants";

interface Asset { id: string; name: string; type: string; }

interface Props {
  assets: Asset[];
  defaultFromAssetId?: string;
  prefillPathJson?: string;
}

export default function CableForm({ assets, defaultFromAssetId, prefillPathJson }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "F4" as CableType,
    fromAssetId: defaultFromAssetId ?? "",
    toAssetId: "",
    lengthMeters: "",
    notes: "",
    pathJson: prefillPathJson ?? JSON.stringify({ type: "LineString", coordinates: [] }),
    status: "ACTIVE",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fromAssetId || !form.toAssetId) { setError("Select both From and To assets"); return; }
    if (form.fromAssetId === form.toAssetId) { setError("From and To must be different assets"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/cables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lengthMeters: form.lengthMeters ? parseFloat(form.lengthMeters) : null }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/cables/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Cable Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. F4-Node1-Splitter2" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
      </div>

      {/* Cable type */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Cable Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {CABLE_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => set("type", t)} className={`py-2 text-xs rounded-lg border transition-colors ${form.type === t ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-700 border-slate-600 text-slate-300"}`}>
              {CABLE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* From / To */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">From Asset *</label>
        <select value={form.fromAssetId} onChange={(e) => set("fromAssetId", e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
          <option value="">Select…</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">To Asset *</label>
        <select value={form.toAssetId} onChange={(e) => set("toAssetId", e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
          <option value="">Select…</option>
          {assets.filter((a) => a.id !== form.fromAssetId).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Length (m)</label>
          <input type="number" step="any" value={form.lengthMeters} onChange={(e) => set("lengthMeters", e.target.value)} placeholder="150" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
            <option value="ACTIVE">Active</option>
            <option value="FAULTY">Faulty</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Any notes…" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
        {loading ? "Saving…" : "Add Cable"}
      </button>
    </form>
  );
}
