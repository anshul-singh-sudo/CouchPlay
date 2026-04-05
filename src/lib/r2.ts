/**
 * Cloudflare R2 client using the S3-compatible API via @aws-sdk/client-s3.
 * R2 bucket keys are NEVER sent to the client — only signed URLs with expiry.
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });
  return _client;
}

/**
 * Generate a pre-signed GET URL for a ROM or save state.
 * Expires in 30 minutes.
 */
export async function getSignedRomUrl(r2Key: string, expiresInSeconds = 1800): Promise<string> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY) {
    // Development fallback — return a local placeholder path
    return `/roms/${r2Key.split("/").pop()}`;
  }

  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key });
  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a pre-signed PUT URL for uploading a save state.
 * Client uploads directly to R2 — API server never handles blob bytes.
 */
export async function getSignedUploadUrl(
  r2Key: string,
  contentLength?: number
): Promise<{ uploadUrl: string; r2Key: string }> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY) {
    return { uploadUrl: `/api/v1/saves/upload?key=${r2Key}`, r2Key };
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    ContentLength: contentLength,
  });
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 600 }); // 10 min
  return { uploadUrl, r2Key };
}
