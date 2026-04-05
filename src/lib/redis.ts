import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Local fallback to null if env variables are not provided
// We only initialize the client when env variables exist.
export const redis = url && token ? new Redis({ url, token }) : null;
