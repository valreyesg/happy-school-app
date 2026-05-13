import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CreditCard, ClipboardList,
  Calendar, Settings, GraduationCap, DoorOpen, UtensilsCrossed, Clock, Megaphone, Eye,
} from 'lucide-react';
import AppShell from './AppShell';

const NAV_ITEMS = [
  { to: '/directora',            icon: LayoutDashboard, label: 'Inicio',      exact: true },
  { to: '/directora/asistencia',   icon: ClipboardList,   label: 'Asistencia' },
  { to: '/directora/turno-puerta', icon: DoorOpen,        label: 'Turno Puerta' },
  { to: '/directora/comida',       icon: UtensilsCrossed, label: 'Servicio de Comida' },
  { to: '/directora/alumnos',    icon: Users,           label: 'Alumnos' },
  { to: '/directora/ninos-extension', icon: Clock,       label: 'Niños de Extensión' },
  { to: '/directora/visitantes',  icon: Eye,             label: 'Visitantes' },
  { to: '/directora/grupos',     icon: GraduationCap,   label: 'Grupos' },
  { to: '/directora/personal',    icon: UserCheck,       label: 'Personal' },
  { to: '/directora/usuarios',    icon: UserCheck,       label: 'Usuarios — Padres' },
  { to: '/directora/pagos',       icon: CreditCard,      label: 'Pagos' },
  { to: '/directora/calendario',  icon: Calendar,        label: 'Calendario' },
  { to: '/directora/ciclos',      icon: Clock,           label: 'Ciclos' },
  // { to: '/directora/evaluaciones',icon: Star,            label: 'Evaluaciones' }, // TODO: módulo pendiente
  { to: '/directora/aviso',       icon: Megaphone,       label: 'Aviso Extraordinario' },
  { to: '/directora/config',      icon: Settings,        label: 'Configuración' },
];

export default function DirectoraLayout() {
  return (
    <AppShell navItems={NAV_ITEMS} accentColor="hs-purple" avatarInitial="D" roleLabel="Directora">
      <Outlet />
    </AppShell>
  );
}
