import AssetForm from "@/components/AssetForm";
import Link from "next/link";

export default function NewAssetPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/assets" className="text-slate-400 text-sm">← Back</Link>
        <h1 className="text-xl md:text-2xl font-bold">Add Asset</h1>
      </div>
      <AssetForm />
    </div>
  );
}
