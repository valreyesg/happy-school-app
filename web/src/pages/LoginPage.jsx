import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, actualizarUsuario } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuarioConPrimerLogin, setUsuarioConPrimerLogin] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const cambiarPassword = useMutation({
    mutationFn: (newPassword) => api.put('/auth/cambiar-password', {
      passwordActual: 'HappySchool2026!',
      passwordNuevo: newPassword
    }),
    onSuccess: () => {
      toast.success('✅ Contraseña cambiada correctamente');
      actualizarUsuario({ primerLogin: false });
      const rol = usuarioConPrimerLogin?.rolPrincipal;
      setUsuarioConPrimerLogin(null);

      const redirects = {
        directora: '/directora',
        administrativo: '/admin',
        maestra_titular: '/maestra',
        maestra_especial: '/maestra',
        maestra_puerta: '/maestra',
        padre: '/padre',
      };
      navigate(redirects[rol] || '/');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al cambiar contraseña'),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const usuario = await login(data.email, data.password);
      toast.success(`¡Bienvenid@ ${usuario.nombre.split(' ')[0]}! 👋`);

      // Si primerLogin = true, mostrar modal para cambiar contraseña
      if (usuario.primerLogin) {
        setUsuarioConPrimerLogin(usuario);
      } else {
        const redirects = {
          directora: '/directora',
          administrativo: '/admin',
          maestra_titular: '/maestra',
          maestra_especial: '/maestra',
          maestra_puerta: '/maestra',
          padre: '/padre',
        };
        navigate(redirects[usuario.rolPrincipal] || '/');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal cambiar contraseña al primer login */}
      {usuarioConPrimerLogin && (
        <ModalCambiarPassword
          usuario={usuarioConPrimerLogin}
          onConfirmar={(newPassword) => cambiarPassword.mutate(newPassword)}
          isLoading={cambiarPassword.isPending}
        />
      )}

      <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel izquierdo — decorativo */}
      <div
        className="lg:w-1/2 flex flex-col items-center justify-center py-16 px-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FED7D7 0%, #FEF08A 30%, #BBF7D0 60%, #E9D5FF 100%)',
        }}
      >
        <div className="absolute top-8 left-8 text-5xl animate-bounce" style={{ animationDelay: '0s' }}>🌟</div>
        <div className="absolute top-12 right-12 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="absolute bottom-16 left-12 text-5xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎈</div>
        <div className="absolute bottom-8 right-8 text-4xl animate-bounce" style={{ animationDelay: '0.7s' }}>⭐</div>

        <Logo size="xl" showSlogan={true} className="relative z-10" />

        <p className="mt-8 text-center text-hs-purple/80 font-semibold text-lg max-w-xs">
          La plataforma para conectar a la comunidad escolar Happy School 🏫
        </p>

        <div className="mt-8 flex gap-4 text-3xl">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>👩🏻‍🏫</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>👨🏻‍👩🏻‍👧🏻</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>👧🏻</span>
          <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>👦🏻</span>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="lg:w-1/2 flex items-center justify-center py-16 px-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-2">
            ¡Hola! 👋
          </h2>
          <p className="text-gray-500 font-semibold mb-8">
            Inicia sesión para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className={`input-hs ${errors.email ? 'border-red-400' : ''}`}
                {...register('email', {
                  required: 'El correo es requerido',
                  pattern: { value: /^\S+@\S+$/, message: 'Correo inválido' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-hs pr-12 ${errors.password ? 'border-red-400' : ''}`}
                  {...register('password', { required: 'La contraseña es requerida' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hs-purple"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 font-semibold">{errors.password.message}</p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={22} />
                  Entrar a la app
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400 font-semibold">
            ¿Problemas para entrar? Contacta a la directora 📞
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

// ─── Modal cambiar contraseña ──────────────────────────────────────────────

function ModalCambiarPassword({ usuario, onConfirmar, isLoading }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmar = () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Ambos campos son requeridos');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
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
      setError('Las contraseñas no coinciden');
      return;
    }

    onConfirmar(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Cambia tu contraseña</h2>
          <p className="text-gray-600 font-semibold">
            Hola <span className="text-hs-purple font-black">{usuario.nombre.split(' ')[0]}</span>, es tu primer acceso
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 caracteres, letras y números"
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

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Confirmar contraseña
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

        {/* Botón */}
        <button
          onClick={handleConfirmar}
          disabled={isLoading || !newPassword || !confirmPassword}
          className="w-full px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Cambiando...' : 'Cambiar contraseña'}
        </button>

        <p className="mt-4 text-xs text-gray-500 font-semibold text-center">
          ✅ Necesitas crear una contraseña segura para proteger tu cuenta
        </p>
      </div>
    </div>
  );
}
