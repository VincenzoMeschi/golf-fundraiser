import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!sig) {
    console.error("No signature provided");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log(`Received event: ${event.type}`);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.metadata.userId;
      const spots = parseInt(session.metadata.spots || "1");
      const spotDetails = JSON.parse(session.metadata.spotDetails || "[]");

      // Check for email uniqueness across all reservations
      const existingEmails = await db
        .collection("registrations")
        .aggregate([{ $unwind: "$spotDetails" }, { $group: { _id: "$spotDetails.email" } }])
        .toArray();
      const existingEmailSet = new Set(existingEmails.map((e) => e._id));

      for (const spot of spotDetails) {
        if (existingEmailSet.has(spot.email)) {
          console.error(`Email ${spot.email} already exists in another reservation`);
          return NextResponse.json({ error: `Email ${spot.email} is already in use` }, { status: 400 });
        }
        existingEmailSet.add(spot.email); // Add to set for this batch
      }

      const spotsWithIds = spotDetails.map((detail: any) => ({
        spotId: new ObjectId().toString(),
        ...detail,
      }));

      await db.collection("registrations").insertOne({
        userId,
        spots,
        spotDetails: spotsWithIds,
        paymentStatus: "completed",
        amount: session.amount_total / 100,
        createdAt: new Date(),
        stripeSessionId: session.id,
      });
      break;
    }

    case "payment_intent.succeeded":
    case "charge.succeeded":
    case "payment_intent.payment_failed":
    case "charge.refunded":
    case "charge.dispute.created":
    case "charge.dispute.closed":
      // Unchanged cases omitted for brevity
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
