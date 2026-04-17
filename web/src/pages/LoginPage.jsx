import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const usuario = await login(data.email, data.password);
      toast.success(`¡Bienvenid@ ${usuario.nombre.split(' ')[0]}! 👋`);

      const redirects = {
        directora: '/directora',
        administrativo: '/admin',
        maestra_titular: '/maestra',
        maestra_especial: '/maestra',
        maestra_puerta: '/maestra',
        padre: '/padre',
      };
      navigate(redirects[usuario.rolPrincipal] || '/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>👩‍🏫</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>👨‍👩‍👧</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>👧</span>
          <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>👦</span>
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
  );
}
