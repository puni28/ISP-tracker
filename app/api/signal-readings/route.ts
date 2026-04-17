import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cableId = searchParams.get("cableId");

  if (!cableId) return NextResponse.json({ error: "cableId required" }, { status: 400 });

  const readings = await prisma.signalReading.findMany({
    where: { cableId },
    orderBy: { takenAt: "desc" },
  });

  return NextResponse.json(readings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.cableId || !body.direction || body.value == null || !body.unit) {
    return NextResponse.json({ error: "cableId, direction, value, unit required" }, { status: 400 });
  }

  const reading = await prisma.signalReading.create({
    data: {
      cableId: body.cableId,
      direction: body.direction,
      value: parseFloat(body.value),
      unit: body.unit,
      snr: body.snr != null ? parseFloat(body.snr) : null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(reading, { status: 201 });
}
