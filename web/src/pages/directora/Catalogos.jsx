import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Star, UtensilsCrossed, Heart, FileText, Settings, Save,
} from 'lucide-react';
import api from '@/services/api';
import CatalogoEditor from '@/components/directora/CatalogoEditor';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'animo',             label: 'Ánimo',                icon: BookOpen },
  { id: 'comportamiento',    label: 'Comportamiento',       icon: Star },
  { id: 'comida',            label: 'Comida',               icon: UtensilsCrossed },
  { id: 'salud',             label: 'Salud',                icon: Heart },
  { id: 'documentos-pagos',  label: 'Documentos y Pagos',   icon: FileText },
  { id: 'config',            label: 'Configuración',        icon: Settings },
];

const CATALOGOS_POR_TAB = {
  animo: [
    { tipo: 'animo', titulo: '😊 Ánimo' },
  ],
  comportamiento: [
    { tipo: 'comportamiento', titulo: '⭐ Comportamiento' },
  ],
  comida: [
    { tipo: 'cuanto-comio', titulo: '🍽️ Cuánto comió' },
    { tipo: 'tiempos-comida', titulo: '⏱️ Tiempos de comida' },
  ],
  salud: [
    { tipo: 'condiciones-panial', titulo: '🩻 Condiciones de pañal' },
    { tipo: 'vomito-intensidad', titulo: '🤢 Intensidad de vómito' },
    { tipo: 'tipos-insumo', titulo: '📦 Tipos de insumo' },
  ],
  'documentos-pagos': [
    { tipo: 'tipos-documento', titulo: '📄 Tipos de documento' },
    { tipo: 'metodos-pago', titulo: '💳 Métodos de pago' },
    { tipo: 'conceptos-pago', titulo: '💰 Conceptos de pago' },
  ],
};

