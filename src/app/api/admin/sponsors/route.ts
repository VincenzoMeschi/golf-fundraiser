import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const sponsors = await db.collection("sponsors").find().toArray();
    return NextResponse.json(sponsors);
  } catch (err) {
    console.error(`Error in GET /api/admin/sponsors: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
