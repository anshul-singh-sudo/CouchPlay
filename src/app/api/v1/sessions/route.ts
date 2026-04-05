import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, games } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createClient as createServerClient } from "@/lib/supabase/server";

/** Generate a 5-char alphanumeric session code, collision-checked */
async function generateSessionCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O/1/I ambiguity
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Check collision
    const existing = await db
      .select({ code: sessions.code })
      .from(sessions)
      .where(and(eq(sessions.code, code), isNull(sessions.closedAt)))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error("Could not generate unique session code after 10 attempts");
}

// POST /api/v1/sessions — Create a new session
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gameSlug } = body;

    // Validate game exists if provided
    if (gameSlug) {
      const game = await db
        .select({ slug: games.slug })
        .from(games)
        .where(and(eq(games.slug, gameSlug), eq(games.isActive, true)))
        .limit(1);
      if (game.length === 0) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
    }

    const code = await generateSessionCode();

    const [session] = await db
      .insert(sessions)
      .values({
        code,
        hostId: user.id,
        gameSlug: gameSlug || null,
        status: "waiting",
      })
      .returning();

    // Host auto-joins as "screen" player 
    await db.insert(sessionPlayers).values({
      sessionCode: code,
      userId: user.id,
      role: "screen",
      playerIndex: 1,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/sessions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/v1/sessions — List active sessions (admin use)
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";

    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.status, status))
      .limit(50);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/v1/sessions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
