import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, games } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET /api/v1/sessions/[code] — Fetch session details including game info
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();

    const [session] = await db
      .select({
        code: sessions.code,
        status: sessions.status,
        gameSlug: sessions.gameSlug,
        maxPlayers: sessions.maxPlayers,
        // Game details via join
        gameTitle: games.title,
        gameSystem: games.system,
        gameCoverArt: games.coverArtUrl,
        gameR2Key: games.r2Key,
      })
      .from(sessions)
      .leftJoin(games, eq(sessions.gameSlug, games.slug))
      .where(and(eq(sessions.code, code), isNull(sessions.closedAt)))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found or closed" }, { status: 404 });
    }

    // Get signed ROM URL from R2 (expires in 30 minutes)
    let romUrl = "";
    if (session.gameR2Key) {
      const { getSignedRomUrl } = await import("@/lib/r2");
      romUrl = await getSignedRomUrl(session.gameR2Key);
    }

    // Count active players in this session
    const players = await db
      .select({
        userId: sessionPlayers.userId,
        role: sessionPlayers.role,
        playerIndex: sessionPlayers.playerIndex,
      })
      .from(sessionPlayers)
      .where(
        and(
          eq(sessionPlayers.sessionCode, code),
          isNull(sessionPlayers.leftAt)
        )
      );

    return NextResponse.json({
      code: session.code,
      status: session.status,
      gameSlug: session.gameSlug,
      title: session.gameTitle,
      system: session.gameSystem,
      coverArtUrl: session.gameCoverArt,
      romUrl,
      players,
      playerCount: players.length,
      maxPlayers: session.maxPlayers,
    });
  } catch (err) {
    console.error("[GET /api/v1/sessions/:code]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/v1/sessions/[code] — Update session status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    const body = await req.json();
    const { status } = body;

    if (!["waiting", "active", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(sessions)
      .set({
        status,
        ...(status === "closed" ? { closedAt: new Date() } : {}),
      })
      .where(eq(sessions.code, code))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/v1/sessions/:code]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
