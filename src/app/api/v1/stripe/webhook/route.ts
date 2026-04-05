import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

// POST /api/v1/stripe/webhook — Handle Stripe subscription events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseUserId = (event.data.object as Stripe.Subscription)
    ?.metadata?.supabase_user_id;

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const plan = sub.status === "active" ? "pro" : "free";

        await db
          .insert(subscriptions)
          .values({
            userId: supabaseUserId!,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            plan,
            status: sub.status,
            currentPeriodEnd: new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeSubscriptionId: sub.id,
              plan,
              status: sub.status,
              currentPeriodEnd: new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
              updatedAt: new Date(),
            },
          });

        // Also update the user table's subscriptionTier for quick reads
        if (supabaseUserId) {
          await db
            .update(users)
            .set({ subscriptionTier: plan, updatedAt: new Date() })
            .where(eq(users.id, supabaseUserId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (supabaseUserId) {
          await db
            .update(subscriptions)
            .set({ plan: "free", status: "canceled", updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));

          await db
            .update(users)
            .set({ subscriptionTier: "free", updatedAt: new Date() })
            .where(eq(users.id, supabaseUserId));
        }
        break;
      }

      default:
        // Acknowledge but ignore unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
