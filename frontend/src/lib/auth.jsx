import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from './api.js';
import { tg } from './telegram.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ scope, children }) {
  tokenStore.useScope(scope);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | anonymous | error
  const [error, setError] = useState('');

  const loginWithTelegram = useCallback(async () => {
    try {
      const initData = tg?.initData;
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
      else setStatus('anonymous');
    })();
    return () => { cancelled = true; };
  }, [scope, loginWithTelegram]);

  return (
    <AuthContext.Provider value={{ user, status, error, loginWithPassword, loginWithTelegram, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
