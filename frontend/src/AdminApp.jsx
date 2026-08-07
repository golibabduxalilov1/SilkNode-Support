import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth.jsx';

import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import TicketsList from './admin/TicketsList.jsx';
import AdminTicketDetail from './admin/AdminTicketDetail.jsx';
import Organizations from './admin/Organizations.jsx';
import Analytics from './admin/Analytics.jsx';
import Staff from './admin/Staff.jsx';

/** admin.support.silknode.uz — Admin Panel, faqat login/parol orqali kiriladi, bosh manzilda (/) ishlaydi. */
export default function AdminApp() {
  return (
    <AuthProvider scope="admin">
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<TicketsList />} />
          <Route path="tickets/:id" element={<AdminTicketDetail />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="staff" element={<Staff />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
