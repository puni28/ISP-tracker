import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_DIRECTIONS = ["upstream", "downstream"];
const VALID_UNITS = ["dBm", "dBmV"];

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

  if (!VALID_DIRECTIONS.includes(body.direction)) {
    return NextResponse.json({ error: "direction must be upstream or downstream" }, { status: 400 });
  }

  if (!VALID_UNITS.includes(body.unit)) {
    return NextResponse.json({ error: "unit must be dBm or dBmV" }, { status: 400 });
  }

  const value = parseFloat(body.value);
  if (isNaN(value)) {
    return NextResponse.json({ error: "value must be a number" }, { status: 400 });
  }

  const reading = await prisma.signalReading.create({
    data: {
      cableId: body.cableId,
      direction: body.direction,
      value,
      unit: body.unit,
      snr: body.snr != null ? parseFloat(body.snr) : null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(reading, { status: 201 });
}
