import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // "free" | "pro"
  isGuest: boolean("is_guest").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  plan: text("plan").notNull().default("free"), // "free" | "pro"
  status: text("status").notNull().default("active"), // active | canceled | past_due | trialing
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── GAMES ────────────────────────────────────────────────────────────────────
export const games = pgTable("games", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  system: text("system").notNull(), // "snes" | "gba" | "psx" | "n64" | "psp" | "genesis"
  publisher: text("publisher"),
  releaseYear: integer("release_year"),
  r2Key: text("r2_key").notNull(), // The storage path in R2 bucket (never exposed directly)
  coverArtUrl: text("cover_art_url"), // Public CDN URL for cover art
  thumbnailUrl: text("thumbnail_url"), // Smaller thumb for carousels
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  playCount: integer("play_count").notNull().default(0),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  code: text("code").primaryKey(), // 5-char alphanumeric e.g. "XKQP7"
  hostId: uuid("host_id")
    .references(() => users.id)
    .notNull(),
  gameSlug: text("game_slug").references(() => games.slug),
  status: text("status").notNull().default("waiting"), // waiting | active | closed
  maxPlayers: integer("max_players").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

// ─── SESSION PLAYERS ──────────────────────────────────────────────────────────
// Tracks which users are in a session and their role/index
export const sessionPlayers = pgTable("session_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionCode: text("session_code")
    .references(() => sessions.code, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  role: text("role").notNull().default("controller"), // "screen" | "controller"
  playerIndex: integer("player_index").notNull().default(1), // 1..4
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

// ─── SAVES ────────────────────────────────────────────────────────────────────
export const saves = pgTable("saves", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  gameSlug: text("game_slug")
    .references(() => games.slug)
    .notNull(),
  label: text("label").notNull().default("Quick Save"),
  slot: integer("slot").notNull().default(0), // 0 = auto, 1-9 = manual slots
  r2Key: text("r2_key").notNull(), // R2 storage path for the save state blob
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  sessions: many(sessions),
  sessionPlayers: many(sessionPlayers),
  saves: many(saves),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  sessions: many(sessions),
  saves: many(saves),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  host: one(users, {
    fields: [sessions.hostId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [sessions.gameSlug],
    references: [games.slug],
  }),
  players: many(sessionPlayers),
}));

export const sessionPlayersRelations = relations(sessionPlayers, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionPlayers.sessionCode],
    references: [sessions.code],
  }),
  user: one(users, {
    fields: [sessionPlayers.userId],
    references: [users.id],
  }),
}));

export const savesRelations = relations(saves, ({ one }) => ({
  user: one(users, {
    fields: [saves.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [saves.gameSlug],
    references: [games.slug],
  }),
}));

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionPlayer = typeof sessionPlayers.$inferSelect;
export type Save = typeof saves.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
