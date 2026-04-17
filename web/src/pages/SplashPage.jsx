import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/ui/Logo';

export default function SplashPage() {
  const navigate = useNavigate();
  const { token, usuario } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token && usuario) {
        navigate('/');
      } else {
        navigate('/login');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FED7D7 0%, #FEF08A 30%, #BBF7D0 60%, #E9D5FF 100%)',
      }}>
      {/* Elementos decorativos animados */}
      <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDelay: '0s' }}>⭐</div>
      <div className="absolute top-20 right-16 text-5xl animate-bounce" style={{ animationDelay: '0.3s' }}>🌟</div>
      <div className="absolute bottom-20 left-20 text-5xl animate-bounce" style={{ animationDelay: '0.6s' }}>🎈</div>
      <div className="absolute bottom-16 right-12 text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
      <div className="absolute top-1/3 left-8 text-4xl animate-bounce" style={{ animationDelay: '0.8s' }}>🌈</div>
      <div className="absolute top-1/3 right-8 text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>🦋</div>

      {/* Logo principal */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <Logo size="xl" showSlogan={true} />

        {/* Barra de carga */}
        <div className="w-48 h-3 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(90deg, #E53E3E, #D69E2E, #38A169, #805AD5)',
              width: '100%',
            }}
          />
        </div>

        <p className="text-hs-purple/70 font-bold text-lg animate-pulse">
          Cargando... 🚀
        </p>
      </div>
    </div>
  );
}
