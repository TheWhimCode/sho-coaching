import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });

export async function POST(req: Request) {
  const { pi, method } = await req.json();
  // load booking/amount from DB using piId or bookingId
  const session = await stripe.checkout.sessions.create({
    payment_method_types: [method],
    mode: "payment",
    line_items: [{ price_data: { currency: "eur", product_data: { name: "Session" }, unit_amount: 1000 }, quantity: 1 }],
    success_url: `${req.headers.get("origin")}/checkout/success`,
    cancel_url: `${req.headers.get("origin")}/checkout`,
  });
  return new Response(JSON.stringify({ url: session.url }));
}
