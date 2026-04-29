import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';

export default function PerfilLayout({ children }) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada 👋');
    navigate('/login');
  };

  // Determinar ruta de retorno según rol
  const getReturnPath = () => {
    const redirects = {
      directora: '/directora',
      administrativo: '/admin',
      maestra_titular: '/maestra',
      maestra_especial: '/maestra',
      maestra_puerta: '/maestra',
      padre: '/padre',
    };
    return redirects[usuario?.rolPrincipal] || '/';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar simple */}
      <aside className="hidden lg:flex w-64 bg-white shadow-hs-lg flex-col border-r border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <Logo size="sm" showSlogan={true} />
        </div>

        <div className="flex-1 flex flex-col justify-between p-4">
          <div>
            <button
              onClick={() => navigate(getReturnPath())}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:bg-gray-100 font-bold text-sm transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Volver
            </button>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 mb-3 px-4">
              <div className="w-10 h-10 rounded-2xl bg-hs-purple flex items-center justify-center text-white font-black">
                {usuario?.nombre?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-800 truncate">{usuario?.nombre}</p>
                <p className="text-xs text-hs-purple font-semibold capitalize">
                  {usuario?.rolPrincipal === 'padre' ? 'Padre / Tutor' : usuario?.rolPrincipal?.replace(/_/g, ' ')}
                </p>
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
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(getReturnPath())}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-600" />
          </button>
          <Logo size="sm" showSlogan={false} />
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <LogOut size={22} className="text-gray-600" />
          </button>
        </header>

        {/* Área de contenido */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
