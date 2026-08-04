import { NextRequest, NextResponse } from "next/server";
import { syncBien } from "@/lib/sync";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await syncBien(params.id);
  const httpStatus = result.status === "ERROR" ? 502 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
