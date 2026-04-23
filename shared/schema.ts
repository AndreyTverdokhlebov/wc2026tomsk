import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().default(""),
  password: text("password").notNull(),
  points: integer("points").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, points: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Matches
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchNumber: integer("match_number").notNull(),
  group: text("group").notNull(),
  round: text("round").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeamFlag: text("home_team_flag").notNull(),
  awayTeamFlag: text("away_team_flag").notNull(),
  matchDate: text("match_date").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("upcoming"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Match predictions
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  matchId: integer("match_id").notNull(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  points: integer("points").notNull().default(0),
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, points: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

// Group standing predictions
export const groupPredictions = pgTable("group_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  group: text("group").notNull(),
  pos1: text("pos1").notNull(),
  pos2: text("pos2").notNull(),
  pos3: text("pos3").notNull(),
  pos4: text("pos4").notNull(),
  points: integer("points").notNull().default(0),
});

export const insertGroupPredictionSchema = createInsertSchema(groupPredictions).omit({ id: true, points: true });
export type InsertGroupPrediction = z.infer<typeof insertGroupPredictionSchema>;
export type GroupPrediction = typeof groupPredictions.$inferSelect;
