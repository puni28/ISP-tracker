import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CABLE_COLORS, CABLE_LABELS, CABLE_TYPES, type CableType } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:         "bg-green-900/50 text-green-400 border-green-800",
  FAULTY:         "bg-red-900/50 text-red-400 border-red-800",
  DECOMMISSIONED: "bg-slate-700 text-slate-500 border-slate-600",
};

export default async function CablesPage({ searchParams }: { searchParams: { type?: string; status?: string } }) {
  const type   = CABLE_TYPES.includes(searchParams.type as CableType) ? searchParams.type : undefined;
  const status = searchParams.status;

  const cables = await prisma.cable.findMany({
    where: {
      ...(type   ? { type }   : {}),
      ...(status ? { status } : {}),
    },
    include: {
      fromAsset: { select: { name: true } },
      toAsset:   { select: { name: true } },
      readings:  { orderBy: { takenAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl md:text-2xl font-bold">Cables</h1>
        <Link href="/cables/new" className="bg-blue-600 text-white text-sm px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-medium">
          + Add
        </Link>
      </div>

      {/* Filter chips — scroll on mobile, wrap on tablet */}
      <div className="flex gap-2 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <Link href="/cables" className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${!type && !status ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-slate-400"}`}>All</Link>
        {CABLE_TYPES.map((t) => (
          <Link key={t} href={`/cables?type=${t}`} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${type === t ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-slate-400"}`}>
            {CABLE_LABELS[t]}
          </Link>
        ))}
        <Link href="/cables?status=FAULTY" className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${status === "FAULTY" ? "bg-red-600 border-red-500 text-white" : "border-slate-600 text-slate-400"}`}>
          Faulty
        </Link>
      </div>

      {cables.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-2">⌇</div>
          <p className="text-sm">No cables found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {cables.map((c) => {
            const reading = c.readings[0];
            return (
              <Link key={c.id} href={`/cables/${c.id}`}
                className="flex items-center gap-3 bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-500 transition-colors">
                <span className="w-4 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: CABLE_COLORS[c.type as CableType] }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {CABLE_LABELS[c.type as CableType]} · {c.fromAsset.name} → {c.toAsset.name}
                  </div>
                  {c.lengthMeters && <div className="text-xs text-slate-500">{c.lengthMeters}m</div>}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  {reading && <span className="text-xs font-mono text-green-400">{reading.value} {reading.unit}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
