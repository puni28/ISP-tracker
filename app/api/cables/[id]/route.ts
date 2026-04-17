import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CABLE_STATUS } from "@/lib/constants";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const cable = await prisma.cable.findUnique({
    where: { id: params.id },
    include: {
      fromAsset: true,
      toAsset: true,
      readings: { orderBy: { takenAt: "desc" } },
    },
  });

  if (!cable) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cable);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  if (body.status && !CABLE_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const cable = await prisma.cable.update({
    where: { id: params.id },
    data: {
      name: body.name,
      status: body.status,
      notes: body.notes ?? null,
      lengthMeters: body.lengthMeters != null ? parseFloat(body.lengthMeters) : null,
    },
  });

  return NextResponse.json(cable);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.cable.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
