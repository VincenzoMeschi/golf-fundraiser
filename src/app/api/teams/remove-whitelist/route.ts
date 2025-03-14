import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const { teamId, email } = await request.json();
  const { db } = await connectToDatabase();

  try {
    if (!teamId || !email) {
      console.error("Missing teamId or email in remove-whitelist request");
      return NextResponse.json({ error: "Team ID and email are required" }, { status: 400 });
    }

    const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $pull: { whitelist: email } });

    if (result.modifiedCount === 0) {
      console.error(`Failed to remove whitelist email ${email} from team ${teamId}`);
      return NextResponse.json({ error: "Failed to remove whitelist email" }, { status: 500 });
    }

    console.log(`Successfully removed whitelist ${email} from team ${teamId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in POST /api/teams/remove-whitelist: ${err}`);
    return NextResponse.json({ error: "Invalid teamId or server error" }, { status: 400 });
  }
}
