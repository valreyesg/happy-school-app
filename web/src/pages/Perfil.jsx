import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import PerfilLayout from '@/layouts/PerfilLayout';

function PerfilContent() {
  const { usuario } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');

  const cambiarPassword = useMutation({
    mutationFn: () => api.put('/auth/cambiar-password', {
      passwordActual: currentPassword,
      passwordNuevo: newPassword,
    }),
    onSuccess: () => {
      toast.success('✅ Contraseña cambiada correctamente');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setError('');
      setModalAbierto(false);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    },
  });

  const handleConfirmar = () => {
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setError('La contraseña debe incluir letras');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe incluir números');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    cambiarPassword.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-black text-gray-800">Mi Perfil 👤</h1>
        <p className="text-gray-500 font-semibold mt-1">Gestiona tu cuenta y seguridad</p>
      </div>

      {/* Información de usuario */}
      <div className="card-hs p-6">
        <h2 className="text-lg font-black text-gray-800 mb-4">Información personal</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre</p>
            <p className="text-lg font-bold text-gray-800">{usuario?.nombre}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email del portal</p>
            <p className="font-mono text-sm text-gray-700 break-all">{usuario?.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Rol</p>
            <p className="text-gray-800 font-semibold capitalize">
              {usuario?.rolPrincipal === 'padre' ? 'Padre / Tutor' : usuario?.rolPrincipal?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <div className="card-hs p-6">
        <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
          <Lock size={20} className="text-hs-purple" />
          Seguridad
        </h2>
        <p className="text-sm text-gray-600 font-semibold mb-4">
          Actualiza tu contraseña regularmente para mantener tu cuenta protegida
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold hover:bg-hs-purple-dark transition-colors"
        >
          🔐 Cambiar contraseña
        </button>
      </div>

      {/* Modal cambiar contraseña */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-black text-gray-800">Cambiar contraseña</h2>
            </div>

            <div className="space-y-4 mb-6">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    className="input-hs pr-12 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hs-purple"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caracteres, letras y números"
                  className="input-hs w-full"
                />
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="input-hs w-full"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalAbierto(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setCurrentPassword('');
                  setError('');
                }}
                disabled={cambiarPassword.isPending}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={cambiarPassword.isPending || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold transition-colors hover:bg-hs-purple-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cambiarPassword.isPending ? 'Cambiando...' : 'Cambiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  return (
    <PerfilLayout>
      <PerfilContent />
    </PerfilLayout>
  );
}
