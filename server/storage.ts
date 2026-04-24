import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and } from "drizzle-orm";
import {
  users, matches, predictions, groupPredictions,
  type User, type InsertUser,
  type Match, type InsertMatch,
  type Prediction, type InsertPrediction,
  type GroupPrediction, type InsertGroupPrediction,
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      match_number INTEGER NOT NULL,
      "group" TEXT NOT NULL,
      round TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_team_flag TEXT NOT NULL,
      away_team_flag TEXT NOT NULL,
      match_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT NOT NULL DEFAULT 'upcoming'
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      points INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS group_predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      "group" TEXT NOT NULL,
      pos1 TEXT NOT NULL,
      pos2 TEXT NOT NULL,
      pos3 TEXT NOT NULL,
      pos4 TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getLeaderboard(): Promise<User[]>;
  addUserPoints(userId: number, delta: number): Promise<void>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;

  // Matches
  getAllMatches(): Promise<Match[]>;
  getMatchById(id: number): Promise<Match | undefined>;
  seedMatches(): Promise<void>;

  // Match predictions
  createPrediction(data: InsertPrediction): Promise<Prediction>;
  getPredictionsByUser(userId: number): Promise<Prediction[]>;
  getPredictionByUserAndMatch(userId: number, matchId: number): Promise<Prediction | undefined>;
  updatePrediction(id: number, homeScore: number, awayScore: number): Promise<Prediction>;

  // Group predictions
  upsertGroupPrediction(data: InsertGroupPrediction): Promise<GroupPrediction>;
  getGroupPredictionsByUser(userId: number): Promise<GroupPrediction[]>;
  getGroupPredictionByUserAndGroup(userId: number, group: string): Promise<GroupPrediction | undefined>;
}

const flagMap: Record<string, string> = {
  "Мексика": "🇲🇽", "ЮАР": "🇿🇦", "Южная Корея": "🇰🇷", "Чехия": "🇨🇿",
  "Канада": "🇨🇦", "Босния и Герцеговина": "🇧🇦", "США": "🇺🇸", "Парагвай": "🇵🇾",
  "Катар": "🇶🇦", "Швейцария": "🇨🇭", "Бразилия": "🇧🇷", "Марокко": "🇲🇦",
  "Гаити": "🇭🇹", "Шотландия": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Австралия": "🇦🇺", "Турция": "🇹🇷",
  "Германия": "🇩🇪", "Кюрасао": "🇨🇼", "Нидерланды": "🇳🇱", "Япония": "🇯🇵",
  "Кот-д'Ивуар": "🇨🇮", "Эквадор": "🇪🇨", "Швеция": "🇸🇪", "Тунис": "🇹🇳",
  "Испания": "🇪🇸", "Кабо-Верде": "🇨🇻", "Бельгия": "🇧🇪", "Египет": "🇪🇬",
  "Саудовская Аравия": "🇸🇦", "Уругвай": "🇺🇾", "Иран": "🇮🇷", "Новая Зеландия": "🇳🇿",
  "Франция": "🇫🇷", "Сенегал": "🇸🇳", "Ирак": "🇮🇶", "Норвегия": "🇳🇴",
  "Аргентина": "🇦🇷", "Алжир": "🇩🇿", "Австрия": "🇦🇹", "Иордания": "🇯🇴",
  "Португалия": "🇵🇹", "ДР Конго": "🇨🇩", "Узбекистан": "🇺🇿", "Колумбия": "🇨🇴",
  "Гана": "🇬🇭", "Панама": "🇵🇦", "Англия": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Хорватия": "🇭🇷",
};

