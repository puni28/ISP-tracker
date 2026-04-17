import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ASSET_COLORS, ASSET_LABELS, ASSET_TYPES, type AssetType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = ASSET_TYPES.includes(searchParams.type as AssetType) ? searchParams.type : undefined;

  const assets = await prisma.networkAsset.findMany({
    where: type ? { type } : undefined,
    include: { _count: { select: { photos: true, cablesFrom: true, cablesTo: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Assets</h1>
        <Link href="/assets/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">
          + Add
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Link
          href="/assets"
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${
            !type ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-slate-400"
          }`}
        >
          All
        </Link>
        {ASSET_TYPES.map((t) => (
          <Link
            key={t}
            href={`/assets?type=${t}`}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${
              type === t ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-slate-400"
            }`}
          >
            {ASSET_LABELS[t]}
          </Link>
        ))}
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-2">⬡</div>
          <p className="text-sm">No assets found.</p>
          <Link href="/assets/new" className="text-blue-400 text-sm underline mt-1 inline-block">
            Add one now
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((a) => {
            const cables = a._count.cablesFrom + a._count.cablesTo;
            return (
              <Link
                key={a.id}
                href={`/assets/${a.id}`}
                className="flex items-center gap-3 bg-slate-800 rounded-xl p-4 hover:bg-slate-750 border border-slate-700"
              >
                <span
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: ASSET_COLORS[a.type as AssetType] }}
                >
                  {a.type.slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{a.name}</div>
                  <div className="text-xs text-slate-400">
                    {ASSET_LABELS[a.type as AssetType]}
                    {a.type === "SPLITTER" && a.splitRatio && ` · ${a.splitRatio}`}
                    {a.type === "AMPLIFIER" && a.gainDb != null && ` · ${a.gainDb}dB gain`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500">{cables} cable{cables !== 1 ? "s" : ""}</div>
                  <div className="text-xs text-slate-500">{a._count.photos} photo{a._count.photos !== 1 ? "s" : ""}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
