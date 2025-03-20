import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  const { price, userId, name, logo, text, websiteLink } = await request.json();
  const origin = request.headers.get("origin") || "http://localhost:3000";
  const { db } = await connectToDatabase();

  try {
    // Check if the user already has a sponsor
    const existingSponsor = await db.collection("sponsors").findOne({ userId });
    if (existingSponsor) {
      console.error(`User ${userId} already has a sponsor`);
      return NextResponse.json({ error: "You already have a sponsor. You can edit your existing sponsorship." }, { status: 400 });
    }

    // Validate price (minimum $200)
    if (price < 200) {
      return NextResponse.json({ error: "Price must be at least $200" }, { status: 400 });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Golf Outing Sponsorship",
            },
            unit_amount: price * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/sponsor?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sponsor?cancel=true`,
      metadata: {
        userId,
        name,
        price: price.toString(),
        logo: logo || "",
        text: text || "",
        websiteLink: websiteLink || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/sponsor/create-checkout-session: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
