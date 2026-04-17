import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ASSET_TYPES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const assets = await prisma.networkAsset.findMany({
    where: type ? { type } : undefined,
    include: { _count: { select: { photos: true, cablesFrom: true, cablesTo: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || !body.type || body.lat == null || body.lng == null) {
    return NextResponse.json({ error: "name, type, lat, lng are required" }, { status: 400 });
  }

  if (!ASSET_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const asset = await prisma.networkAsset.create({
    data: {
      name: body.name,
      type: body.type,
      lat: parseFloat(body.lat),
      lng: parseFloat(body.lng),
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

  return NextResponse.json(asset, { status: 201 });
}
