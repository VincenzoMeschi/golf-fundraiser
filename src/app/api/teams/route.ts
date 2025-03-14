// /app/api/teams/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const { db } = await connectToDatabase();
  const teams = await db.collection("teams").find({}).toArray();
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const { name, isPrivate, creatorId, initialSpots } = await request.json();
  const { db } = await connectToDatabase();

  const registration = await db.collection("registrations").findOne({
    userId: creatorId,
    paymentStatus: "completed",
  });

  if (!registration || registration.spots < initialSpots.length) {
    return NextResponse.json({ error: "Not enough spots available" }, { status: 400 });
  }

  const team = {
    name,
    isPrivate,
    creatorId,
    members: initialSpots.map((spotId: string) => ({
      spotId,
      registrationId: registration._id.toString(),
    })),
    whitelist: [],
    createdAt: new Date(),
  };

  const result = await db.collection("teams").insertOne(team);
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const { teamId, spotId, userId, isPrivate } = await request.json();
  const { db } = await connectToDatabase();

  try {
    const team = await db.collection("teams").findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      console.error(`Team not found for teamId: ${teamId}`);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Handle adding a spot to the team
    if (spotId) {
      if (team.members.length >= 4) {
        return NextResponse.json({ error: "Team is full" }, { status: 400 });
      }

      const registration = await db.collection("registrations").findOne({
        userId,
        paymentStatus: "completed",
        "spotDetails.spotId": spotId,
      });

      if (!registration) {
        return NextResponse.json({ error: "Spot not found or not owned by user" }, { status: 400 });
      }

      const spotInUse = await db.collection("teams").findOne({
        "members.spotId": spotId,
      });
      if (spotInUse) {
        return NextResponse.json({ error: "Spot already assigned to a team" }, { status: 400 });
      }

      const spotEmail = registration.spotDetails.find((s: any) => s.spotId === spotId)?.email;
      if (team.isPrivate && !team.whitelist.includes(spotEmail)) {
        return NextResponse.json({ error: "Not authorized to join private team" }, { status: 403 });
      }

      const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $addToSet: { members: { spotId, registrationId: registration._id.toString() } } });

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "Failed to add spot to team" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle toggling team privacy
    if (typeof isPrivate === "boolean") {
      if (team.creatorId !== userId) {
        return NextResponse.json({ error: "Only the creator can update team privacy" }, { status: 403 });
      }

      const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $set: { isPrivate } });

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "Failed to update team privacy" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // If neither spotId nor isPrivate is provided, return an error
    return NextResponse.json({ error: "Invalid request: provide spotId or isPrivate" }, { status: 400 });
  } catch (err) {
    console.error(`Error in PUT /api/teams: ${err}`);
    return NextResponse.json({ error: "Invalid teamId or server error" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { teamId, spotId, userId } = await request.json();
  const { db } = await connectToDatabase();

  try {
    const team = await db.collection("teams").findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      console.error(`Team not found for teamId: ${teamId}`);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if the user is the team creator
    if (team.creatorId !== userId) {
      return NextResponse.json({ error: "Only the team creator can remove spots" }, { status: 403 });
    }

    // Verify the spot exists in the team
    const memberIndex = team.members.findIndex((m: any) => m.spotId === spotId);
    if (memberIndex === -1) {
      return NextResponse.json({ error: "Spot not found in team" }, { status: 400 });
    }

    // Remove the spot from the team without reassigning
    const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $pull: { members: { spotId } } });

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to remove spot or not found" }, { status: 500 });
    }

    // Check if the team is now empty and delete it if so
    const updatedTeam = await db.collection("teams").findOne({ _id: new ObjectId(teamId) });
    if (updatedTeam?.members.length === 0) {
      await db.collection("teams").deleteOne({ _id: new ObjectId(teamId) });
      console.log(`Deleted team ${teamId} as it has no members`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in PATCH /api/teams: ${err}`);
    return NextResponse.json({ error: "Invalid teamId or spotId" }, { status: 400 });
  }
}