export default function Catalogos() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('animo');
  const [configValues, setConfigValues] = useState(null);
  const [configGuardado, setConfigGuardado] = useState(false);

  // Config negocio
  const { isLoading: configLoading, data: configData } = useQuery({
    queryKey: ['config-negocio'],
    queryFn: () => api.get('/config/negocio').then(r => r.data),
    enabled: tab === 'config',
  });

  const valoresConfig = configValues ?? configData ?? {};

  const mutationConfig = useMutation({
    mutationFn: (data) => api.put('/config/negocio', data),
    onSuccess: () => {
      setConfigValues(null);
      qc.invalidateQueries({ queryKey: ['config-negocio'] });
      setConfigGuardado(true);
      toast.success('Configuración guardada ✅');
      setTimeout(() => setConfigGuardado(false), 3000);
    },
    onError: (err) => {
      toast.error(`Error: ${err.response?.data?.error || 'Intenta de nuevo'}`);
    },
  });

  const handleConfigChange = (clave, val) => {
    setConfigValues(prev => ({
      ...(prev ?? configData ?? {}),
      [clave]: val === '' ? null : (isNaN(val) ? val : Number(val)),
    }));
  };

  const handleRefresh = (tipo) => {
    qc.invalidateQueries({ queryKey: ['catalogo-admin', tipo] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-hs-purple/20 flex items-center justify-center">
          <BookOpen size={24} className="text-hs-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Catálogos Administrables 🗂️</h1>
          <p className="text-sm font-semibold text-gray-500">Gestiona valores y configuración sin código</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-100 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-white border-2 border-b-white border-gray-200 text-hs-purple-dark -mb-[2px]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Ánimo */}
      {tab === 'animo' && (
        <div className="space-y-6">
          {CATALOGOS_POR_TAB.animo.map(({ tipo, titulo }) => (
            <CatalogoTab
              key={tipo}
              tipo={tipo}
              titulo={titulo}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Tab: Comportamiento */}
      {tab === 'comportamiento' && (
        <div className="space-y-6">
          {CATALOGOS_POR_TAB.comportamiento.map(({ tipo, titulo }) => (
            <CatalogoTab
              key={tipo}
              tipo={tipo}
              titulo={titulo}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Tab: Comida */}
      {tab === 'comida' && (
        <div className="space-y-6">
          {CATALOGOS_POR_TAB.comida.map(({ tipo, titulo }) => (
            <CatalogoTab
              key={tipo}
              tipo={tipo}
              titulo={titulo}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Tab: Salud */}
      {tab === 'salud' && (
        <div className="space-y-6">
          {CATALOGOS_POR_TAB.salud.map(({ tipo, titulo }) => (
            <CatalogoTab
              key={tipo}
              tipo={tipo}
              titulo={titulo}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Tab: Documentos y Pagos */}
      {tab === 'documentos-pagos' && (
        <div className="space-y-6">
          {CATALOGOS_POR_TAB['documentos-pagos'].map(({ tipo, titulo }) => (
            <CatalogoTab
              key={tipo}
              tipo={tipo}
              titulo={titulo}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Tab: Configuración */}
      {tab === 'config' && (
        <div className="space-y-6">
          {configLoading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin w-8 h-8 border-4 border-hs-purple border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Precios */}
              <div className="rounded-2xl border-2 bg-yellow-50 border-yellow-200 p-5 space-y-4">
                <h2 className="font-black text-base text-yellow-800">💰 Precios de comida</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Precio semanal ($)
                    </label>
                    <input
                      type="number"
                      value={valoresConfig.precio_comida_semana ?? ''}
                      onChange={e => handleConfigChange('precio_comida_semana', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Precio por día ($)
                    </label>
                    <input
                      type="number"
                      value={valoresConfig.precio_comida_dia ?? ''}
                      onChange={e => handleConfigChange('precio_comida_dia', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Semáforo de morosidad */}
              <div className="rounded-2xl border-2 bg-red-50 border-red-200 p-5 space-y-4">
                <h2 className="font-black text-base text-red-800">🚨 Semáforo de morosidad</h2>
                <p className="text-xs text-gray-600">Define en qué días de atraso cambia el nivel de riesgo</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-green-700 mb-1">
                      Días verde (sin alerta)
                    </label>
                    <input
                      type="number"
                      value={valoresConfig.semaforo_dias_verde ?? ''}
                      onChange={e => handleConfigChange('semaforo_dias_verde', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-400 bg-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-yellow-700 mb-1">
                      Días amarillo (alerta)
                    </label>
                    <input
                      type="number"
                      value={valoresConfig.semaforo_dias_amarillo ?? ''}
                      onChange={e => handleConfigChange('semaforo_dias_amarillo', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-red-700 mb-1">
                      Días rojo (crítico)
                    </label>
                    <input
                      type="number"
                      value={valoresConfig.semaforo_dias_suspendido ?? ''}
                      onChange={e => handleConfigChange('semaforo_dias_suspendido', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-400 bg-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard */}
              <div className="rounded-2xl border-2 bg-hs-blue/10 border-hs-blue/30 p-5 space-y-4">
                <h2 className="font-black text-base text-hs-blue-dark">📊 Dashboard</h2>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Máx. padres morosos a mostrar
                  </label>
                  <input
                    type="number"
                    value={valoresConfig.max_morosos_dashboard ?? ''}
                    onChange={e => handleConfigChange('max_morosos_dashboard', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-blue/50 bg-white"
                    min="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">Limitará la lista de padres morosos en la vista principal</p>
                </div>
              </div>

              {/* Botón guardar */}
              <button
                onClick={() => mutationConfig.mutate(valoresConfig)}
                disabled={mutationConfig.isPending}
                className="w-full flex items-center justify-center gap-2 bg-hs-purple hover:bg-hs-purple-dark text-white font-black py-3 rounded-2xl transition-colors disabled:opacity-60"
              >
                <Save size={18} />
                {mutationConfig.isPending ? 'Guardando…' : configGuardado ? '¡Guardado! ✅' : 'Guardar configuración'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CatalogoTab({ tipo, titulo, onRefresh }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['catalogo-admin', tipo],
    queryFn: () => api.get(`/catalogos/${tipo}/admin`).then(r => r.data.items),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-3 border-hs-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5">
      <CatalogoEditor
        tipo={tipo}
        titulo={titulo}
        items={items}
        onRefresh={() => onRefresh(tipo)}
      />
    </div>
  );
}
