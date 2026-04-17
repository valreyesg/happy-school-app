import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';

export default function PadreLayout() {
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
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <Logo size="sm" showSlogan={false} />
          <div className="flex items-center gap-4">
            <span className="font-black text-gray-700">👨‍👩‍👧 Padres</span>
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
              <LogOut size={18} /> Salir
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
