import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { saves, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSignedUploadUrl } from "@/lib/r2";

// GET /api/v1/saves — List user's saves for a game
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const gameSlug = searchParams.get("gameSlug");

    const conditions = [eq(saves.userId, user.id)];
    if (gameSlug) conditions.push(eq(saves.gameSlug, gameSlug));

    const result = await db
      .select({
        id: saves.id,
        gameSlug: saves.gameSlug,
        label: saves.label,
        slot: saves.slot,
        sizeBytes: saves.sizeBytes,
        createdAt: saves.createdAt,
        updatedAt: saves.updatedAt,
        // Don't send r2Key — only send download URL generated server-side
      })
      .from(saves)
      .where(and(...conditions));

    return NextResponse.json({ saves: result });
  } catch (err) {
    console.error("[GET /api/v1/saves]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/saves — Request presigned upload URL for a save state
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { gameSlug, label = "Quick Save", slot = 0, sizeBytes } = body;

    if (!gameSlug) {
      return NextResponse.json({ error: "gameSlug required" }, { status: 400 });
    }

    // Enforce free tier: max 1 save per game
    const [sub] = await db
      .select({ plan: subscriptions.plan })
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    const isPro = sub?.plan === "pro";

    if (!isPro) {
      const existingSaves = await db
        .select({ id: saves.id })
        .from(saves)
        .where(and(eq(saves.userId, user.id), eq(saves.gameSlug, gameSlug)));

      if (existingSaves.length >= 1) {
        return NextResponse.json(
          {
            error: "Save limit reached",
            code: "SAVE_LIMIT",
            message: "Free plan allows 1 save per game. Upgrade to Pro for unlimited saves.",
          },
          { status: 403 }
        );
      }
    }

    // Generate R2 key and presigned upload URL
    const r2Key = `saves/${user.id}/${gameSlug}/slot-${slot}-${Date.now()}.state`;
    const { uploadUrl } = await getSignedUploadUrl(r2Key, sizeBytes);

    // Insert save record (client will confirm upload via PATCH)
    const [save] = await db
      .insert(saves)
      .values({ userId: user.id, gameSlug, label, slot, r2Key, sizeBytes })
      .returning({ id: saves.id, r2Key: saves.r2Key });

    return NextResponse.json({ saveId: save.id, uploadUrl }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/saves]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/v1/saves?id=... — Delete a save
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const saveId = searchParams.get("id");
    if (!saveId) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db
      .delete(saves)
      .where(and(eq(saves.id, saveId), eq(saves.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/v1/saves]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
