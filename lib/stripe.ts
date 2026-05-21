import Stripe from "stripe";

let _client: Stripe | null = null;

export function stripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _client = new Stripe(key);
  return _client;
}

export function currency(): string {
  return (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
}
