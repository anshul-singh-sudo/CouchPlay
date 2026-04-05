import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/sessions/[code]/join — Join session & get playerIndex
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const code = params.code.toUpperCase();
    const body = await req.json();
    const { role } = body; // "screen" | "controller"

    // Check if session exists
    const [session] = await db
      .select({ code: sessions.code, maxPlayers: sessions.maxPlayers })
      .from(sessions)
      .where(eq(sessions.code, code))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get current players to assign next available index
    const existing = await db
      .select({ playerIndex: sessionPlayers.playerIndex, userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(eq(sessionPlayers.sessionCode, code));

    let assignedIndex = 1;

    // Has user already joined?
    const myExisting = existing.find(p => p.userId === user.id);
    if (myExisting) {
      assignedIndex = myExisting.playerIndex;
    } else {
      // Find lowest available index 1..4 (for controllers)
      // Note: screen role is usually index 1, so controllers start assigning around it or they are mostly controllers taking 1..4
      // Actually, screen is often the host and they might not be playing. 
      // Controllers always take 1,2,3,4
      const usedIndexes = existing.map(p => p.playerIndex);
      for (let i = 1; i <= Math.min(4, session.maxPlayers); i++) {
        if (!usedIndexes.includes(i)) {
          assignedIndex = i;
          break;
        }
      }

      await db.insert(sessionPlayers).values({
        sessionCode: code,
        userId: user.id,
        role,
        playerIndex: assignedIndex,
      });
    }

    return NextResponse.json({ playerIndex: assignedIndex });
  } catch (err) {
    console.error("[POST /api/v1/sessions/:code/join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
