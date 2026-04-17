"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  cableId: string;
  defaultUnit: string;
}

export default function SignalForm({ cableId, defaultUnit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ direction: "downstream", value: "", unit: defaultUnit, snr: "", notes: "" });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/signal-readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cableId, ...form, value: parseFloat(form.value), snr: form.snr ? parseFloat(form.snr) : null }),
    });
    setForm({ direction: "downstream", value: "", unit: defaultUnit, snr: "", notes: "" });
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full border border-dashed border-slate-600 text-slate-400 text-sm py-3 rounded-lg hover:border-blue-500 hover:text-blue-400">
        + Add Signal Reading
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Direction</label>
          <select value={form.direction} onChange={(e) => set("direction", e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
            <option value="downstream">Downstream</option>
            <option value="upstream">Upstream</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Unit</label>
          <select value={form.unit} onChange={(e) => set("unit", e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
            <option value="dBm">dBm</option>
            <option value="dBmV">dBmV</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Signal Value *</label>
          <input type="number" step="any" required value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="-18" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">SNR (dB)</label>
          <input type="number" step="any" value={form.snr} onChange={(e) => set("snr", e.target.value)} placeholder="36" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Notes</label>
        <input type="text" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{loading ? "Saving…" : "Save Reading"}</button>
      </div>
    </form>
  );
}
