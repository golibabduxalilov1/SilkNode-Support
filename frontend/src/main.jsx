import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TelegramGate from './lib/telegramGate.jsx';
import './styles/app.css';

// Bitta kodbazadan ikkita mustaqil sayt qurib chiqariladi (build vaqtida
// VITE_APP_TARGET orqali tanlanadi): support.silknode.uz uchun mini-app va
// admin.support.silknode.uz uchun admin panel. Har biri o'z bosh manzilida (/)
// ishlaydi — /app va /admin kabi qo'shimcha yo'llar endi kerak emas.
const target = import.meta.env.VITE_APP_TARGET;

async function bootstrap() {
  const { default: App } = target === 'admin'
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
