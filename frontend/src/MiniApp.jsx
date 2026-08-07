import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth.jsx';

import MiniLayout from './miniapp/MiniLayout.jsx';
import Home from './miniapp/Home.jsx';
import NewTicket from './miniapp/NewTicket.jsx';
import MyTickets from './miniapp/MyTickets.jsx';
import TicketDetail from './miniapp/TicketDetail.jsx';

/** support.silknode.uz — Telegram Mini App, bot orqali ochiladi, bosh manzilda (/) ishlaydi. */
export default function MiniApp() {
  return (
    <AuthProvider scope="app">
      <Routes>
        <Route path="/" element={<MiniLayout />}>
          <Route index element={<Home />} />
          <Route path="new" element={<NewTicket />} />
          <Route path="tickets" element={<MyTickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
