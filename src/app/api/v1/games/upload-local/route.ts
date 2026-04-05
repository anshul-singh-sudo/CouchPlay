import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  // Only allow this route in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 });
  }

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure public/roms exists
    const romsDir = path.join(process.cwd(), "public", "roms");
    await fs.mkdir(romsDir, { recursive: true });

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const generatedFileName = `${Date.now()}-${safeFilename}`;
    const filePath = path.join(romsDir, generatedFileName);

    await fs.writeFile(filePath, buffer);

    const r2Key = `roms/${generatedFileName}`; 

    return NextResponse.json({ r2Key }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/games/upload-local]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
