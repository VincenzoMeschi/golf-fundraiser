import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

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

// POST: Create a new sponsor
export async function POST(request: Request) {
  const { userId, name, price, logo, websiteLink } = await request.json();

  if (!userId || !name || !price || !logo || !websiteLink) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
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

    const result = await db.collection("sponsors").insertOne({
      userId,
      name,
      price,
      logo,
      websiteLink,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, sponsorId: result.insertedId });
  } catch (err) {
    console.error(`Error in POST /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Update an existing sponsor
export async function PUT(request: Request) {
  const { userId, name, price, logo, websiteLink } = await request.json();

  if (!userId || !name || !price || !logo || !websiteLink) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (price < 200) {
    return NextResponse.json({ error: "Price must be at least $200" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("sponsors").updateOne(
      { userId },
      {
        $set: {
          name,
          price,
          logo,
          websiteLink,
          updatedAt: new Date(),
        },
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
