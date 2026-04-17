"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Photo { id: string; url: string; notes: string | null; takenAt: Date; }

interface Props { assetId: string; photos: Photo[]; }

export default function PhotoGallery({ assetId, photos }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("assetId", assetId);
    await fetch("/api/photos", { method: "POST", body: fd });
    setUploading(false);
    router.refresh();
  }

  async function deletePhoto(id: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setSelectedPhoto(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 border border-dashed border-slate-600 rounded-xl py-4 text-slate-400 hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : (
            <><span className="text-2xl">📷</span><span className="text-sm">Take / Upload Photo</span></>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {photos.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-8">No photos yet. Tap above to add one.</p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p) => (
          <button key={p.id} onClick={() => setSelectedPhoto(p)} className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="Asset photo" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-xs text-white">{new Date(p.takenAt).toLocaleDateString()}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setSelectedPhoto(null)}>
          <div className="flex justify-between items-center p-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-slate-400">{new Date(selectedPhoto.takenAt).toLocaleString()}</span>
            <div className="flex gap-3">
              <a href={selectedPhoto.url} download className="text-blue-400 text-sm">Download</a>
              <button onClick={() => deletePhoto(selectedPhoto.id)} className="text-red-400 text-sm">Delete</button>
              <button onClick={() => setSelectedPhoto(null)} className="text-slate-400 text-sm">✕</button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedPhoto.url} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
          {selectedPhoto.notes && (
            <p className="p-4 text-sm text-slate-300 text-center" onClick={(e) => e.stopPropagation()}>{selectedPhoto.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
