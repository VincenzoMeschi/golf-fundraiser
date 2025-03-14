import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function PUT(request: Request) {
  const { userId, spotId, updatedDetails } = await request.json();
  const { db } = await connectToDatabase();

  try {
    // Check if the updated email is already in use by another spot
    const existingEmails = await db
      .collection("registrations")
      .aggregate([
        { $unwind: "$spotDetails" },
        { $match: { "spotDetails.spotId": { $ne: spotId } } }, // Exclude the current spot
        { $group: { _id: "$spotDetails.email" } },
      ])
      .toArray();
    const existingEmailSet = new Set(existingEmails.map((e) => e._id));

    if (existingEmailSet.has(updatedDetails.email)) {
      console.error(`Email ${updatedDetails.email} is already in use by another reservation`);
      return NextResponse.json({ error: `Email ${updatedDetails.email} is already in use` }, { status: 400 });
    }

    const result = await db
      .collection("registrations")
      .updateOne(
        { userId, "spotDetails.spotId": spotId },
        { $set: { "spotDetails.$.name": updatedDetails.name, "spotDetails.$.phone": updatedDetails.phone, "spotDetails.$.email": updatedDetails.email } }
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Spot not found or not updated" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in PUT /api/teams/edit-spot: ${err}`);
    return NextResponse.json({ error: "Invalid spotId or server error" }, { status: 400 });
  }
}
