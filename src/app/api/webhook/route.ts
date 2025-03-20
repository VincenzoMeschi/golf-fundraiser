import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  console.log("Webhook received at:", new Date().toISOString());
  console.log("Signature:", sig);

  if (!sig) {
    console.error("No signature provided");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`Received event: ${event.type}`);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let db;
  try {
    const { db: database } = await connectToDatabase();
    db = database;
    console.log("Connected to database successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.metadata.userId;
      console.log("Session metadata:", JSON.stringify(session.metadata, null, 2));

      if (!userId) {
        console.error("No userId found in session metadata");
        return NextResponse.json({ error: "Missing userId in metadata" }, { status: 400 });
      }

      // Handle registration payments
      if (session.metadata.spots) {
        console.log("Processing registration payment for user:", userId);
        const spots = parseInt(session.metadata.spots || "1");
        let spotDetails;
        try {
          spotDetails = JSON.parse(session.metadata.spotDetails || "[]");
        } catch (parseErr) {
          console.error("Failed to parse spotDetails:", parseErr);
          return NextResponse.json({ error: "Invalid spotDetails format" }, { status: 400 });
        }

        // Check for existing emails across all registrations
        const existingEmails = await db
          .collection("registrations")
          .aggregate([{ $unwind: "$spotDetails" }, { $group: { _id: "$spotDetails.email" } }])
          .toArray();
        const existingEmailSet = new Set(existingEmails.map((e) => e._id));
        console.log("Existing emails in database:", existingEmailSet);

        for (const spot of spotDetails) {
          if (existingEmailSet.has(spot.email)) {
            console.error(`Email ${spot.email} already exists in another reservation`);
            return NextResponse.json({ error: `Email ${spot.email} is already in use` }, { status: 400 });
          }
          existingEmailSet.add(spot.email);
        }

        const spotsWithIds = spotDetails.map((detail: any) => ({
          spotId: new ObjectId().toString(),
          ...detail,
        }));
        console.log("Spots with IDs to process:", spotsWithIds);

        // Check if a registration already exists for this user
        const existingRegistration = await db.collection("registrations").findOne({
          userId,
          paymentStatus: "completed",
        });

        if (existingRegistration) {
          // Update existing registration: append to spotDetails and increment spots
          const updateResult = await db.collection("registrations").updateOne(
            { _id: existingRegistration._id },
            {
              $push: { spotDetails: { $each: spotsWithIds } }, // Append new spots to array
              $inc: { spots: spots }, // Increment the spots count
              $set: {
                amount: (existingRegistration.amount || 0) + session.amount_total / 100, // Add new payment amount
                stripeSessionId: session.id, // Update to latest session ID (or consider storing an array of session IDs)
              },
            }
          );

          if (updateResult.modifiedCount === 0) {
            console.error("Failed to update existing registration");
            return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
          }
          console.log("Updated existing registration with ID:", existingRegistration._id);
        } else {
          // Create new registration if none exists
          const insertResult = await db.collection("registrations").insertOne({
            userId,
            spots,
            spotDetails: spotsWithIds,
            paymentStatus: "completed",
            amount: session.amount_total / 100,
            createdAt: new Date(),
            stripeSessionId: session.id,
          });
          console.log("Inserted new registration with ID:", insertResult.insertedId);
        }
      }

      // Handle sponsorship payments (unchanged)
      if (session.metadata.type === "sponsorship") {
        console.log("Processing sponsorship payment for user:", userId);
        const { businessName, signOption, signText, logoUrl } = session.metadata;

        try {
          const insertResult = await db.collection("sponsorships").insertOne({
            userId,
            businessName,
            amount: session.amount_total / 100,
            signOption,
            signText: signOption === "text" || signOption === "both" ? signText : "",
            logoUrl: signOption === "logo" || signOption === "both" ? logoUrl : "",
            createdAt: new Date(),
            stripeSessionId: session.id,
          });
          console.log("Inserted sponsorship with ID:", insertResult.insertedId);
        } catch (err) {
          console.error("Failed to insert sponsorship:", err);
          return NextResponse.json({ error: "Failed to save sponsorship" }, { status: 500 });
        }
      }
      break;
    }

    case "payment_intent.succeeded":
    case "charge.succeeded":
    case "payment_intent.payment_failed":
    case "charge.refunded":
    case "charge.dispute.created":
    case "charge.dispute.closed":
      console.log(`Event ${event.type} received but not processed`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
