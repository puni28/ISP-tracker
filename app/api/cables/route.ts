import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CABLE_TYPES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const cables = await prisma.cable.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      fromAsset: { select: { id: true, name: true, type: true } },
      toAsset: { select: { id: true, name: true, type: true } },
      readings: { orderBy: { takenAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cables);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || !body.type || !body.fromAssetId || !body.toAssetId || !body.pathJson) {
    return NextResponse.json({ error: "name, type, fromAssetId, toAssetId, pathJson required" }, { status: 400 });
  }

  if (!CABLE_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid cable type" }, { status: 400 });
  }

  const cable = await prisma.cable.create({
    data: {
      name: body.name,
      type: body.type,
      fromAssetId: body.fromAssetId,
      toAssetId: body.toAssetId,
      pathJson: typeof body.pathJson === "string" ? body.pathJson : JSON.stringify(body.pathJson),
      lengthMeters: body.lengthMeters != null ? parseFloat(body.lengthMeters) : null,
      status: body.status ?? "ACTIVE",
      notes: body.notes ?? null,
    },
    include: {
      fromAsset: { select: { id: true, name: true, type: true } },
      toAsset: { select: { id: true, name: true, type: true } },
    },
  });

  return NextResponse.json(cable, { status: 201 });
}
