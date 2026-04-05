import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSignedRomUrl } from "@/lib/r2";

// GET /api/v1/games/[slug] — Single game detail + signed ROM URL
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.slug, params.slug))
      .limit(1);

    if (!game || !game.isActive) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Generate a 30-minute signed URL — never expose raw R2 key to client
    const romUrl = await getSignedRomUrl(game.r2Key);

    return NextResponse.json({
      slug: game.slug,
      title: game.title,
      system: game.system,
      description: game.description,
      publisher: game.publisher,
      releaseYear: game.releaseYear,
      coverArtUrl: game.coverArtUrl,
      thumbnailUrl: game.thumbnailUrl,
      isFeatured: game.isFeatured,
      playCount: game.playCount,
      romUrl, // Signed, time-limited
    });
  } catch (err) {
    console.error("[GET /api/v1/games/:slug]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