const matchData = [
  { n: 1, g: "A", r: "Групповой этап", h: "Мексика", a: "ЮАР", d: "2026-06-11T22:00:00+03:00", v: "Estadio Azteca", c: "Мехико" },
  { n: 2, g: "A", r: "Групповой этап", h: "Южная Корея", a: "Чехия", d: "2026-06-12T05:00:00+03:00", v: "Estadio Akron", c: "Гвадалахара" },
  { n: 25, g: "A", r: "Групповой этап", h: "Чехия", a: "ЮАР", d: "2026-06-18T19:00:00+03:00", v: "Mercedes-Benz Stadium", c: "Атланта" },
  { n: 28, g: "A", r: "Групповой этап", h: "Мексика", a: "Южная Корея", d: "2026-06-18T22:00:00+03:00", v: "Estadio Akron", c: "Гвадалахара" },
  { n: 53, g: "A", r: "Групповой этап", h: "Чехия", a: "Мексика", d: "2026-06-24T22:00:00+03:00", v: "Estadio Azteca", c: "Мехико" },
  { n: 54, g: "A", r: "Групповой этап", h: "ЮАР", a: "Южная Корея", d: "2026-06-24T22:00:00+03:00", v: "Estadio BBVA", c: "Монтеррей" },
  { n: 3, g: "B", r: "Групповой этап", h: "Канада", a: "Босния и Герцеговина", d: "2026-06-12T22:00:00+03:00", v: "BMO Field", c: "Торонто" },
  { n: 8, g: "B", r: "Групповой этап", h: "Катар", a: "Швейцария", d: "2026-06-13T22:00:00+03:00", v: "Levi's Stadium", c: "Санта-Клара" },
  { n: 26, g: "B", r: "Групповой этап", h: "Швейцария", a: "Босния и Герцеговина", d: "2026-06-18T22:00:00+03:00", v: "SoFi Stadium", c: "Лос-Анджелес" },
  { n: 27, g: "B", r: "Групповой этап", h: "Канада", a: "Катар", d: "2026-06-19T01:00:00+03:00", v: "BC Place", c: "Ванкувер" },
  { n: 51, g: "B", r: "Групповой этап", h: "Швейцария", a: "Канада", d: "2026-06-24T22:00:00+03:00", v: "BC Place", c: "Ванкувер" },
  { n: 52, g: "B", r: "Групповой этап", h: "Босния и Герцеговина", a: "Катар", d: "2026-06-24T22:00:00+03:00", v: "Lumen Field", c: "Сиэтл" },
  { n: 7, g: "C", r: "Групповой этап", h: "Бразилия", a: "Марокко", d: "2026-06-14T01:00:00+03:00", v: "MetLife Stadium", c: "Нью-Джерси" },
  { n: 5, g: "C", r: "Групповой этап", h: "Гаити", a: "Шотландия", d: "2026-06-14T04:00:00+03:00", v: "Gillette Stadium", c: "Фоксборо" },
  { n: 29, g: "C", r: "Групповой этап", h: "Бразилия", a: "Гаити", d: "2026-06-19T22:00:00+03:00", v: "Lincoln Financial Field", c: "Филадельфия" },
  { n: 30, g: "C", r: "Групповой этап", h: "Шотландия", a: "Марокко", d: "2026-06-20T01:00:00+03:00", v: "Gillette Stadium", c: "Фоксборо" },
  { n: 49, g: "C", r: "Групповой этап", h: "Шотландия", a: "Бразилия", d: "2026-06-24T21:00:00+03:00", v: "Hard Rock Stadium", c: "Майами" },
  { n: 50, g: "C", r: "Групповой этап", h: "Марокко", a: "Гаити", d: "2026-06-24T21:00:00+03:00", v: "Mercedes-Benz Stadium", c: "Атланта" },
  { n: 4, g: "D", r: "Групповой этап", h: "США", a: "Парагвай", d: "2026-06-13T04:00:00+03:00", v: "SoFi Stadium", c: "Лос-Анджелес" },
  { n: 6, g: "D", r: "Групповой этап", h: "Австралия", a: "Турция", d: "2026-06-14T07:00:00+03:00", v: "BC Place", c: "Ванкувер" },
  { n: 32, g: "D", r: "Групповой этап", h: "США", a: "Австралия", d: "2026-06-19T22:00:00+03:00", v: "Lumen Field", c: "Сиэтл" },
  { n: 31, g: "D", r: "Групповой этап", h: "Турция", a: "Парагвай", d: "2026-06-20T07:00:00+03:00", v: "Levi's Stadium", c: "Санта-Клара" },
  { n: 59, g: "D", r: "Групповой этап", h: "Турция", a: "США", d: "2026-06-26T05:00:00+03:00", v: "SoFi Stadium", c: "Лос-Анджелес" },
  { n: 60, g: "D", r: "Групповой этап", h: "Парагвай", a: "Австралия", d: "2026-06-26T05:00:00+03:00", v: "Levi's Stadium", c: "Санта-Клара" },
  { n: 10, g: "E", r: "Групповой этап", h: "Германия", a: "Кюрасао", d: "2026-06-14T20:00:00+03:00", v: "NRG Stadium", c: "Хьюстон" },
  { n: 9, g: "E", r: "Групповой этап", h: "Кот-д'Ивуар", a: "Эквадор", d: "2026-06-15T02:00:00+03:00", v: "Lincoln Financial Field", c: "Филадельфия" },
  { n: 33, g: "E", r: "Групповой этап", h: "Германия", a: "Кот-д'Ивуар", d: "2026-06-20T23:00:00+03:00", v: "BMO Field", c: "Торонто" },
  { n: 34, g: "E", r: "Групповой этап", h: "Эквадор", a: "Кюрасао", d: "2026-06-21T03:00:00+03:00", v: "Arrowhead Stadium", c: "Канзас-Сити" },
  { n: 56, g: "E", r: "Групповой этап", h: "Эквадор", a: "Германия", d: "2026-06-25T23:00:00+03:00", v: "MetLife Stadium", c: "Нью-Джерси" },
  { n: 55, g: "E", r: "Групповой этап", h: "Кюрасао", a: "Кот-д'Ивуар", d: "2026-06-25T23:00:00+03:00", v: "Lincoln Financial Field", c: "Филадельфия" },
  { n: 11, g: "F", r: "Групповой этап", h: "Нидерланды", a: "Япония", d: "2026-06-14T23:00:00+03:00", v: "AT&T Stadium", c: "Арлингтон" },
  { n: 12, g: "F", r: "Групповой этап", h: "Швеция", a: "Тунис", d: "2026-06-15T05:00:00+03:00", v: "Estadio BBVA", c: "Монтеррей" },
  { n: 35, g: "F", r: "Групповой этап", h: "Нидерланды", a: "Швеция", d: "2026-06-20T20:00:00+03:00", v: "NRG Stadium", c: "Хьюстон" },
  { n: 36, g: "F", r: "Групповой этап", h: "Тунис", a: "Япония", d: "2026-06-21T07:00:00+03:00", v: "Estadio BBVA", c: "Монтеррей" },
  { n: 57, g: "F", r: "Групповой этап", h: "Япония", a: "Швеция", d: "2026-06-26T02:00:00+03:00", v: "AT&T Stadium", c: "Арлингтон" },
  { n: 58, g: "F", r: "Групповой этап", h: "Тунис", a: "Нидерланды", d: "2026-06-26T02:00:00+03:00", v: "Arrowhead Stadium", c: "Канзас-Сити" },
  { n: 16, g: "G", r: "Групповой этап", h: "Бельгия", a: "Египет", d: "2026-06-15T22:00:00+03:00", v: "Lumen Field", c: "Сиэтл" },
  { n: 15, g: "G", r: "Групповой этап", h: "Иран", a: "Новая Зеландия", d: "2026-06-16T04:00:00+03:00", v: "SoFi Stadium", c: "Лос-Анджелес" },
  { n: 39, g: "G", r: "Групповой этап", h: "Бельгия", a: "Иран", d: "2026-06-21T22:00:00+03:00", v: "SoFi Stadium", c: "Лос-Анджелес" },
  { n: 40, g: "G", r: "Групповой этап", h: "Новая Зеландия", a: "Египет", d: "2026-06-22T04:00:00+03:00", v: "BC Place", c: "Ванкувер" },
  { n: 63, g: "G", r: "Групповой этап", h: "Египет", a: "Иран", d: "2026-06-27T06:00:00+03:00", v: "Lumen Field", c: "Сиэтл" },
  { n: 64, g: "G", r: "Групповой этап", h: "Новая Зеландия", a: "Бельгия", d: "2026-06-27T06:00:00+03:00", v: "BC Place", c: "Ванкувер" },
  { n: 14, g: "H", r: "Групповой этап", h: "Испания", a: "Кабо-Верде", d: "2026-06-15T19:00:00+03:00", v: "Mercedes-Benz Stadium", c: "Атланта" },
  { n: 13, g: "H", r: "Групповой этап", h: "Саудовская Аравия", a: "Уругвай", d: "2026-06-16T01:00:00+03:00", v: "Hard Rock Stadium", c: "Майами" },
  { n: 38, g: "H", r: "Групповой этап", h: "Испания", a: "Саудовская Аравия", d: "2026-06-21T19:00:00+03:00", v: "Mercedes-Benz Stadium", c: "Атланта" },
  { n: 37, g: "H", r: "Групповой этап", h: "Уругвай", a: "Кабо-Верде", d: "2026-06-22T01:00:00+03:00", v: "Hard Rock Stadium", c: "Майами" },
  { n: 66, g: "H", r: "Групповой этап", h: "Уругвай", a: "Испания", d: "2026-06-27T03:00:00+03:00", v: "Estadio Akron", c: "Гвадалахара" },
  { n: 65, g: "H", r: "Групповой этап", h: "Кабо-Верде", a: "Саудовская Аравия", d: "2026-06-27T03:00:00+03:00", v: "NRG Stadium", c: "Хьюстон" },
  { n: 17, g: "I", r: "Групповой этап", h: "Франция", a: "Сенегал", d: "2026-06-16T22:00:00+03:00", v: "MetLife Stadium", c: "Нью-Джерси" },
  { n: 18, g: "I", r: "Групповой этап", h: "Ирак", a: "Норвегия", d: "2026-06-17T01:00:00+03:00", v: "Gillette Stadium", c: "Фоксборо" },
  { n: 42, g: "I", r: "Групповой этап", h: "Франция", a: "Ирак", d: "2026-06-23T00:00:00+03:00", v: "Lincoln Financial Field", c: "Филадельфия" },
  { n: 41, g: "I", r: "Групповой этап", h: "Норвегия", a: "Сенегал", d: "2026-06-23T03:00:00+03:00", v: "MetLife Stadium", c: "Нью-Джерси" },
  { n: 61, g: "I", r: "Групповой этап", h: "Норвегия", a: "Франция", d: "2026-06-26T22:00:00+03:00", v: "Gillette Stadium", c: "Фоксборо" },
  { n: 62, g: "I", r: "Групповой этап", h: "Сенегал", a: "Ирак", d: "2026-06-26T22:00:00+03:00", v: "BMO Field", c: "Торонто" },
  { n: 19, g: "J", r: "Групповой этап", h: "Аргентина", a: "Алжир", d: "2026-06-17T04:00:00+03:00", v: "Arrowhead Stadium", c: "Канзас-Сити" },
  { n: 20, g: "J", r: "Групповой этап", h: "Австрия", a: "Иордания", d: "2026-06-17T07:00:00+03:00", v: "Levi's Stadium", c: "Санта-Клара" },
  { n: 43, g: "J", r: "Групповой этап", h: "Аргентина", a: "Австрия", d: "2026-06-22T20:00:00+03:00", v: "AT&T Stadium", c: "Арлингтон" },
  { n: 44, g: "J", r: "Групповой этап", h: "Иордания", a: "Алжир", d: "2026-06-23T06:00:00+03:00", v: "Levi's Stadium", c: "Санта-Клара" },
  { n: 69, g: "J", r: "Групповой этап", h: "Алжир", a: "Австрия", d: "2026-06-28T05:00:00+03:00", v: "Arrowhead Stadium", c: "Канзас-Сити" },
  { n: 70, g: "J", r: "Групповой этап", h: "Иордания", a: "Аргентина", d: "2026-06-28T05:00:00+03:00", v: "AT&T Stadium", c: "Арлингтон" },
  { n: 23, g: "K", r: "Групповой этап", h: "Португалия", a: "ДР Конго", d: "2026-06-17T20:00:00+03:00", v: "NRG Stadium", c: "Хьюстон" },
  { n: 24, g: "K", r: "Групповой этап", h: "Узбекистан", a: "Колумбия", d: "2026-06-18T05:00:00+03:00", v: "Estadio Azteca", c: "Мехико" },
  { n: 47, g: "K", r: "Групповой этап", h: "Португалия", a: "Узбекистан", d: "2026-06-23T20:00:00+03:00", v: "NRG Stadium", c: "Хьюстон" },
  { n: 48, g: "K", r: "Групповой этап", h: "Колумбия", a: "ДР Конго", d: "2026-06-24T05:00:00+03:00", v: "Estadio Akron", c: "Гвадалахара" },
  { n: 71, g: "K", r: "Групповой этап", h: "Колумбия", a: "Португалия", d: "2026-06-28T02:30:00+03:00", v: "Hard Rock Stadium", c: "Майами" },
  { n: 72, g: "K", r: "Групповой этап", h: "ДР Конго", a: "Узбекистан", d: "2026-06-28T02:30:00+03:00", v: "Mercedes-Benz Stadium", c: "Атланта" },
  { n: 22, g: "L", r: "Групповой этап", h: "Англия", a: "Хорватия", d: "2026-06-17T23:00:00+03:00", v: "AT&T Stadium", c: "Арлингтон" },
  { n: 21, g: "L", r: "Групповой этап", h: "Гана", a: "Панама", d: "2026-06-18T02:00:00+03:00", v: "BMO Field", c: "Торонто" },
  { n: 45, g: "L", r: "Групповой этап", h: "Англия", a: "Гана", d: "2026-06-23T23:00:00+03:00", v: "Gillette Stadium", c: "Фоксборо" },
  { n: 46, g: "L", r: "Групповой этап", h: "Панама", a: "Хорватия", d: "2026-06-24T02:00:00+03:00", v: "BMO Field", c: "Торонто" },
  { n: 67, g: "L", r: "Групповой этап", h: "Панама", a: "Англия", d: "2026-06-28T00:00:00+03:00", v: "MetLife Stadium", c: "Нью-Джерси" },
  { n: 68, g: "L", r: "Групповой этап", h: "Хорватия", a: "Гана", d: "2026-06-28T00:00:00+03:00", v: "Lincoln Financial Field", c: "Филадельфия" },
];

