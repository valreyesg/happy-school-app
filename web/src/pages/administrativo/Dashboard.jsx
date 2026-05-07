import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmt(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
}

function pct(parte, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((parseFloat(parte) / parseFloat(total)) * 100));
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, valor, sub, color, icon }) {
  return (
    <div className={`card-hs p-5 border-l-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{valor}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  );
}

// ─── Barra de cobranza ────────────────────────────────────────────────────────

function BarraCobranza({ recaudado, pendiente, vencido }) {
  const total = (parseFloat(recaudado) || 0) + (parseFloat(pendiente) || 0) + (parseFloat(vencido) || 0);
  const pctPagado  = pct(recaudado, total);
  const pctPend    = pct(pendiente, total);
  const pctVencido = pct(vencido, total);

  return (
    <div className="card-hs p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-gray-700">Cobranza del mes</h3>
        <span className="text-lg font-black text-hs-blue-dark">{pctPagado}% cobrado</span>
      </div>

      <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden flex">
        {pctPagado > 0 && (
          <div className="h-full bg-green-500 transition-all" style={{ width: `${pctPagado}%` }} />
        )}
        {pctPend > 0 && (
          <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pctPend}%` }} />
        )}
        {pctVencido > 0 && (
          <div className="h-full bg-red-500 transition-all" style={{ width: `${pctVencido}%` }} />
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Pagado {fmt(recaudado)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-gray-600">Pendiente {fmt(pendiente)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Vencido {fmt(vencido)}</span>
        </div>
      </div>

      {total > 0 && (
        <p className="text-xs text-gray-400 mt-3 font-semibold border-t pt-3">
          Total esperado del mes: <span className="text-gray-700 font-black">{fmt(total)}</span>
          {' · '}
          Faltante: <span className="text-red-600 font-black">{fmt((parseFloat(pendiente) || 0) + (parseFloat(vencido) || 0))}</span>
        </p>
      )}
    </div>
  );
}

// ─── Tabla por concepto ───────────────────────────────────────────────────────

function TablaConceptos({ conceptos }) {
  if (!conceptos?.length) return (
    <div className="card-hs p-5">
      <h3 className="text-sm font-black text-gray-700 mb-4">Desglose por concepto</h3>
      <p className="text-gray-400 text-sm text-center py-6">Sin datos este mes</p>
    </div>
  );

  const totales = conceptos.reduce((acc, c) => ({
    pagados:    acc.pagados    + parseInt(c.pagados    || 0),
    pendientes: acc.pendientes + parseInt(c.pendientes || 0),
    vencidos:   acc.vencidos   + parseInt(c.vencidos   || 0),
    recaudado:  acc.recaudado  + parseFloat(c.recaudado || 0),
  }), { pagados: 0, pendientes: 0, vencidos: 0, recaudado: 0 });

  return (
    <div className="card-hs p-5">
      <h3 className="text-sm font-black text-gray-700 mb-4">Desglose por concepto</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b bg-gray-50">
              <th className="text-left py-2 px-3 font-bold">Concepto</th>
              <th className="text-right py-2 px-3 font-bold text-green-600">✅</th>
              <th className="text-right py-2 px-3 font-bold text-yellow-600">⏳</th>
              <th className="text-right py-2 px-3 font-bold text-red-600">⚠️</th>
              <th className="text-right py-2 px-3 font-bold">Recaudado</th>
            </tr>
          </thead>
          <tbody>
            {conceptos.map(c => (
              <tr key={c.concepto_id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-3">
                  <span className="font-semibold text-gray-800 block">{c.concepto}</span>
                  <span className="text-xs text-gray-400 capitalize">{c.tipo}</span>
                </td>
                <td className="py-2.5 px-3 text-right text-green-600 font-bold">{c.pagados}</td>
                <td className="py-2.5 px-3 text-right text-yellow-600 font-bold">{c.pendientes}</td>
                <td className="py-2.5 px-3 text-right text-red-600 font-bold">{c.vencidos}</td>
                <td className="py-2.5 px-3 text-right font-black text-gray-800">{fmt(c.recaudado)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-gray-50">
              <td className="py-2 px-3 font-black text-gray-700 text-sm">TOTAL</td>
              <td className="py-2 px-3 text-right font-black text-green-700">{totales.pagados}</td>
              <td className="py-2 px-3 text-right font-black text-yellow-700">{totales.pendientes}</td>
              <td className="py-2 px-3 text-right font-black text-red-700">{totales.vencidos}</td>
              <td className="py-2 px-3 text-right font-black text-gray-900">{fmt(totales.recaudado)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Desglose por grupo ───────────────────────────────────────────────────────

function TablaGrupos({ grupos }) {
  if (!grupos?.length) return null;

  return (
    <div className="card-hs p-5">
      <h3 className="text-sm font-black text-gray-700 mb-4">Cobranza por grupo</h3>
      <div className="space-y-3">
        {grupos.map(g => {
          const total = parseInt(g.pagados || 0) + parseInt(g.pendientes || 0) + parseInt(g.vencidos || 0);
          const pctPag = pct(g.pagados, total);
          return (
            <div key={g.grupo}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color_hex || '#94a3b8' }} />
                  <span className="text-sm font-bold text-gray-700">{g.grupo}</span>
                  <span className="text-xs text-gray-400">({g.total_alumnos} alumnos)</span>
                </div>
                <span className="text-xs font-black text-gray-600">{pctPag}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${pctPag}%` }}
                />
              </div>
              <div className="flex gap-3 mt-1 text-xs text-gray-400 font-semibold">
                <span className="text-green-600">{g.pagados} pagados</span>
                <span className="text-yellow-600">{g.pendientes} pendientes</span>
                {parseInt(g.vencidos) > 0 && <span className="text-red-600">{g.vencidos} vencidos</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top Morosos ──────────────────────────────────────────────────────────────

function TopMorosos({ morosos, onVerPagos }) {
  if (!morosos?.length) return null;

  return (
    <div className="card-hs p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-red-600">Alumnos con adeudos vencidos</h3>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
          {morosos.length} alumno{morosos.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {morosos.map((a, idx) => (
          <div
            key={a.id}
            className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
            onClick={() => onVerPagos(a)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-red-400 w-5">#{idx + 1}</span>
              {a.foto_url
                ? <img src={a.foto_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                : <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-black text-xs">
                    {a.nombre_completo?.[0]}
                  </div>
              }
              <div>
                <p className="text-sm font-bold text-gray-800">{a.nombre_completo}</p>
                <p className="text-xs text-gray-500">{a.grupo} · {a.max_dias_atraso} días de atraso</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-red-600">{fmt(a.deuda_total)}</p>
              <p className="text-xs text-red-400">{a.pagos_vencidos} cargo{a.pagos_vencidos !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AdminDashboard() {
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const navigate = useNavigate();

  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard', mes, anio],
    queryFn: () => api.get('/pagos/dashboard', { params: { mes, anio } }).then(r => r.data),
  });

  const totales = dash?.totales || {};

  const totalEsperado = useMemo(() => {
    return (parseFloat(totales.recaudado) || 0)
         + (parseFloat(totales.por_cobrar) || 0)
         + (parseFloat(totales.vencido_total) || 0);
  }, [totales]);

  const handleNavMes = (delta) => {
    const d = new Date(anio, mes - 1 + delta, 1);
    setMes(d.getMonth() + 1);
    setAnio(d.getFullYear());
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Dashboard Financiero 📊</h1>
          <p className="text-gray-500 font-semibold mt-1">Control económico de la escuela</p>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavMes(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center transition-colors"
          >‹</button>
          <span className="text-base font-black text-gray-800 min-w-[150px] text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <button
            onClick={() => handleNavMes(1)}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center transition-colors"
          >›</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-hs-blue border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Recaudado"
              valor={fmt(totales.recaudado)}
              sub={`${totales.pagados || 0} pagos registrados`}
              color="border-green-500"
              icon="✅"
            />
            <KpiCard
              label="Por cobrar"
              valor={fmt(totales.por_cobrar)}
              sub={`${totales.pendientes || 0} pagos pendientes`}
              color="border-yellow-400"
              icon="⏳"
            />
            <KpiCard
              label="Vencido"
              valor={fmt(totales.vencido_total)}
              sub={`${totales.vencidos || 0} pagos vencidos`}
              color="border-red-500"
              icon="⚠️"
            />
            <KpiCard
              label="Recargos cobrados"
              valor={fmt(totales.recargos_cobrados)}
              sub={`del mes`}
              color="border-hs-purple"
              icon="📈"
            />
          </div>

          {/* Barra de cobranza */}
          <BarraCobranza
            recaudado={totales.recaudado}
            pendiente={totales.por_cobrar}
            vencido={totales.vencido_total}
          />

          {/* Desglose por concepto y por grupo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TablaConceptos conceptos={dash?.por_concepto} />
            <TablaGrupos grupos={dash?.por_grupo} />
          </div>

          {/* Top morosos */}
          {dash?.top_morosos?.length > 0 && (
            <TopMorosos
              morosos={dash.top_morosos}
              onVerPagos={() => navigate('/admin/pagos')}
            />
          )}

          {/* Sin datos */}
          {totalEsperado === 0 && (
            <div className="card-hs p-12 text-center">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-500 font-semibold">
                Sin registros de pagos para {MESES[mes - 1]} {anio}.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Ve a <strong>Pagos</strong> y usa "Generar mes" para crear los cargos del mes.
              </p>
              <button
                onClick={() => navigate('/admin/pagos')}
                className="btn-hs mt-4"
              >
                Ir a Pagos
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
