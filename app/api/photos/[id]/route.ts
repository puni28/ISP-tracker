import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const photo = await prisma.photo.update({
    where: { id: params.id },
    data: {
      annotations: body.annotations != null ? JSON.stringify(body.annotations) : null,
      notes: body.notes ?? undefined,
    },
  });

  return NextResponse.json(photo);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const photo = await prisma.photo.findUnique({ where: { id: params.id } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const filepath = path.join(process.cwd(), "public", photo.url);
    await unlink(filepath);
  } catch {
    // file may already be gone
  }

  await prisma.photo.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
