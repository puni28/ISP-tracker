import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ASSET_COLORS, ASSET_LABELS, CABLE_LABELS, type AssetType, type CableType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [assetCount, cableCount, readingCount, recentAssets, recentReadings] = await Promise.all([
    prisma.networkAsset.count(),
    prisma.cable.count(),
    prisma.signalReading.count(),
    prisma.networkAsset.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.signalReading.findMany({
      orderBy: { takenAt: "desc" },
      take: 5,
      include: { cable: { select: { name: true, type: true } } },
    }),
  ]);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100 pt-2">ISP Tracker</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Assets", value: assetCount, href: "/assets", color: "bg-purple-900/40 border-purple-700" },
          { label: "Cables", value: cableCount, href: "/cables", color: "bg-blue-900/40 border-blue-700" },
          { label: "Readings", value: readingCount, href: "/cables", color: "bg-green-900/40 border-green-700" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/assets/new" className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-slate-500">
          <span className="text-2xl">+</span>
          <div>
            <div className="font-medium text-sm">Add Asset</div>
            <div className="text-xs text-slate-400">Pole, Node, Splitter…</div>
          </div>
        </Link>
        <Link href="/map" className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-slate-500">
          <span className="text-2xl">◉</span>
          <div>
            <div className="font-medium text-sm">Open Map</div>
            <div className="text-xs text-slate-400">View network</div>
          </div>
        </Link>
      </div>

      {/* Recent assets */}
      {recentAssets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Assets</h2>
          <div className="space-y-2">
            {recentAssets.map((a) => (
              <Link key={a.id} href={`/assets/${a.id}`} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 hover:bg-slate-750">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ASSET_COLORS[a.type as AssetType] }}
                />
                <span className="flex-1 text-sm font-medium truncate">{a.name}</span>
                <span className="text-xs text-slate-500">{ASSET_LABELS[a.type as AssetType]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent readings */}
      {recentReadings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Readings</h2>
          <div className="space-y-2">
            {recentReadings.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                <span className="text-sm font-mono font-bold text-green-400">
                  {r.value} {r.unit}
                </span>
                <span className="text-xs text-slate-400 flex-1 truncate">
                  {r.direction} · {CABLE_LABELS[r.cable.type as CableType]} · {r.cable.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assetCount === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">⬡</div>
          <p className="text-sm">No assets yet.</p>
          <Link href="/assets/new" className="text-blue-400 text-sm underline mt-1 inline-block">
            Add your first asset
          </Link>
        </div>
      )}
    </div>
  );
}
