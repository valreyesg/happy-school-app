import { Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CreditCard, CalendarDays, UtensilsCrossed, User } from 'lucide-react';
import AppShell from './AppShell';

const NAV_ITEMS = [
  { to: '/padre',            icon: LayoutDashboard, label: 'Inicio',     exact: true },
  { to: '/padre/bitacora',   icon: BookOpen,        label: 'Bitácora'   },
  { to: '/padre/comida',     icon: UtensilsCrossed, label: 'Comida'     },
  { to: '/padre/pagos',      icon: CreditCard,      label: 'Pagos'      },
  { to: '/padre/calendario', icon: CalendarDays,    label: 'Calendario' },
  { to: '/perfil',           icon: User,            label: 'Mi Perfil'  },
];

export default function PadreLayout() {
  return (
    <AppShell navItems={NAV_ITEMS} accentColor="hs-red" avatarInitial="P" roleLabel="Padre / Tutor">
      <Outlet />
    </AppShell>
  );
}
