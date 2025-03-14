import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const { db } = await connectToDatabase();
  const registrations = await db.collection("registrations").find({}).toArray();
  return NextResponse.json(registrations);
}
