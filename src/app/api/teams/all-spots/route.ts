import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db } = await connectToDatabase();
  const registrations = await db
    .collection("registrations")
    .find({
      paymentStatus: "completed",
    })
    .toArray();

  const spots = registrations.flatMap((reg) =>
    reg.spotDetails.map((spot: any) => ({
      spotId: spot.spotId,
      name: spot.name,
      phone: spot.phone,
      email: spot.email,
      userId: reg.userId,
    }))
  );

  console.log("Fetched all spots:", spots);
  return NextResponse.json({ spots });
}
