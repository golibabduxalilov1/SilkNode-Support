import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from './api.js';
import { waitForTg } from './telegram.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ scope, children }) {
  tokenStore.useScope(scope);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | anonymous | error
  const [error, setError] = useState('');

  const loginWithTelegram = useCallback(async () => {
    try {
      const tg = await waitForTg();
      const initData = tg?.initData;

      // devUser fallback faqat `vite dev`da ishlaydi (import.meta.env.DEV production
      // build'da har doim false). Production'da initData topilmasa, backendga so'rov
      // umuman yuborilmaydi — aks holda u baribir rad etilib, foydalanuvchiga xom
      // backend xatosi ko'rsatiladi. Buning o'rniga aniq, harakatga undovchi xabar beramiz.
      if (!initData && !import.meta.env.DEV) {
        setError("Telegram ma'lumotlari topilmadi. Ilovani to'liq yoping va botdan qaytadan oching.");
        setStatus('error');
        return;
      }

      const payload = initData
        ? { initData }
        : { devUser: { id: 555001, first_name: 'Test', last_name: 'Foydalanuvchi', username: 'test_user' } };
      const { token, user: u } = await api('/auth/telegram', { method: 'POST', body: payload });
      tokenStore.set(token);
      setUser(u);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  /**
   * Admin panel Telegram Mini App sifatida ochilganda (haqiqiy initData mavjud bo'lganda)
   * login formasini o'tkazib yuborib, avtomatik kirishga urinadi. Rol tekshiruvi (admin/agent)
   * har doim backend javobidagi user.role asosida bo'ladi — frontend hech qanday ID'ga tayanmaydi.
   */
  const loginWithTelegramAdmin = useCallback(async () => {
    const tg = await waitForTg();
    const initData = tg?.initData;
    if (!initData) {
      setStatus('anonymous');
      return;
    }
    try {
      const { token, user: u } = await api('/auth/telegram', { method: 'POST', body: { initData } });
      if (u.role !== 'admin' && u.role !== 'agent') {
        setError("Sizda admin panelga kirish huquqi yo'q.");
        setStatus('anonymous');
        return;
      }
      tokenStore.set(token);
      setUser(u);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('anonymous');
    }
  }, []);

  const loginWithPassword = useCallback(async (username, password) => {
    const { token, user: u } = await api('/auth/login', { method: 'POST', body: { username, password } });
    tokenStore.set(token);
    setUser(u);
    setStatus('ready');
    return u;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (tokenStore.get()) {
        try {
          const { user: u } = await api('/auth/me');
          if (!cancelled) { setUser(u); setStatus('ready'); }
          return;
        } catch { tokenStore.clear(); }
      }
      if (cancelled) return;
      if (scope === 'app') await loginWithTelegram();
      else if (scope === 'admin') await loginWithTelegramAdmin();
      else setStatus('anonymous');
    })();
    return () => { cancelled = true; };
  }, [scope, loginWithTelegram, loginWithTelegramAdmin]);

  return (
    <AuthContext.Provider value={{ user, status, error, loginWithPassword, loginWithTelegram, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
