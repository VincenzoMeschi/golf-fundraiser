import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Define the Team interface to match the MongoDB document structure
interface Team {
  _id: ObjectId;
  name: string;
  isPrivate: boolean;
  creatorId: string;
  members: Array<{ spotId: string; registrationId: string }>;
  whitelist: string[]; // Define whitelist as an array of strings
  createdAt: Date;
}

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
  const { teamId, spotId, userId, isPrivate, whitelist, name } = await request.json();
  const { db } = await connectToDatabase();

  try {
    const team = (await db.collection("teams").findOne({ _id: new ObjectId(teamId) })) as Team | null;
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

      const spotDetails = registration.spotDetails.find((s: any) => s.spotId === spotId);
      if (!spotDetails) {
        return NextResponse.json({ error: "Spot details not found" }, { status: 400 });
      }

      const spotEmail = spotDetails.email?.toLowerCase();
      const spotName = spotDetails.name?.toLowerCase();

      console.log(`Join attempt - spotId: ${spotId}, spotEmail: ${spotEmail}, spotName: ${spotName}, whitelist: ${team.whitelist}`);

      // Check if the spot's email or name is in the whitelist (case-insensitive)
      if (team.isPrivate && !team.whitelist.some((w: string) => w.toLowerCase() === spotEmail || w.toLowerCase() === spotName)) {
        return NextResponse.json({ error: "Not authorized to join private team" }, { status: 403 });
      }

      const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $addToSet: { members: { spotId, registrationId: registration._id.toString() } } });

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "No changes provided by user" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle updating team privacy, whitelist, and/or name
    if (typeof isPrivate === "boolean" || (whitelist && Array.isArray(whitelist)) || typeof name === "string") {
      if (team.creatorId !== userId) {
        return NextResponse.json({ error: "Only the creator can update team details" }, { status: 403 });
      }

      const updateFields: any = {};
      if (typeof isPrivate === "boolean") {
        updateFields.isPrivate = isPrivate;
      }
      if (whitelist && Array.isArray(whitelist)) {
        updateFields.whitelist = whitelist;
      }
      if (typeof name === "string" && name.trim() !== "") {
        updateFields.name = name.trim();
      }

      if (Object.keys(updateFields).length === 0) {
        return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
      }

      const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $set: updateFields });

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // If neither spotId, isPrivate, whitelist, nor name is provided, return an error
    return NextResponse.json({ error: "Invalid request: provide spotId, isPrivate, whitelist, or name" }, { status: 400 });
  } catch (err) {
    console.error(`Error in PUT /api/teams: ${err}`);
    return NextResponse.json({ error: "Invalid teamId or server error" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { teamId, spotId, userId } = await request.json();
  const { db } = await connectToDatabase();

  try {
    const team = (await db.collection("teams").findOne({ _id: new ObjectId(teamId) })) as Team | null;
    if (!team) {
      console.error(`Team not found for teamId: ${teamId}`);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify the spot exists in the team
    const memberIndex = team.members.findIndex((m: any) => m.spotId === spotId);
    if (memberIndex === -1) {
      return NextResponse.json({ error: "Spot not found in team" }, { status: 400 });
    }

    // Check if the user owns the spot or the team
    const ownsSpot = await db.collection("registrations").findOne({
      userId,
      paymentStatus: "completed",
      "spotDetails.spotId": spotId,
    });
    const ownsTeam = team.creatorId === userId;

    if (!ownsSpot && !ownsTeam) {
      return NextResponse.json({ error: "User does not own the spot or the team" }, { status: 403 });
    }

    // Remove the spot from the team
    const result = await db.collection("teams").updateOne({ _id: new ObjectId(teamId) }, { $pull: { members: { spotId } } });

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to remove spot or not found" }, { status: 500 });
    }

    // Check if the team is now empty and delete it if so
    const updatedTeam = (await db.collection("teams").findOne({ _id: new ObjectId(teamId) })) as Team | null;
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
