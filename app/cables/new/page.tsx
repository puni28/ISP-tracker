import CableForm from "@/components/CableForm";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewCablePage({ searchParams }: { searchParams: { fromAssetId?: string } }) {
  const assets = await prisma.networkAsset.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, type: true } });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/cables" className="text-slate-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold">Add Cable</h1>
      </div>
      <CableForm assets={assets} defaultFromAssetId={searchParams.fromAssetId} />
    </div>
  );
}
