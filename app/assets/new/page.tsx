import AssetForm from "@/components/AssetForm";
import Link from "next/link";

export default function NewAssetPage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/assets" className="text-slate-400 text-sm">← Back</Link>
        <h1 className="text-xl font-bold">Add Asset</h1>
      </div>
      <AssetForm />
    </div>
  );
}
