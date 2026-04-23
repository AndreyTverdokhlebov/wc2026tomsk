import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGroupPredictionSchema } from "@shared/schema";
import nodemailer from "nodemailer";

// In-memory store for password reset codes: email -> { code, expires }
const resetCodes = new Map<string, { code: string; expires: number }>();

// Mail.ru SMTP transporter
const mailer = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER ?? "",
    pass: process.env.MAIL_PASS ?? "",
  },
});

export async function registerRoutes(httpServer: Server, app: Express) {

  // Auth: Register (now requires email)
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username?.trim() || !email?.trim() || !password)
        return res.status(400).json({ message: "Заполните все поля" });
      const emailLower = email.trim().toLowerCase();
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(emailLower))
        return res.status(400).json({ message: "Неверный формат email" });
      if (storage.getUserByUsername(username.trim()))
        return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
      if (storage.getUserByEmail(emailLower))
        return res.status(400).json({ message: "Этот email уже зарегистрирован" });
      const user = storage.createUser({ username: username.trim(), email: emailLower, password });
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // Auth: Login (by email or username)
  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      // try username first, then email
      let user = storage.getUserByUsername(username);
      if (!user) user = storage.getUserByEmail(username?.toLowerCase?.() ?? "");
      if (!user || user.password !== password)
        return res.status(401).json({ message: "Неверный логин/email или пароль" });
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // Password reset: send code to email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Укажите email" });
      const user = storage.getUserByEmail(email.trim().toLowerCase());
      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: "Если email зарегистрирован, код отправлен" });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      resetCodes.set(user.email, { code, expires: Date.now() + 15 * 60 * 1000 });
      console.log(`[RESET CODE] ${user.email} -> ${code}`);

      // Send real email via Mail.ru SMTP
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        await mailer.sendMail({
          from: `"ЧМ2026 Прогнозы" <${process.env.MAIL_USER}>`,
          to: user.email,
          subject: "Восстановление пароля — ЧМ2026",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1420;color:#fff;border-radius:12px">
              <h2 style="color:#4ade80;margin-bottom:8px">ЧМ<span style="color:#f59e0b">2026</span> Прогнозы</h2>
              <p style="color:#94a3b8;margin-bottom:24px">Ваш код для сброса пароля:</p>
              <div style="background:#1e293b;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:bold;color:#4ade80">${code}</div>
              <p style="color:#64748b;font-size:13px;margin-top:20px">Код действителен 15 минут. Если вы не запрашивали сброс пароля — игнорируйте это письмо.</p>
            </div>
          `,
        });
        return res.json({ message: "Код отправлен на ваш email" });
      }

      // Fallback: SMTP not configured
      return res.status(500).json({ message: "Отправка писем не настроена. Свяжитесь с администратором." });
    } catch (e: any) {
      console.error("[MAIL ERROR]", e.message);
      res.status(500).json({ message: "Ошибка отправки письма: " + e.message });
    }
  });

  // Password reset: verify code and set new password
  app.post("/api/auth/reset-password", (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword)
        return res.status(400).json({ message: "Не все поля заполнены" });
      const entry = resetCodes.get(email.trim().toLowerCase());
      if (!entry || entry.expires < Date.now())
        return res.status(400).json({ message: "Код недействителен или истёк" });
      if (entry.code !== code.trim())
        return res.status(400).json({ message: "Неверный код" });
      const user = storage.getUserByEmail(email.trim().toLowerCase());
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      storage.updateUserPassword(user.id, newPassword);
      resetCodes.delete(user.email);
      res.json({ message: "Пароль успешно изменён" });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // Get user by id
  app.get("/api/users/:id", (req, res) => {
    const user = storage.getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "Not found" });
    const { password: _, ...safe } = user;
    res.json(safe);
  });

  // Leaderboard
  app.get("/api/leaderboard", (_req, res) => {
    res.json(storage.getLeaderboard().map(({ password: _, ...u }) => u));
  });

  // Matches
  app.get("/api/matches", (_req, res) => {
    res.json(storage.getAllMatches());
  });

  // ── Match predictions ──────────────────────────────────────────
  app.get("/api/predictions/:userId", (req, res) => {
    res.json(storage.getPredictionsByUser(Number(req.params.userId)));
  });

  // Create or update match prediction
  // Points: 5 exact score, 2 correct outcome
  app.post("/api/predictions", (req, res) => {
    try {
      const { userId, matchId, homeScore, awayScore } = req.body;
      if (userId == null || matchId == null || homeScore == null || awayScore == null)
        return res.status(400).json({ message: "Не все поля заполнены" });

      const match = storage.getMatchById(Number(matchId));
      if (!match) return res.status(404).json({ message: "Матч не найден" });
      if (match.status === "finished")
        return res.status(400).json({ message: "Матч уже завершён" });

      const existing = storage.getPredictionByUserAndMatch(Number(userId), Number(matchId));

      // If match is already finished and we're scoring — compute points
      let pts = 0;
      if (match.status === "finished" && match.homeScore != null && match.awayScore != null) {
        const hs = Number(homeScore), as = Number(awayScore);
        if (hs === match.homeScore && as === match.awayScore) {
          pts = 5; // exact
        } else {
          const predOutcome = hs > as ? "H" : hs < as ? "A" : "D";
          const realOutcome = match.homeScore > match.awayScore ? "H" : match.homeScore < match.awayScore ? "A" : "D";
          if (predOutcome === realOutcome) pts = 2;
        }
      }

      if (existing) {
        const updated = storage.updatePrediction(existing.id, Number(homeScore), Number(awayScore));
        return res.json(updated);
      }
      const pred = storage.createPrediction({
        userId: Number(userId), matchId: Number(matchId),
        homeScore: Number(homeScore), awayScore: Number(awayScore),
      });
      res.json(pred);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // ── Group standing predictions ─────────────────────────────────
  // GET all group predictions for a user
  app.get("/api/group-predictions/:userId", (req, res) => {
    res.json(storage.getGroupPredictionsByUser(Number(req.params.userId)));
  });

  // POST — create or update group prediction
  // Points: 2 per correctly guessed position (awarded after group stage ends)
  app.post("/api/group-predictions", (req, res) => {
    try {
      const { userId, group, pos1, pos2, pos3, pos4 } = req.body;
      if (!userId || !group || !pos1 || !pos2 || !pos3 || !pos4)
        return res.status(400).json({ message: "Не все позиции заполнены" });

      const result = storage.upsertGroupPrediction({
        userId: Number(userId), group, pos1, pos2, pos3, pos4,
      });
      res.json(result);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
}
