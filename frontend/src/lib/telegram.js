/**
 * telegram-web-app.js tashqi domendan yuklanadi va ba'zan React modullaridan
 * kech ulanishi mumkin — shuning uchun window.Telegram.WebApp'ni har safar
 * qayta o'qiymiz, bir marta o'qib "muzlatib" qo'ymaymiz.
 */
export const getTg = () => (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined);

/** Skript kech ulansa ham initData'ni kutib olish (Telegram ichida odatda darhol keladi). */
export function waitForTg(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const existing = getTg();
    if (existing) return resolve(existing);
    const start = Date.now();
    const interval = setInterval(() => {
      const found = getTg();
      if (found || Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(found);
      }
    }, 50);
  });
}

export function initTelegram() {
  const tg = getTg();
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('#14584f');
  tg.setBackgroundColor?.('#f6f5f2');
}

export const haptic = (type = 'light') => getTg()?.HapticFeedback?.impactOccurred?.(type);

export function backButton(handler) {
  const tg = getTg();
  if (!tg?.BackButton) return () => {};
  tg.BackButton.show();
  tg.BackButton.onClick(handler);
  return () => {
    tg.BackButton.offClick(handler);
    tg.BackButton.hide();
  };
}
