import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TelegramGate from './lib/telegramGate.jsx';
import './styles/app.css';

// Bitta kodbazadan ikkita mustaqil sayt qurib chiqariladi (`vite --mode admin`
// yoki `vite build --mode admin`): support.silknode.uz uchun mini-app va
// admin.support.silknode.uz uchun admin panel. Har biri o'z bosh manzilida (/)
// ishlaydi — /app va /admin kabi qo'shimcha yo'llar endi kerak emas. --mode
// ko'rsatilmasa (standart dev/build), mini-app tanlanadi.
const isAdmin = import.meta.env.MODE === 'admin';

async function bootstrap() {
  const { default: App } = isAdmin
    ? await import('./AdminApp.jsx')
    : await import('./MiniApp.jsx');

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <TelegramGate>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TelegramGate>
    </React.StrictMode>
  );
}

bootstrap();
