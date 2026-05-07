import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { COLORS, RADIUS } from '@/constants/theme';

const styles = StyleSheet.create({
  headerBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#FED7D7', backgroundColor: COLORS.gray[50] },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#2D3748' },
  container: { flex: 1, backgroundColor: COLORS.gray[50], paddingHorizontal: 16, paddingVertical: 16 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  menuTitle: { fontSize: 20, fontWeight: '900', color: COLORS.orange.DEFAULT, marginBottom: 12 },
  menuText: { fontSize: 14, color: COLORS.gray[700], lineHeight: 24, marginBottom: 12 },
  alertBox: { backgroundColor: COLORS.blue.bg, borderLeftColor: COLORS.blue.DEFAULT, borderLeftWidth: 4, paddingHorizontal: 16, paddingVertical: 16, borderRadius: RADIUS.xl, marginBottom: 24 },
  alertText: { fontSize: 14, fontWeight: '700', color: COLORS.blue.DEFAULT },
  formCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, paddingHorizontal: 24, paddingVertical: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  formTitle: { fontSize: 24, fontWeight: '900', color: COLORS.orange.DEFAULT, marginBottom: 24 },
  toggleButton: { borderWidth: 2, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 24 },
  toggleButtonActive: { borderColor: COLORS.orange.light, backgroundColor: COLORS.orange.bg },
  toggleButtonInactive: { borderColor: COLORS.gray[200], backgroundColor: COLORS.white },
  toggleText: { fontWeight: '700', fontSize: 16 },
  sectionLabel: { fontWeight: '700', color: COLORS.gray[700], marginBottom: 12 },
  optionButton: { borderWidth: 2, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  optionButtonActive: { borderColor: COLORS.orange.light, backgroundColor: COLORS.orange.bg },
  optionButtonInactive: { borderColor: COLORS.gray[200], backgroundColor: COLORS.white },
  daysContainer: { backgroundColor: COLORS.orange.bg, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 24 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: { borderWidth: 2, borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 8 },
  dayButtonActive: { borderColor: COLORS.orange.light, backgroundColor: COLORS.orange.light },
  dayButtonInactive: { borderColor: COLORS.gray[300], backgroundColor: COLORS.white },
  dayButtonText: { fontWeight: '700', fontSize: 14 },
  totalBox: { backgroundColor: COLORS.orange.bg, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 24 },
  totalText: { fontSize: 18, fontWeight: '900', color: COLORS.orange.dark, textAlign: 'center' },
  comprobantebox: { borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.blue.DEFAULT, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 24, backgroundColor: COLORS.blue.bg },
  comprobanteText: { textAlign: 'center', fontWeight: '700', color: COLORS.blue.DEFAULT },
  submitButton: { backgroundColor: COLORS.orange.DEFAULT, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16 },
  submitButtonText: { textAlign: 'center', fontWeight: '900', color: COLORS.white, fontSize: 18 },
});

const ComidaSemanal = () => {
  const { alumno } = useAuthStore();
  const [menu, setMenu] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deseoServicio, setDeseoServicio] = useState(false);
  const [modalidad, setModalidad] = useState('semana_completa');
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [comprobante, setComprobante] = useState(null);
  const [precioComidaSemana, setPrecioComidaSemana] = useState(250);
  const [precioComidaDia, setPrecioComidaDia] = useState(50);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const getSemanActual = () => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    return lunes.toLocaleDateString('en-CA');
  };

  const semanaActual = getSemanActual();

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Obtener precios de configuración
      const configRes = await api.get('/config/negocio');
      setPrecioComidaSemana(parseInt(configRes.data.precio_comida_semana) || 250);
      setPrecioComidaDia(parseInt(configRes.data.precio_comida_dia) || 50);

      // Obtener menú
      const menuRes = await api.get(`/comida/menu?semana=${semanaActual}`);
      setMenu(menuRes.data);

      // Obtener confirmación
      if (alumno?.id) {
        const confRes = await api.get(`/comida/confirmacion/${alumno.id}?semana=${semanaActual}`);
        if (confRes.data) {
          setConfirmacion(confRes.data);
          setDeseoServicio(confRes.data.confirmado);
          setModalidad(confRes.data.modalidad);
          setDiasSeleccionados(confRes.data.dias_seleccionados || []);
          setMetodoPago(confRes.data.metodo_pago);
        }
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [alumno?.id, semanaActual]);

  const toggleDia = (index) => {
    setDiasSeleccionados(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const seleccionarComprobante = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf']
      });

      if (!result.canceled) {
        setComprobante(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleConfirmar = async () => {
    try {
      if (!alumno?.id) {
        Alert.alert('Error', 'No se encontró ID del alumno');
        return;
      }

      if (deseoServicio) {
        if (modalidad === 'dias_especificos' && diasSeleccionados.length === 0) {
          Alert.alert('Error', 'Debes seleccionar al menos un día');
          return;
        }

        if (metodoPago === 'transferencia' && !comprobante && !confirmacion?.comprobante_pago_url) {
          Alert.alert('Error', 'Debes adjuntar comprobante de transferencia');
          return;
        }
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('alumno_id', alumno.id);
      formData.append('semana_inicio', semanaActual);
      formData.append('modalidad', deseoServicio ? modalidad : null);
      formData.append('dias_seleccionados', JSON.stringify(deseoServicio ? diasSeleccionados : []));
      formData.append('metodo_pago', deseoServicio ? metodoPago : null);

      if (comprobante) {
        formData.append('comprobante', {
          uri: comprobante.uri,
          type: comprobante.mimeType || 'application/octet-stream',
          name: comprobante.name
        });
      }

      await api.post('/comida/confirmacion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Éxito', 'Confirmación guardada');
      setComprobante(null);
      await cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.message);
      setLoading(false);
    }
  };

  const monto = deseoServicio
    ? modalidad === 'semana_completa' ? precioComidaSemana : precioComidaDia * diasSeleccionados.length
    : 0;

  const hoy = new Date();
  const esDomingo = hoy.getDay() === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.gray[50] }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>🍽️ Comida Semanal</Text>
      </View>
      <ScrollView style={styles.container}>
        {/* Menú */}
        {menu && (
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>🍽️ Menú de la Semana</Text>
            {menu.contenido_texto && (
              <Text style={styles.menuText}>{menu.contenido_texto}</Text>
            )}
            {menu.archivo_menu_url && (
              <Text style={{ fontSize: 12, color: COLORS.orange.DEFAULT, fontWeight: '700' }}>
                📥 Ver menú completo (abre en navegador)
              </Text>
            )}
          </View>
        )}

        {!esDomingo ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              📅 El formulario está disponible solo los domingos
            </Text>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Confirmar Servicio</Text>

            {/* Deseo servicio */}
            <TouchableOpacity
              onPress={() => setDeseoServicio(!deseoServicio)}
              style={[styles.toggleButton, deseoServicio ? styles.toggleButtonActive : styles.toggleButtonInactive]}
            >
              <Text style={[styles.toggleText, { color: deseoServicio ? COLORS.orange.DEFAULT : COLORS.gray[700] }]}>
                {deseoServicio ? '✅' : '⬜'} Deseo servicio de comida próxima semana
              </Text>
            </TouchableOpacity>

            {deseoServicio && (
              <>
                {/* Modalidad */}
                <Text style={styles.sectionLabel}>Tipo de servicio:</Text>
                <TouchableOpacity
                  onPress={() => { setModalidad('semana_completa'); setDiasSeleccionados([]); }}
                  style={[styles.optionButton, modalidad === 'semana_completa' ? styles.optionButtonActive : styles.optionButtonInactive]}
                >
                  <Text style={styles.toggleText}>
                    {modalidad === 'semana_completa' ? '✅' : '⬜'} Semana completa (L-V) – $250
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalidad('dias_especificos')}
                  style={[styles.optionButton, modalidad === 'dias_especificos' ? styles.optionButtonActive : styles.optionButtonInactive]}
                >
                  <Text style={styles.toggleText}>
                    {modalidad === 'dias_especificos' ? '✅' : '⬜'} Días específicos – $50/día
                  </Text>
                </TouchableOpacity>

                {/* Días */}
                {modalidad === 'dias_especificos' && (
                  <View style={styles.daysContainer}>
                    <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Selecciona días:</Text>
                    <View style={styles.daysGrid}>
                      {diasSemana.map((dia, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => toggleDia(idx)}
                          style={[styles.dayButton, diasSeleccionados.includes(idx) ? styles.dayButtonActive : styles.dayButtonInactive]}
                        >
                          <Text style={styles.dayButtonText}>{dia}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Método pago */}
                <Text style={styles.sectionLabel}>Método de pago:</Text>
                <TouchableOpacity
                  onPress={() => setMetodoPago('transferencia')}
                  style={[styles.optionButton, metodoPago === 'transferencia' ? { borderColor: COLORS.blue.DEFAULT, backgroundColor: COLORS.blue.bg } : styles.optionButtonInactive]}
                >
                  <Text style={styles.toggleText}>
                    {metodoPago === 'transferencia' ? '✅' : '⬜'} 💳 Transferencia
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMetodoPago('efectivo')}
                  style={[styles.optionButton, metodoPago === 'efectivo' ? { borderColor: COLORS.green.DEFAULT, backgroundColor: COLORS.green.bg } : styles.optionButtonInactive]}
                >
                  <Text style={styles.toggleText}>
                    {metodoPago === 'efectivo' ? '✅' : '⬜'} 💵 Efectivo lunes
                  </Text>
                </TouchableOpacity>

                {/* Comprobante */}
                {metodoPago === 'transferencia' && (
                  <TouchableOpacity
                    onPress={seleccionarComprobante}
                    style={styles.comprobantebox}
                  >
                    <Text style={styles.comprobanteText}>
                      {comprobante || confirmacion?.comprobante_pago_url
                        ? '✅ Comprobante adjuntado'
                        : '📎 Adjuntar comprobante'
                      }
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Total */}
                <View style={styles.totalBox}>
                  <Text style={styles.totalText}>
                    Total: ${monto}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={handleConfirmar}
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>✅ Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ComidaSemanal;
