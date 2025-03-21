import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const registrations = await db.collection("registrations").find().toArray();
    return NextResponse.json(registrations);
  } catch (err) {
    console.error(`Error in GET /api/admin/registrations: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
