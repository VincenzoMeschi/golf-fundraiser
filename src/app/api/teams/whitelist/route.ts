import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const { teamId, email } = await request.json();
  const { db } = await connectToDatabase();

  try {
    if (!teamId || !email) {
      console.error("Missing teamId or email in whitelist request");
      return NextResponse.json({ error: "Team ID and email are required" }, { status: 400 });
    }

    const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $addToSet: { whitelist: email } });

    if (result.modifiedCount === 0) {
      console.error(`Failed to whitelist email ${email} for team ${teamId}`);
      return NextResponse.json({ error: "Failed to whitelist email" }, { status: 500 });
    }

    console.log(`Successfully whitelisted ${email} for team ${teamId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in POST /api/teams/whitelist: ${err}`);
    return NextResponse.json({ error: "Invalid teamId or server error" }, { status: 400 });
  }
}
