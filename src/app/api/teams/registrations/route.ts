import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Mark the route as dynamic to prevent prerendering during build
export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable revalidation for this route

// GET: Fetch all registrations for teams (example implementation)
export async function GET() {
  // Avoid connecting to MongoDB during build
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    try {
      const { db } = await connectToDatabase();
      const registrations = await db.collection("registrations").find({}).toArray();
      return NextResponse.json(registrations);
    } catch (err) {
      console.error(`Error in GET /api/teams/registrations: ${err}`);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  } else {
    // Return a placeholder response during build
    return NextResponse.json({ message: "Route not executed during build" });
  }
}
