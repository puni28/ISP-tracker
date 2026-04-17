import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ASSET_COLORS, ASSET_LABELS, CABLE_COLORS, CABLE_LABELS, type AssetType, type CableType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const asset = await prisma.networkAsset.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { takenAt: "desc" }, take: 8 },
      cablesFrom: { include: { toAsset: true, readings: { orderBy: { takenAt: "desc" }, take: 1 } } },
      cablesTo:   { include: { fromAsset: true, readings: { orderBy: { takenAt: "desc" }, take: 1 } } },
    },
  });

  if (!asset) notFound();

  const allCables = [
    ...asset.cablesFrom.map((c) => ({ ...c, direction: "out" as const, otherAsset: c.toAsset })),
    ...asset.cablesTo.map((c)   => ({ ...c, direction: "in"  as const, otherAsset: c.fromAsset })),
  ];

  const color = ASSET_COLORS[asset.type as AssetType];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="pt-2">
        <Link href="/assets" className="text-slate-400 text-sm">← Assets</Link>
      </div>

      {/* ── Tablet 2-column layout ── */}
      <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start space-y-5 md:space-y-0">

        {/* Left column */}
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: color }}>
              {asset.type.slice(0, 2)}
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{asset.name}</h1>
              <p className="text-sm text-slate-400">{ASSET_LABELS[asset.type as AssetType]}</p>
            </div>
          </div>

          {/* Details table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            <Row label="Coordinates" value={`${asset.lat.toFixed(5)}, ${asset.lng.toFixed(5)}`} />
            {asset.address && <Row label="Address" value={asset.address} />}
            {asset.type === "SPLITTER" && asset.splitRatio && <Row label="Split Ratio" value={asset.splitRatio} />}
            {asset.type === "COUPLER" && (
              <>
                {asset.couplerRatio && <Row label="Coupling Ratio" value={asset.couplerRatio} />}
                {asset.insertionLoss != null && <Row label="Insertion Loss" value={`${asset.insertionLoss} dB`} />}
              </>
            )}
            {asset.type === "AMPLIFIER" && (
              <>
                {asset.gainDb != null && <Row label="Gain" value={`${asset.gainDb} dB`} />}
                {asset.inputLevel != null && <Row label="Input Level" value={`${asset.inputLevel} dBmV`} />}
                {asset.outputLevel != null && <Row label="Output Level" value={`${asset.outputLevel} dBmV`} />}
              </>
            )}
            {asset.type === "NODE" && (
              <>
                {asset.nodeType && <Row label="Node Type" value={asset.nodeType.toUpperCase()} />}
                {asset.portCount != null && <Row label="Ports" value={String(asset.portCount)} />}
              </>
            )}
            {asset.type === "POLE" && (
              <>
                {asset.poleHeight != null && <Row label="Height" value={`${asset.poleHeight} m`} />}
                {asset.poleMaterial && <Row label="Material" value={asset.poleMaterial} />}
              </>
            )}
            {asset.notes && <Row label="Notes" value={asset.notes} />}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/assets/${asset.id}/photos`}
              className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center text-sm hover:border-slate-500 transition-colors">
              <div className="text-xl mb-1">📷</div>
              Photos ({asset.photos.length})
            </Link>
            <Link href={`/map?focus=${asset.id}`}
              className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center text-sm hover:border-slate-500 transition-colors">
              <div className="text-xl mb-1">◉</div>
              View on Map
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Connected cables */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Connected Cables</h2>
              <Link href={`/cables/new?fromAssetId=${asset.id}`} className="text-blue-400 text-xs">+ Add Cable</Link>
            </div>
            {allCables.length === 0 ? (
              <p className="text-slate-500 text-sm">No cables connected.</p>
            ) : (
              <div className="space-y-2">
                {allCables.map((c) => {
                  const reading = c.readings[0];
                  return (
                    <Link key={c.id} href={`/cables/${c.id}`}
                      className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-500 transition-colors">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CABLE_COLORS[c.type as CableType] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-xs text-slate-400">
                          {CABLE_LABELS[c.type as CableType]} · {c.direction === "out" ? "→" : "←"} {c.otherAsset.name}
                        </div>
                      </div>
                      {reading && (
                        <span className="text-xs font-mono text-green-400">{reading.value} {reading.unit}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Photo thumbnails */}
          {asset.photos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Photos</h2>
                <Link href={`/assets/${asset.id}/photos`} className="text-blue-400 text-xs">See all</Link>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
                {asset.photos.map((p) => (
                  <Link key={p.id} href={`/assets/${asset.id}/photos`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="Asset photo" className="w-full aspect-square object-cover rounded-lg" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
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
