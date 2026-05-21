import { NextRequest, NextResponse } from "next/server";
import { currency, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { amount, description, currency: bodyCurrency } = (await req.json()) as {
      amount: number;
      description: string;
      currency?: string;
    };

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 },
      );
    }
    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }

    const cur = (bodyCurrency || currency()).toLowerCase();

    // Build the post-payment redirect target. Prefers NEXT_PUBLIC_APP_URL,
    // falls back to the incoming request origin so it works behind Vercel
    // preview URLs without extra config.
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      req.nextUrl.origin;
    const successUrl = new URL("/paid", origin);
    successUrl.searchParams.set("amount", String(amount));
    successUrl.searchParams.set("currency", cur);
    successUrl.searchParams.set("description", description);

    const link = await stripe().paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: cur,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: description,
            },
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: { url: successUrl.toString() },
      },
    });

    return NextResponse.json({
      url: link.url,
      payment_link_id: link.id,
      amount,
      currency: cur,
      description,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
