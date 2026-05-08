// Helpers UI reutilizables para pantallas de Bitácora (maestra y padre).
// Centralizado desde: mobile/app/(maestra)/bitacora.jsx
//                     mobile/app/(padre)/bitacora.jsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS } from '@/constants/theme';

// Estilos base — usados por defecto (maestra: purple/gray)
// El consumidor puede sobreescribir pasando style/tituloStyle/etc.
const base = StyleSheet.create({
  seccion: {
    marginTop: 20, marginHorizontal: 16, backgroundColor: '#F7FAFC',
    borderRadius: RADIUS.md, padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  seccionTitulo: {
    fontSize: 14, fontWeight: '900', color: '#805AD5',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  fila: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  filaLabel: { fontSize: 13, color: '#718096', fontWeight: '600', flex: 1 },
  filaValor: { fontSize: 13, color: '#4A5568', fontWeight: '600', flex: 1, textAlign: 'right' },
  pildora: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.xl },
  pildoraTxt: { fontSize: 12, fontWeight: '700' },
});

/**
 * Seccion — contenedor con título uppercase.
 * @param {string}  titulo
 * @param {string}  [emoji]       — emoji opcional (mostrado si no hay icon)
 * @param {string}  [icon]        — nombre de Ionicons (tiene prioridad sobre emoji)
 * @param {string}  [iconColor]
 * @param {object}  [style]       — sobreescribe el estilo del View contenedor
 * @param {object}  [tituloStyle] — sobreescribe el estilo del Text título
 */
export function Seccion({ titulo, emoji, icon, iconColor = '#2D3748', style, tituloStyle, children }) {
  return (
    <View style={style ?? base.seccion}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
        {emoji && !icon ? <Text style={{ fontSize: 18 }}>{emoji}</Text> : null}
        <Text style={tituloStyle ?? base.seccionTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

/**
 * FilaInfo — fila label / valor.
 * Retorna null si valor está vacío.
 * @param {boolean} [negrita]       — aplica fontWeight 800 al valor
 * @param {object}  [filaStyle]     — sobreescribe el View contenedor
 * @param {object}  [labelStyle]    — sobreescribe el Text label
 * @param {object}  [valorStyle]    — sobreescribe el Text valor
 */
export function FilaInfo({ label, valor, negrita, filaStyle, labelStyle, valorStyle }) {
  if (valor === undefined || valor === null || valor === '') return null;
  return (
    <View style={filaStyle ?? base.fila}>
      <Text style={labelStyle ?? base.filaLabel}>{label}</Text>
      <Text style={[valorStyle ?? base.filaValor, negrita && { fontWeight: '800', color: '#2D3748' }]}>{valor}</Text>
    </View>
  );
}

/**
 * PildoraBool — badge verde/gris según valor booleano.
 * Retorna null si valor es null/undefined.
 * @param {object} [pildoraStyle]   — sobreescribe el View badge (bg se aplica encima)
 * @param {object} [pildoraTxtStyle]— sobreescribe el Text badge
 */
export function PildoraBool({ label, valor, pildoraStyle, pildoraTxtStyle }) {
  if (valor === null || valor === undefined) return null;
  return (
    <View style={[pildoraStyle ?? base.pildora, { backgroundColor: valor ? '#C6F6D5' : '#EDF2F7' }]}>
      <Text style={[pildoraTxtStyle ?? base.pildoraTxt, { color: valor ? '#276749' : '#718096' }]}>
        {valor ? '✓' : '✗'} {label}
      </Text>
    </View>
  );
}
