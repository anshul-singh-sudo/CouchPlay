import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  subscriptionTier: text("subscription_tier").default("free"),
  isGuest: boolean("is_guest").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  r2Url: text("r2_url").notNull(),
  coreType: text("core_type").notNull(), // e.g. "snes", "psx"
  coverArt: text("cover_art"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  code: text("code").primaryKey(), // e.g. XKQP7
  hostId: uuid("host_id").references(() => users.id).notNull(),
  gameSlug: text("game_slug").references(() => games.slug),
  status: text("status").default("waiting"), // waiting, active, closed
  createdAt: timestamp("created_at").defaultNow(),
});

export const saves = pgTable("saves", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  gameSlug: text("game_slug").references(() => games.slug).notNull(),
  stateBlob: text("state_blob"), // URL or base64
  createdAt: timestamp("created_at").defaultNow(),
});
