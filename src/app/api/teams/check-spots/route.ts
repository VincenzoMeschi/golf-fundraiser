import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const registration = await db.collection("registrations").findOne({
    userId,
    paymentStatus: "completed",
  });

  return NextResponse.json({ hasSpots: !!registration });
}
