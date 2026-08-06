export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('#14584f');
  tg.setBackgroundColor?.('#f6f5f2');
}

export const haptic = (type = 'light') => tg?.HapticFeedback?.impactOccurred?.(type);

export function backButton(handler) {
  if (!tg?.BackButton) return () => {};
  tg.BackButton.show();
  tg.BackButton.onClick(handler);
  return () => {
    tg.BackButton.offClick(handler);
    tg.BackButton.hide();
  };
}
