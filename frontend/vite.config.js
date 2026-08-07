import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Bitta kodbaza ikkita mustaqil sayt sifatida qurib chiqariladi: mini-app
// (--mode miniapp, standart) va admin panel (--mode admin). Backend endi
// alohida subdomenda (api.support.silknode.uz) ishlagani uchun VITE_API_URL
// har doim to'liq manzil bo'ladi — shuning uchun lokal /api proxy kerak emas.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    port: mode === 'admin' ? 5174 : 5173,
  },
}));