export const storage: IStorage = {
  async createUser(data) {
    return db.insert(users).values(data).returning().then(r => r[0]);
  },
  async getUserByUsername(username) {
    return db.select().from(users).where(eq(users.username, username)).then(r => r[0]);
  },
  async getUserByEmail(email) {
    return db.select().from(users).where(eq(users.email, email)).then(r => r[0]);
  },
  async getUserById(id) {
    return db.select().from(users).where(eq(users.id, id)).then(r => r[0]);
  },
  async updateUserPassword(userId, newPassword) {
    await db.update(users).set({ password: newPassword }).where(eq(users.id, userId));
  },
  async getLeaderboard() {
    return db.select().from(users).orderBy(desc(users.points));
  },
  async addUserPoints(userId, delta) {
    const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
    if (user) {
      await db.update(users).set({ points: user.points + delta }).where(eq(users.id, userId));
    }
  },

  async getAllMatches() {
    return db.select().from(matches);
  },
  async getMatchById(id) {
    return db.select().from(matches).where(eq(matches.id, id)).then(r => r[0]);
  },
  async seedMatches() {
    const existing = await db.select().from(matches).then(r => r[0]);
    if (existing) return;

    for (const m of matchData) {
      await db.insert(matches).values({
        matchNumber: m.n, group: m.g, round: m.r,
        homeTeam: m.h, awayTeam: m.a,
        homeTeamFlag: flagMap[m.h] || "🏳️",
        awayTeamFlag: flagMap[m.a] || "🏳️",
        matchDate: m.d, venue: m.v, city: m.c, status: "upcoming",
      });
    }
  },

  async createPrediction(data) {
    return db.insert(predictions).values(data).returning().then(r => r[0]);
  },
  async getPredictionsByUser(userId) {
    return db.select().from(predictions).where(eq(predictions.userId, userId));
  },
  async getPredictionByUserAndMatch(userId, matchId) {
    return db.select().from(predictions).where(
      and(eq(predictions.userId, userId), eq(predictions.matchId, matchId))
    ).then(r => r[0]);
  },
  async updatePrediction(id, homeScore, awayScore) {
    return db.update(predictions).set({ homeScore, awayScore }).where(eq(predictions.id, id)).returning().then(r => r[0]);
  },

  async upsertGroupPrediction(data) {
    const existing = await db.select().from(groupPredictions).where(
      and(eq(groupPredictions.userId, data.userId), eq(groupPredictions.group, data.group))
    ).then(r => r[0]);

    if (existing) {
      return db.update(groupPredictions)
        .set({ pos1: data.pos1, pos2: data.pos2, pos3: data.pos3, pos4: data.pos4 })
        .where(eq(groupPredictions.id, existing.id))
        .returning().then(r => r[0]);
    }
    return db.insert(groupPredictions).values(data).returning().then(r => r[0]);
  },
  async getGroupPredictionsByUser(userId) {
    return db.select().from(groupPredictions).where(eq(groupPredictions.userId, userId));
  },
  async getGroupPredictionByUserAndGroup(userId, group) {
    return db.select().from(groupPredictions).where(
      and(eq(groupPredictions.userId, userId), eq(groupPredictions.group, group))
    ).then(r => r[0]);
  },
};

// Initialize DB on startup
initDB().then(() => storage.seedMatches()).catch(console.error);
