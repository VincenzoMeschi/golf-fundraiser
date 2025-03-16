import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  const { spots, donation, userId, spotDetails } = await request.json();
  const origin = request.headers.get("origin") || "http://localhost:3000";
  const { db } = await connectToDatabase();

  try {
    // Calculate current total spots for the user
    const userRegistrations = await db
      .collection("registrations")
      .find({
        userId,
        paymentStatus: "completed",
      })
      .toArray();
    const currentTotalSpots = userRegistrations.reduce((sum, reg) => sum + reg.spots, 0);

    const newTotalSpots = currentTotalSpots + spots;
    if (newTotalSpots > 4) {
      console.error(`User ${userId} attempted to exceed 4 spots: current=${currentTotalSpots}, new=${spots}`);
      return NextResponse.json({ error: `Cannot purchase ${spots} more spot(s). You already have ${currentTotalSpots}, and the maximum is 4.` }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Golf Outing Registration",
            },
            unit_amount: donation * 100,
          },
          quantity: spots,
        },
      ],
      mode: "payment",
      success_url: `${origin}/teams?success=true&session_id={CHECKOUT_SESSION_ID}`, // Redirect to Teams page on success
      cancel_url: `${origin}/register?cancel=true`,
      metadata: {
        userId,
        spots: spots.toString(),
        spotDetails: JSON.stringify(spotDetails),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/checkout: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
