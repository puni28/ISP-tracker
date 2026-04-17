import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const asset = await prisma.networkAsset.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { takenAt: "desc" } },
      cablesFrom: { include: { toAsset: true, readings: { orderBy: { takenAt: "desc" }, take: 1 } } },
      cablesTo: { include: { fromAsset: true, readings: { orderBy: { takenAt: "desc" }, take: 1 } } },
    },
  });

  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const asset = await prisma.networkAsset.update({
    where: { id: params.id },
    data: {
      name: body.name,
      lat: body.lat != null ? parseFloat(body.lat) : undefined,
      lng: body.lng != null ? parseFloat(body.lng) : undefined,
      address: body.address ?? null,
      notes: body.notes ?? null,
      splitRatio: body.splitRatio ?? null,
      couplerRatio: body.couplerRatio ?? null,
      insertionLoss: body.insertionLoss != null ? parseFloat(body.insertionLoss) : null,
      gainDb: body.gainDb != null ? parseFloat(body.gainDb) : null,
      inputLevel: body.inputLevel != null ? parseFloat(body.inputLevel) : null,
      outputLevel: body.outputLevel != null ? parseFloat(body.outputLevel) : null,
      nodeType: body.nodeType ?? null,
      portCount: body.portCount != null ? parseInt(body.portCount) : null,
      poleHeight: body.poleHeight != null ? parseFloat(body.poleHeight) : null,
      poleMaterial: body.poleMaterial ?? null,
    },
  });

  return NextResponse.json(asset);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.networkAsset.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
