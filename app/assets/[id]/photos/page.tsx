import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

export default async function PhotosPage({ params }: { params: { id: string } }) {
  const asset = await prisma.networkAsset.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { takenAt: "desc" } } },
  });

  if (!asset) notFound();

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/assets/${asset.id}`} className="text-slate-400 text-sm">← {asset.name}</Link>
      </div>
      <h1 className="text-xl font-bold">Photos</h1>
      <PhotoGallery assetId={asset.id} photos={asset.photos} />
    </div>
  );
}
