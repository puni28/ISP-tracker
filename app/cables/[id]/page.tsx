import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CABLE_COLORS, CABLE_LABELS, CABLE_UNITS, type CableType } from "@/lib/constants";
import SignalForm from "@/components/SignalForm";

export const dynamic = "force-dynamic";

function signalColor(value: number, unit: string) {
  if (unit === "dBm") return value >= -20 ? "text-green-400" : value >= -25 ? "text-yellow-400" : "text-red-400";
  return value >= 0 ? "text-green-400" : value >= -6 ? "text-yellow-400" : "text-red-400";
}

export default async function CableDetailPage({ params }: { params: { id: string } }) {
  const cable = await prisma.cable.findUnique({
    where: { id: params.id },
    include: {
      fromAsset: true,
      toAsset: true,
      readings: { orderBy: { takenAt: "desc" } },
    },
  });

  if (!cable) notFound();

  const color = CABLE_COLORS[cable.type as CableType];
  const defaultUnit = CABLE_UNITS[cable.type as CableType];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/cables" className="text-slate-400 text-sm">← Cables</Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="w-5 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div>
          <h1 className="text-xl font-bold">{cable.name}</h1>
          <p className="text-sm text-slate-400">{CABLE_LABELS[cable.type as CableType]}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
        <Row label="From" value={cable.fromAsset.name} />
        <Row label="To" value={cable.toAsset.name} />
        <Row label="Status" value={cable.status} />
        {cable.lengthMeters != null && <Row label="Length" value={`${cable.lengthMeters} m`} />}
        {cable.notes && <Row label="Notes" value={cable.notes} />}
      </div>

      {/* Signal readings */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Signal Readings</h2>
        <SignalForm cableId={cable.id} defaultUnit={defaultUnit} />

        {cable.readings.length > 0 ? (
          <div className="mt-3 space-y-2">
            {cable.readings.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700">
                <span className={`text-sm font-mono font-bold ${signalColor(r.value, r.unit)}`}>
                  {r.value} {r.unit}
                </span>
                <div className="flex-1 text-xs text-slate-400">
                  {r.direction}
                  {r.snr != null && ` · SNR ${r.snr} dB`}
                  {r.notes && ` · ${r.notes}`}
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(r.takenAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm mt-3">No readings yet.</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start px-4 py-3 gap-4">
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}
