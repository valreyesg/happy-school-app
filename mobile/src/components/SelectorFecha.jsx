// Componente SelectorFecha — centralizado para asistencia maestra, bitácoras maestra y padre
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

/**
 * @param {string}   fecha        Fecha actual en formato 'YYYY-MM-DD'
 * @param {Function} onChange     Callback recibiendo la nueva fecha como 'YYYY-MM-DD'
 * @param {string}   [accentColor='#805AD5']  Color de botones y badge "Hoy"
 */
export default function SelectorFecha({ fecha, onChange, accentColor = '#805AD5' }) {
  const date = new Date(fecha + 'T12:00:00');
  const hoy = new Date().toLocaleDateString('en-CA');
  const esHoy = fecha === hoy;

  const irAnterior = () => {
    let d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    onChange(d.toLocaleDateString('en-CA'));
  };

  const irSiguiente = () => {
    let d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    const sig = d.toLocaleDateString('en-CA');
    if (sig <= hoy) onChange(sig);
  };

  const bloqueadoSig = (() => {
    let d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA') > hoy;
  })();

  const fmt = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={s.fechaRow}>
      <TouchableOpacity style={s.fechaBtn} onPress={irAnterior}>
        <Text style={[s.fechaBtnTxt, { color: accentColor }]}>‹</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={s.fechaTxt}>{fmt}</Text>
        {esHoy && <Text style={[s.hoyBadge, { color: accentColor }]}>Hoy</Text>}
      </View>
      <TouchableOpacity
        style={[s.fechaBtn, bloqueadoSig && { opacity: 0.3 }]}
        onPress={irSiguiente}
        disabled={bloqueadoSig}
      >
        <Text style={[s.fechaBtnTxt, { color: accentColor }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  fechaRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  fechaBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fechaBtnTxt: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  fechaTxt:    { fontSize: 13, fontWeight: '700', color: '#4A5568', textAlign: 'center', textTransform: 'capitalize' },
  hoyBadge:    { fontSize: 10, fontWeight: '900', marginTop: 2 },
});
