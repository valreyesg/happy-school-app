import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Copy, Check, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

// ─── Página principal ────────────────────────────────────────────────────────

export default function DirectoraUsuarios() {
  const [buscar, setBuscar] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['padres-usuarios'],
    queryFn: () => api.get('/padres').then(r => r.data),
    keepPreviousData: true,
  });

  const padres = data || [];

  // Stats
  const totalPadres = padres.length;
  const conCuenta = padres.filter(p => p.usuario_id).length;
  const sinCuenta = padres.filter(p => !p.usuario_id).length;
  const primerLoginPendiente = padres.filter(p => p.usuario_id && p.primer_login).length;

  // Filtro búsqueda
  const q = buscar.toLowerCase().trim();
  const padresFiltrados = q
    ? padres.filter(p =>
        p.nombre_completo.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      )
    : padres;

  const handleCopy = (texto, padreId) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(padreId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Usuarios — Padres 👨‍👩‍👧</h1>
          <p className="text-gray-500 font-semibold mt-1">
            {totalPadres} padre{totalPadres !== 1 ? 's' : ''} registrado{totalPadres !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-hs p-4 text-center">
            <p className="text-2xl font-black text-blue-600">{totalPadres}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Total</p>
          </div>
          <div className="card-hs p-4 text-center">
            <p className="text-2xl font-black text-green-600">{conCuenta}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Activos</p>
          </div>
          <div className="card-hs p-4 text-center">
            <p className="text-2xl font-black text-gray-600">{sinCuenta}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Sin cuenta</p>
          </div>
          <div className="card-hs p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{primerLoginPendiente}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">1er login</p>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative flex-1 min-w-52 max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          className="input-hs pl-11 w-full"
        />
        {buscar && (
          <button onClick={() => setBuscar('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Lista de padres */}
      {isLoading ? (
        <div className="card-hs p-12 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-hs-purple border-t-transparent rounded-full" />
        </div>
      ) : padresFiltrados.length === 0 ? (
        <div className="card-hs text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-black text-gray-600">No se encontraron padres</p>
          <p className="text-gray-400 font-semibold mt-2">Intenta con otro filtro</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {padresFiltrados.map(padre => (
            <TarjetaPadre
              key={padre.id}
              padre={padre}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de padre ────────────────────────────────────────────────────────

function TarjetaPadre({ padre, copiedId, onCopy }) {
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalResetAbierto, setModalResetAbierto] = useState(false);
  const queryClient = useQueryClient();

  // Determinar estado de la cuenta
  const estadoCuenta = padre.usuario_id
    ? padre.primer_login
      ? { label: 'Primer login pendiente', color: 'bg-amber-100 text-amber-700' }
      : padre.cuenta_activa
      ? { label: 'Activo', color: 'bg-green-100 text-green-700' }
      : { label: 'Inactivo', color: 'bg-red-100 text-red-700' }
    : { label: 'Sin cuenta', color: 'bg-gray-100 text-gray-600' };

  const crearCuenta = useMutation({
    mutationFn: () => api.post(`/padres/${padre.id}/crear-cuenta`),
    onSuccess: (res) => {
      toast.success('✅ Cuenta creada');
      queryClient.invalidateQueries(['padres-usuarios']);
      setModalCrearAbierto(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al crear cuenta'),
  });

  const resetPassword = useMutation({
    mutationFn: () => api.post(`/padres/${padre.id}/reset-password`),
    onSuccess: () => {
      toast.success('✅ Contraseña restablecida');
      queryClient.invalidateQueries(['padres-usuarios']);
      setModalResetAbierto(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al resetear'),
  });

  const toggleActivo = useMutation({
    mutationFn: () =>
      padre.cuenta_activa
        ? api.patch(`/padres/${padre.id}/inactivar`)
        : api.patch(`/padres/${padre.id}/activar`),
    onSuccess: () => {
      toast.success(padre.cuenta_activa ? '✅ Cuenta inactivada' : '✅ Cuenta activada');
      queryClient.invalidateQueries(['padres-usuarios']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  });

  return (
    <>
      <div className="card-hs flex items-center gap-4 hover:shadow-hs-lg transition-shadow duration-200 group">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-hs-purple/20 flex items-center justify-center text-base font-black text-hs-purple">
          {padre.nombre_completo[0]}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-800">{padre.nombre_completo}</h3>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <p className="text-sm text-gray-500 font-semibold">{padre.email || 'Sin email'}</p>
            {padre.telefono && (
              <p className="text-sm text-gray-500 font-semibold">· {padre.telefono}</p>
            )}
          </div>
          {padre.hijos?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {padre.hijos.map((hijo, idx) => (
                <span key={idx} className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {hijo.nombre} · {hijo.grupo}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Estado de cuenta */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${estadoCuenta.color}`}>
            {estadoCuenta.label}
          </span>

          {/* Acciones */}
          <div className="hidden group-hover:flex items-center gap-1">
            {!padre.usuario_id ? (
              <button
                onClick={() => setModalCrearAbierto(true)}
                title="Crear cuenta"
                className="px-3 py-2 rounded-xl bg-green-100 text-green-700 font-bold text-xs hover:bg-green-200 transition-colors"
              >
                Crear cuenta
              </button>
            ) : (
              <>
                <button
                  onClick={() => toggleActivo.mutate()}
                  disabled={toggleActivo.isPending}
                  title={padre.cuenta_activa ? 'Inactivar' : 'Activar'}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition-colors ${
                    padre.cuenta_activa
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {padre.cuenta_activa ? '🔒 Inactivar' : '🔓 Activar'}
                </button>
                <button
                  onClick={() => setModalResetAbierto(true)}
                  title="Reset contraseña"
                  className="px-3 py-2 rounded-xl bg-amber-100 text-amber-600 font-bold text-xs hover:bg-amber-200 transition-colors"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal crear cuenta */}
      {modalCrearAbierto && (
        <ModalConfirmCrearCuenta
          padre={padre}
          onConfirmar={() => crearCuenta.mutate()}
          onCancelar={() => setModalCrearAbierto(false)}
          isLoading={crearCuenta.isPending}
        />
      )}

      {/* Modal reset password */}
      {modalResetAbierto && (
        <ModalConfirmResetPassword
          padre={padre}
          onConfirmar={() => resetPassword.mutate()}
          onCancelar={() => setModalResetAbierto(false)}
          isLoading={resetPassword.isPending}
        />
      )}
    </>
  );
}

// ─── Modal confirmar crear cuenta ────────────────────────────────────────────

function ModalConfirmCrearCuenta({ padre, onConfirmar, onCancelar, isLoading }) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [resultado, setResultado] = useState(null);
  const passwordDefault = 'HappySchool2026!';

  const handleConfirmar = async () => {
    onConfirmar();
    setResultado({
      email: padre.email,
      password: passwordDefault,
    });
  };

  if (resultado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-lg font-black text-gray-800 mb-4">Cuenta creada exitosamente</h2>
            <p className="text-sm text-gray-600 font-semibold mb-6">
              Comparte estos datos con {padre.nombre_completo.split(' ')[0]}
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">Email</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-gray-800">{resultado.email}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resultado.email);
                      toast.success('Copiado');
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Copy size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-200">
                <p className="text-xs text-red-600 font-semibold mb-1">Contraseña temporal</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-red-700">
                    {mostrarPassword ? resultado.password : '••••••••'}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="p-1.5 hover:bg-red-200 rounded-lg transition-colors"
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(resultado.password);
                        toast.success('Copiado');
                      }}
                      className="p-1.5 hover:bg-red-200 rounded-lg transition-colors"
                    >
                      <Copy size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 font-semibold mb-6">
              El padre deberá cambiar la contraseña en su primer acceso
            </p>

            <button
              onClick={onCancelar}
              className="w-full px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold transition-colors hover:bg-purple-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800 mb-4">¿Crear cuenta para {padre.nombre_completo}?</h2>
          <p className="text-sm text-gray-600 font-semibold mb-4">
            Se creará una cuenta con:
          </p>
          <div className="text-left space-y-2 mb-6 p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm font-bold text-gray-800">📧 Email: {padre.email}</p>
            <p className="text-sm font-bold text-gray-800">🔐 Contraseña: HappySchool2026!</p>
          </div>
          <p className="text-xs text-gray-500 font-semibold mb-6">
            El padre deberá cambiar la contraseña en su primer acceso
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl bg-green-500 text-white font-bold transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmar reset password ──────────────────────────────────────────

function ModalConfirmResetPassword({ padre, onConfirmar, onCancelar, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800 mb-4">¿Resetear contraseña?</h2>
          <p className="text-sm text-gray-600 font-semibold mb-4">
            Se restablecerá a: <span className="font-mono font-bold">HappySchool2026!</span>
          </p>
          <p className="text-xs text-gray-500 font-semibold mb-6">
            El padre deberá cambiar la contraseña en su próximo acceso
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {isLoading ? 'Resetando...' : 'Resetear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
