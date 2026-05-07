import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, UtensilsCrossed, Bell, BarChart2,
} from 'lucide-react';
import AppShell from './AppShell';

const NAV_ITEMS = [
  { to: '/admin',         icon: LayoutDashboard,  label: 'Dashboard',     exact: true },
  { to: '/admin/pagos',   icon: CreditCard,        label: 'Pagos' },
  { to: '/admin/comida-pagos', icon: UtensilsCrossed, label: 'Comida' },
  { to: '/admin/notificaciones', icon: Bell,        label: 'Alertas' },
  { to: '/admin/reportes',icon: BarChart2,          label: 'Reportes' },
];

export default function AdministrativoLayout() {
  return (
    <AppShell
      navItems={NAV_ITEMS}
      accentColor="hs-blue"
      avatarInitial="A"
      roleLabel="Administrativo"
    >
      <Outlet />
    </AppShell>
  );
}
