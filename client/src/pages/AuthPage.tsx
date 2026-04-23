import { useState } from "react";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Share2 } from "lucide-react";
import welcomePhoto from "@assets/welcome-photo.jpeg";

type Screen = "welcome" | "login" | "register" | "forgot" | "reset";

const APP_URL = "https://www.perplexity.ai/computer/a/wc2026-tXp3UpVvQ5KOMB5FgYMXUA";

// Detect iOS
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredPrompt = e as BeforeInstallPromptEvent;
});

export default function AuthPage() {
  const [screen, setScreen] = useState<Screen>("welcome");

  // Login fields
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");
  const [regPwConfirm, setRegPwConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // Forgot / Reset fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  async function handleAndroidInstall() {
    if (_deferredPrompt) {
      await _deferredPrompt.prompt();
      await _deferredPrompt.userChoice;
      _deferredPrompt = null;
    } else {
      window.open(APP_URL, "_blank");
    }
  }

  function handleShareLink() {
    if (navigator.share) {
      navigator.share({ title: "ЧМ2026 Прогнозы", url: APP_URL }).catch(() => {});
    } else {
      // fallback: copy to clipboard
      const el = document.createElement("input");
      el.value = APP_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast({ title: "Ссылка скопирована!" });
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function go(s: Screen) {
    setScreen(s);
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !loginPw) return toast({ title: "Заполните все поля", variant: "destructive" });
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username: loginId.trim(), password: loginPw });
      const user = await res.json();
      if (!res.ok) throw new Error(user.message);
      login(user);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPw || !regPwConfirm)
      return toast({ title: "Заполните все поля", variant: "destructive" });
    if (regPw !== regPwConfirm)
      return toast({ title: "Пароли не совпадают", variant: "destructive" });
    if (regPw.length < 4)
      return toast({ title: "Пароль должен быть не менее 4 символов", variant: "destructive" });
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: regUsername.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPw,
      });
      const user = await res.json();
      if (!res.ok) throw new Error(user.message);
      login(user);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) return toast({ title: "Введите email", variant: "destructive" });
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email: forgotEmail.trim() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Код отправлен на ваш email" });
      go("reset");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetCode.trim() || !newPw || !newPwConfirm)
      return toast({ title: "Заполните все поля", variant: "destructive" });
    if (newPw !== newPwConfirm)
      return toast({ title: "Пароли не совпадают", variant: "destructive" });
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword: newPw,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Пароль успешно изменён" });
      go("login");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  // ── WELCOME ───────────────────────────────────────────────────────
  if (screen === "welcome") {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black flex flex-col">
        <img
          src={welcomePhoto}
          alt="Welcome"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center top" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.92) 100%)",
          }}
        />
        {/* Register button top-right */}
        <div className="relative z-10 flex justify-end p-4 pt-6">
          <button
            onClick={() => go("register")}
            className="text-sm font-semibold text-white/90 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 hover:bg-white/25 transition-all"
            data-testid="button-go-register"
          >
            Зарегистрироваться
          </button>
        </div>
        {/* Bottom content */}
        <div className="relative z-10 mt-auto px-6 pb-10">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg aria-label="WC2026 Logo" viewBox="0 0 48 48" width="36" height="36" fill="none">
                <circle cx="24" cy="24" r="21" stroke="hsl(142 70% 45%)" strokeWidth="3"/>
                <polygon points="24,8 29,18 40,18 32,26 35,37 24,30 13,37 16,26 8,18 19,18" fill="hsl(35 95% 55%)" />
              </svg>
              <h1 className="font-bold text-2xl text-white">
                ЧМ<span style={{ color: "hsl(142 70% 55%)" }}>2026</span> Прогнозы
              </h1>
            </div>
            <p className="text-white/70 text-sm">Угадывай счета, борись за первое место</p>
          </div>
          <Button
            className="w-full font-semibold text-base h-12 rounded-xl"
            onClick={() => go("login")}
            data-testid="button-go-login"
          >
            Войти
          </Button>

          {/* Install / Share buttons */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {/* iOS */}
            <button
              onClick={() => setShowIOSHint((v) => !v)}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
              data-testid="button-install-ios"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="text-xs text-white/80">iOS</span>
            </button>

            {/* Android */}
            <button
              onClick={handleAndroidInstall}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
              data-testid="button-install-android"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.523 15.341c-.3 0-.546-.246-.546-.545V9.945c0-.3.246-.546.546-.546.3 0 .545.246.545.546v4.851c0 .299-.245.545-.545.545zm-11.046 0c-.3 0-.545-.246-.545-.545V9.945c0-.3.245-.546.545-.546.3 0 .546.246.546.546v4.851c0 .299-.246.545-.546.545zM8.392 5.051l-.87-1.508a.177.177 0 0 0-.241-.065.177.177 0 0 0-.065.241l.882 1.527A5.645 5.645 0 0 0 6.01 7.824h11.98a5.645 5.645 0 0 0-2.088-2.578l.882-1.527a.177.177 0 0 0-.065-.241.177.177 0 0 0-.241.065l-.87 1.508A5.567 5.567 0 0 0 12 4.364a5.567 5.567 0 0 0-3.608.687zm3.61-1.506c4.197 0 7.076 2.848 7.076 6.745v3.682c0 .535-.434.969-.969.969H5.89a.969.969 0 0 1-.969-.969V10.29c0-3.897 2.879-6.745 7.081-6.745zM9.964 6.5a.545.545 0 1 1 0 1.09.545.545 0 0 1 0-1.09zm4.072 0a.545.545 0 1 1 0 1.09.545.545 0 0 1 0-1.09zM6.919 16.745h10.162v2.042a1.21 1.21 0 0 1-1.21 1.213h-.847v1.818a.727.727 0 1 1-1.455 0V20h-3.138v1.818a.727.727 0 1 1-1.455 0V20H8.13a1.21 1.21 0 0 1-1.212-1.213v-2.042z"/>
              </svg>
              <span className="text-xs text-white/80">Android</span>
            </button>

            {/* Share link */}
            <button
              onClick={handleShareLink}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
              data-testid="button-share-link"
            >
              <Share2 className="w-6 h-6 text-white" />
              <span className="text-xs text-white/80">Поделиться</span>
            </button>
          </div>

          {/* iOS install hint */}
          {showIOSHint && (
            <div className="mt-3 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/15 p-4 text-sm text-white/80">
              <p className="font-semibold text-white mb-2">Как установить на iPhone / iPad:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Открой сайт в браузере <span className="text-white font-medium">Safari</span></li>
                <li>Нажми <span className="text-white font-medium">«Поделиться»</span> (квадрат со стрелкой ↑)</li>
                <li>Выбери <span className="text-white font-medium">«На экран «Домой»»</span></li>
                <li>Нажми <span className="text-white font-medium">«Добавить»</span></li>
              </ol>
            </div>
          )}

          <p className="text-center text-xs text-white/40 mt-4">
            Чемпионат мира по футболу · 11 июня — 19 июля 2026
          </p>
        </div>
      </div>
    );
  }

  // ── SHARED WRAPPER (login / register / forgot / reset) ────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(142 70% 45%), transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(35 95% 55%), transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Back */}
        <button
          onClick={() => go(screen === "reset" ? "forgot" : "welcome")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg aria-label="WC2026 Logo" viewBox="0 0 48 48" width="48" height="48" fill="none">
              <circle cx="24" cy="24" r="21" stroke="hsl(142 70% 45%)" strokeWidth="3"/>
              <polygon points="24,8 29,18 40,18 32,26 35,37 24,30 13,37 16,26 8,18 19,18" fill="hsl(35 95% 55%)" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-xl text-foreground">
            {screen === "login" && "Добро пожаловать"}
            {screen === "register" && "Создать аккаунт"}
            {screen === "forgot" && "Восстановление пароля"}
            {screen === "reset" && "Новый пароль"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {screen === "login" && "Войдите через email или логин"}
            {screen === "register" && "Зарегистрируйтесь, чтобы участвовать"}
            {screen === "forgot" && "Введите email для получения кода"}
            {screen === "reset" && `Код отправлен на ${forgotEmail}`}
          </p>
        </div>

        {/* ── LOGIN ── */}
        {screen === "login" && (
          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email или логин</label>
                <Input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Введите email или логин"
                  data-testid="input-login-id"
                  className="bg-secondary border-border"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Пароль</label>
                <div className="relative">
                  <Input
                    type={showLoginPw ? "text" : "password"}
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="Введите пароль"
                    data-testid="input-login-pw"
                    className="bg-secondary border-border pr-10"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowLoginPw(!showLoginPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading} data-testid="button-submit">
                {loading ? "Загрузка..." : "Войти"}
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <button onClick={() => go("forgot")} className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="link-forgot">
                Забыли пароль?
              </button>
              <p className="text-xs text-muted-foreground">
                Нет аккаунта?{" "}
                <button onClick={() => go("register")} className="text-primary hover:underline" data-testid="link-to-register">
                  Зарегистрироваться
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── REGISTER ── */}
        {screen === "register" && (
          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Логин</label>
                <Input
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Ваш логин (никнейм)"
                  data-testid="input-reg-username"
                  className="bg-secondary border-border"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="input-reg-email"
                  className="bg-secondary border-border"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Пароль</label>
                <div className="relative">
                  <Input
                    type={showRegPw ? "text" : "password"}
                    value={regPw}
                    onChange={(e) => setRegPw(e.target.value)}
                    placeholder="Придумайте пароль"
                    data-testid="input-reg-pw"
                    className="bg-secondary border-border pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Подтверждение пароля</label>
                <Input
                  type={showRegPw ? "text" : "password"}
                  value={regPwConfirm}
                  onChange={(e) => setRegPwConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                  data-testid="input-reg-pw-confirm"
                  className={`bg-secondary border-border ${regPwConfirm && regPw !== regPwConfirm ? "border-destructive" : ""}`}
                  autoComplete="new-password"
                />
                {regPwConfirm && regPw !== regPwConfirm && (
                  <p className="text-xs text-destructive mt-1">Пароли не совпадают</p>
                )}
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading} data-testid="button-submit">
                {loading ? "Загрузка..." : "Создать аккаунт"}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Уже есть аккаунт?{" "}
              <button onClick={() => go("login")} className="text-primary hover:underline" data-testid="link-to-login">
                Войти
              </button>
            </p>
          </div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {screen === "forgot" && (
          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Введите ваш email"
                  data-testid="input-forgot-email"
                  className="bg-secondary border-border"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading} data-testid="button-send-code">
                {loading ? "Отправка..." : "Отправить код"}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Вспомнили пароль?{" "}
              <button onClick={() => go("login")} className="text-primary hover:underline">
                Войти
              </button>
            </p>
          </div>
        )}

        {/* ── RESET PASSWORD ── */}
        {screen === "reset" && (
          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Код подтверждения</label>
                <Input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-значный код"
                  data-testid="input-reset-code"
                  className="bg-secondary border-border tracking-widest text-center text-lg"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Новый пароль</label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Новый пароль"
                    data-testid="input-new-pw"
                    className="bg-secondary border-border pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Подтверждение пароля</label>
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={newPwConfirm}
                  onChange={(e) => setNewPwConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                  data-testid="input-new-pw-confirm"
                  className={`bg-secondary border-border ${newPwConfirm && newPw !== newPwConfirm ? "border-destructive" : ""}`}
                  autoComplete="new-password"
                />
                {newPwConfirm && newPw !== newPwConfirm && (
                  <p className="text-xs text-destructive mt-1">Пароли не совпадают</p>
                )}
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading} data-testid="button-reset-submit">
                {loading ? "Сохранение..." : "Сохранить новый пароль"}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              <button onClick={() => go("forgot")} className="text-primary hover:underline">
                Отправить код заново
              </button>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          Чемпионат мира по футболу · 11 июня — 19 июля 2026
        </p>
      </div>
    </div>
  );
}
