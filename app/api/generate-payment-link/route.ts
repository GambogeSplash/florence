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
