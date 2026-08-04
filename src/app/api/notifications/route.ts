import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markAllRead } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const take = Number(req.nextUrl.searchParams.get("take") ?? 20);
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 100),
  });
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  await markAllRead();
  return NextResponse.json({ ok: true });
}
