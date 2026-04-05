import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const { filename, contentType } = body;
    
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    const s3Endpoint = process.env.S3_ENDPOINT || "";
    const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || "";
    const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";
    const s3Bucket = process.env.S3_BUCKET || "";

    if (!s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey || !s3Bucket) {
        console.warn("[POST /api/v1/games/presigned-url] Missing S3/R2 Environment Variables");
        // We log warning but don't strictly crash here unless called in production since dev should bypass this mostly
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
    });

    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const generatedFileName = `${Date.now()}-${safeFilename}`;
    const r2Key = `roms/${generatedFileName}`;
    
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: r2Key,
      ContentType: contentType || "application/octet-stream",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ url, r2Key });
  } catch (err) {
    console.error("[POST /api/v1/games/presigned-url]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
