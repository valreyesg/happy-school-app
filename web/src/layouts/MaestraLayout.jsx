import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, CheckSquare, BookOpen, Image, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/maestra',           icon: LayoutDashboard, label: 'Inicio',    exact: true },
  { to: '/maestra/asistencia',icon: CheckSquare,     label: 'Asistencia' },
  { to: '/maestra/bitacora',  icon: BookOpen,        label: 'Bitácora'   },
  { to: '/maestra/galeria',   icon: Image,           label: 'Galería'    },
];

function saludoMiss(genero) {
  if (genero === 'm') return 'Teacher';
  return 'Miss';
}

export default function MaestraLayout() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada 👋');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-hs-lg flex flex-col
        transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100">
          <Logo size="sm" showSlogan={true} />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm
                transition-all duration-200
                ${isActive
                  ? 'bg-hs-green text-white shadow-hs'
                  : 'text-gray-600 hover:bg-hs-green/10 hover:text-hs-green'}
              `}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-hs-green flex items-center justify-center text-white font-black">
              {usuario?.nombre?.[0] || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800 truncate">{usuario?.nombre}</p>
              <p className="text-xs text-hs-green font-semibold">{saludoMiss(usuario?.genero)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Menu size={22} className="text-gray-600" />
          </button>
          <Logo size="sm" showSlogan={false} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
