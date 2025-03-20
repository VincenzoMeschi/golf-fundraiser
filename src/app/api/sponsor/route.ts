import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Define the type for sponsor data
interface SponsorData {
  userId: string;
  name: string;
  price: number;
  createdAt: Date;
  logo?: string;
  text?: string;
  websiteLink?: string;
}

// GET: Fetch the sponsor for the logged-in user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const sponsor = await db.collection("sponsors").findOne({ userId });
    return NextResponse.json(sponsor || null);
  } catch (err) {
    console.error(`Error in GET /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Create a new sponsor (called after Stripe payment)
export async function POST(request: Request) {
  const { userId, name, price, logo, text, websiteLink } = await request.json();

  if (!userId || !name || !price) {
    return NextResponse.json({ error: "User ID, name, and price are required" }, { status: 400 });
  }

  if (!logo && !text) {
    return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });
  }

  if (price < 200) {
    return NextResponse.json({ error: "Price must be at least $200" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const existingSponsor = await db.collection("sponsors").findOne({ userId });
    if (existingSponsor) {
      return NextResponse.json({ error: "User already has a sponsor" }, { status: 400 });
    }

    // Define sponsorData with the correct type
    const sponsorData: SponsorData = { userId, name, price, createdAt: new Date() };
    if (logo) sponsorData.logo = logo;
    if (text) sponsorData.text = text;
    if (websiteLink) sponsorData.websiteLink = websiteLink;

    const result = await db.collection("sponsors").insertOne(sponsorData);
    return NextResponse.json({ success: true, sponsorId: result.insertedId });
  } catch (err) {
    console.error(`Error in POST /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Update an existing sponsor
export async function PUT(request: Request) {
  const { userId, name, logo, text, websiteLink } = await request.json();

  if (!userId || !name) {
    return NextResponse.json({ error: "User ID and name are required" }, { status: 400 });
  }

  if (!logo && !text) {
    return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    // Build the $set object with only defined fields
    const updateData: { [key: string]: any } = {
      name,
      updatedAt: new Date(),
    };
    if (logo) updateData.logo = logo;
    if (text) updateData.text = text;
    if (websiteLink) updateData.websiteLink = websiteLink;

    // Build the $unset object for fields that are undefined or empty
    const unsetData: { [key: string]: string } = {};
    if (!logo) unsetData.logo = "";
    if (!text) unsetData.text = "";
    if (!websiteLink) unsetData.websiteLink = "";

    const result = await db.collection("sponsors").updateOne(
      { userId },
      {
        $set: updateData,
        ...(Object.keys(unsetData).length > 0 ? { $unset: unsetData } : {}),
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in PUT /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
