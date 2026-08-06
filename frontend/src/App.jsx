import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth.jsx';

import MiniLayout from './miniapp/MiniLayout.jsx';
import Home from './miniapp/Home.jsx';
import NewTicket from './miniapp/NewTicket.jsx';
import MyTickets from './miniapp/MyTickets.jsx';
import TicketDetail from './miniapp/TicketDetail.jsx';

import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import TicketsList from './admin/TicketsList.jsx';
import AdminTicketDetail from './admin/AdminTicketDetail.jsx';
import Organizations from './admin/Organizations.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* Telegram Mini App — xodimlar uchun */}
      <Route
        path="/app"
        element={
          <AuthProvider scope="app">
            <MiniLayout />
          </AuthProvider>
        }
      >
        <Route index element={<Home />} />
        <Route path="new" element={<NewTicket />} />
        <Route path="tickets" element={<MyTickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
      </Route>

      {/* Web Admin Panel — texnik mutaxassislar uchun */}
      <Route
        path="/admin"
        element={
          <AuthProvider scope="admin">
            <AdminLayout />
          </AuthProvider>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<TicketsList />} />
        <Route path="tickets/:id" element={<AdminTicketDetail />} />
        <Route path="organizations" element={<Organizations />} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
