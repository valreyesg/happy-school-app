import { Outlet } from 'react-router-dom';
import { LayoutDashboard, DoorOpen, DoorClosed, CheckSquare, BookOpen, Clipboard } from 'lucide-react';
import AppShell from './AppShell';

const NAV_ITEMS = [
  { to: '/maestra',                  icon: LayoutDashboard, label: 'Inicio',         exact: true },
  { to: '/maestra/filtro-entrada',   icon: DoorOpen,        label: 'Filtro Entrada'  },
  { to: '/maestra/filtro-salida',    icon: DoorClosed,      label: 'Registro Salida' },
  { to: '/maestra/asistencia',       icon: CheckSquare,     label: 'Asistencia'      },
  { to: '/maestra/bitacora',         icon: BookOpen,        label: 'Bitácora'        },
  { to: '/maestra/tareas',           icon: Clipboard,       label: 'Tareas'          },
];

function roleLabel(usuario) {
  if (usuario?.genero === 'm') return 'Teacher';
  return 'Miss';
}

export default function MaestraLayout() {
  return (
    <AppShell navItems={NAV_ITEMS} accentColor="hs-green" avatarInitial="M" roleLabel={roleLabel}>
      <Outlet />
    </AppShell>
  );
}
