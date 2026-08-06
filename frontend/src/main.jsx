import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import TelegramGate from './lib/telegramGate.jsx';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TelegramGate>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TelegramGate>
  </React.StrictMode>
);
