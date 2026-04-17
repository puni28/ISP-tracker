import { prisma } from "@/lib/prisma";
import MapView from "@/components/MapView";

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: { searchParams: { focus?: string } }) {
  const [assets, cables] = await Promise.all([
    prisma.networkAsset.findMany({ select: { id: true, name: true, type: true, lat: true, lng: true, splitRatio: true, gainDb: true, nodeType: true } }),
    prisma.cable.findMany({
      include: {
        fromAsset: { select: { id: true, name: true } },
        toAsset: { select: { id: true, name: true } },
        readings: { orderBy: { takenAt: "desc" }, take: 1 },
      },
    }),
  ]);

  return (
    <div className="h-screen w-full fixed inset-0 pb-20 md:pb-0 md:pl-56">
      <MapView assets={assets} cables={cables} focusId={searchParams.focus} />
    </div>
  );
}
