import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const assetId = formData.get("assetId") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!file || !assetId) {
    return NextResponse.json({ error: "file and assetId required" }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" }, { status: 400 });
  }

  // Validate extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");

  try {
    await mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const photo = await prisma.photo.create({
      data: {
        assetId,
        filename,
        url: `/uploads/${filename}`,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
  }
}
