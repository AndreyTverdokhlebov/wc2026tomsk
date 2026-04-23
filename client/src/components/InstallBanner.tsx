import { useState, useEffect } from "react";
import { X, Smartphone, Share } from "lucide-react";

// Detect iOS
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
// Detect Android
function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);

  const APP_URL = "https://www.perplexity.ai/computer/a/wc2026-tXp3UpVvQ5KOMB5FgYMXUA";

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") setDismissed(true);
    } else {
      // Fallback — open app URL
      window.open(APP_URL, "_blank");
    }
  };

  const handleIOSInstall = () => {
    setShowIOSHint((v) => !v);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(APP_URL).catch(() => {});
    // fallback
    const el = document.createElement("input");
    el.value = APP_URL;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    alert("Ссылка скопирована!");
  };

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Установить приложение</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          data-testid="button-dismiss-install"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {/* iOS */}
        <button
          onClick={handleIOSInstall}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          data-testid="button-install-ios"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-foreground group-hover:text-primary transition-colors" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">iPhone / iPad</span>
        </button>

        {/* Android */}
        <button
          onClick={handleAndroidInstall}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          data-testid="button-install-android"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-foreground group-hover:text-primary transition-colors" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.523 15.341c-.3 0-.546-.246-.546-.545V9.945c0-.3.246-.546.546-.546.3 0 .545.246.545.546v4.851c0 .299-.245.545-.545.545zm-11.046 0c-.3 0-.545-.246-.545-.545V9.945c0-.3.245-.546.545-.546.3 0 .546.246.546.546v4.851c0 .299-.246.545-.546.545zM8.392 5.051l-.87-1.508a.177.177 0 0 0-.241-.065.177.177 0 0 0-.065.241l.882 1.527A5.645 5.645 0 0 0 6.01 7.824h11.98a5.645 5.645 0 0 0-2.088-2.578l.882-1.527a.177.177 0 0 0-.065-.241.177.177 0 0 0-.241.065l-.87 1.508A5.567 5.567 0 0 0 12 4.364a5.567 5.567 0 0 0-3.608.687zm3.61-1.506c4.197 0 7.076 2.848 7.076 6.745v3.682c0 .535-.434.969-.969.969H5.89a.969.969 0 0 1-.969-.969V10.29c0-3.897 2.879-6.745 7.081-6.745zM9.964 6.5a.545.545 0 1 1 0 1.09.545.545 0 0 1 0-1.09zm4.072 0a.545.545 0 1 1 0 1.09.545.545 0 0 1 0-1.09zM6.919 16.745h10.162v2.042a1.21 1.21 0 0 1-1.21 1.213h-.847v1.818a.727.727 0 1 1-1.455 0V20h-3.138v1.818a.727.727 0 1 1-1.455 0V20H8.13a1.21 1.21 0 0 1-1.212-1.213v-2.042z"/>
          </svg>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">Android</span>
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          data-testid="button-copy-link"
        >
          <Share className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">Ссылка</span>
        </button>
      </div>

      {/* iOS hint */}
      {showIOSHint && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-secondary border border-border p-3 text-sm text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">Как установить на iPhone / iPad:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Открой сайт в браузере <span className="text-foreground font-medium">Safari</span></li>
              <li>Нажми кнопку <span className="text-foreground font-medium">«Поделиться»</span> (квадрат со стрелкой вверх)</li>
              <li>Выбери <span className="text-foreground font-medium">«На экран «Домой»»</span></li>
              <li>Нажми <span className="text-foreground font-medium">«Добавить»</span></li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
