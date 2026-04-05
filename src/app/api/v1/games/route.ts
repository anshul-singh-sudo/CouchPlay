import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq, ilike, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/games — List games with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const system = searchParams.get("system");
  const featured = searchParams.get("featured");
  const search = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions = [eq(games.isActive, true)];
  if (system) conditions.push(eq(games.system, system));
  if (featured === "true") conditions.push(eq(games.isFeatured, true));

  let query = db
    .select({
      slug: games.slug,
      title: games.title,
      system: games.system,
      publisher: games.publisher,
      releaseYear: games.releaseYear,
      coverArtUrl: games.coverArtUrl,
      thumbnailUrl: games.thumbnailUrl,
      isFeatured: games.isFeatured,
      playCount: games.playCount,
      description: games.description,
    })
    .from(games)
    .where(and(...conditions));

  if (search) {
    // Simple search by title — in production use Postgres full-text search
    query = db
      .select({
        slug: games.slug,
        title: games.title,
        system: games.system,
        publisher: games.publisher,
        releaseYear: games.releaseYear,
        coverArtUrl: games.coverArtUrl,
        thumbnailUrl: games.thumbnailUrl,
        isFeatured: games.isFeatured,
        playCount: games.playCount,
        description: games.description,
      })
      .from(games)
      .where(and(...conditions, ilike(games.title, `%${search}%`)));
  }

  const result = await query
    .orderBy(desc(games.playCount))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ games: result, limit, offset });
}

// POST /api/v1/games — Admin: add a game (requires admin role)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Admin check via DB
    const [dbUser] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      slug, title, system, description, publisher,
      releaseYear, r2Key, coverArtUrl, thumbnailUrl, isFeatured
    } = body;

    if (!slug || !title || !system || !r2Key) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, system, r2Key" },
        { status: 400 }
      );
    }

    const [game] = await db
      .insert(games)
      .values({ slug, title, system, description, publisher, releaseYear, r2Key, coverArtUrl, thumbnailUrl, isFeatured })
      .returning();

    return NextResponse.json(game, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/games]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
