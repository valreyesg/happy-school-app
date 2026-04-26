import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

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

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const getSemanActual = () => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    return lunes.toISOString().split('T')[0];
  };

  const semanaActual = getSemanActual();

  const cargarDatos = async () => {
    try {
      setLoading(true);

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
    ? modalidad === 'semana_completa' ? 250 : 50 * diasSeleccionados.length
    : 0;

  const hoy = new Date();
  const esDomingo = hoy.getDay() === 0;

  return (
    <>
      <Stack.Screen options={{ title: '🍽️ Comida Semanal' }} />
      <ScrollView className="flex-1 bg-orange-50 p-4">
        {/* Menú */}
        {menu && (
          <View className="bg-white rounded-3xl p-4 mb-6 shadow-sm">
            <Text className="text-xl font-black text-orange-600 mb-3">🍽️ Menú de la Semana</Text>
            {menu.contenido_texto && (
              <Text className="text-gray-700 text-sm leading-6 mb-3">{menu.contenido_texto}</Text>
            )}
            {menu.archivo_menu_url && (
              <Text className="text-xs text-orange-600 font-bold">
                📥 Ver menú completo (abre en navegador)
              </Text>
            )}
          </View>
        )}

        {!esDomingo ? (
          <View className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-2xl mb-6">
            <Text className="text-sm font-bold text-blue-700">
              📅 El formulario está disponible solo los domingos
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            <Text className="text-2xl font-black text-orange-600 mb-6">Confirmar Servicio</Text>

            {/* Deseo servicio */}
            <TouchableOpacity
              onPress={() => setDeseoServicio(!deseoServicio)}
              className={`border-2 rounded-2xl p-4 mb-6 ${
                deseoServicio ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`font-bold ${deseoServicio ? 'text-orange-600' : 'text-gray-700'}`}>
                {deseoServicio ? '✅' : '⬜'} Deseo servicio de comida próxima semana
              </Text>
            </TouchableOpacity>

            {deseoServicio && (
              <>
                {/* Modalidad */}
                <Text className="font-bold text-gray-700 mb-3">Tipo de servicio:</Text>
                <TouchableOpacity
                  onPress={() => { setModalidad('semana_completa'); setDiasSeleccionados([]); }}
                  className={`border-2 rounded-2xl p-3 mb-2 ${
                    modalidad === 'semana_completa' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <Text className="font-bold">
                    {modalidad === 'semana_completa' ? '✅' : '⬜'} Semana completa (L-V) – $250
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalidad('dias_especificos')}
                  className={`border-2 rounded-2xl p-3 mb-4 ${
                    modalidad === 'dias_especificos' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <Text className="font-bold">
                    {modalidad === 'dias_especificos' ? '✅' : '⬜'} Días específicos – $50/día
                  </Text>
                </TouchableOpacity>

                {/* Días */}
                {modalidad === 'dias_especificos' && (
                  <View className="bg-orange-50 rounded-2xl p-4 mb-6">
                    <Text className="font-bold text-gray-700 mb-3">Selecciona días:</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {diasSemana.map((dia, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => toggleDia(idx)}
                          className={`border-2 rounded-xl px-4 py-2 ${
                            diasSeleccionados.includes(idx)
                              ? 'border-orange-400 bg-orange-200'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          <Text className="font-bold text-sm">{dia}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Método pago */}
                <Text className="font-bold text-gray-700 mb-3">Método de pago:</Text>
                <TouchableOpacity
                  onPress={() => setMetodoPago('transferencia')}
                  className={`border-2 rounded-2xl p-3 mb-2 ${
                    metodoPago === 'transferencia' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <Text className="font-bold">
                    {metodoPago === 'transferencia' ? '✅' : '⬜'} 💳 Transferencia
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMetodoPago('efectivo')}
                  className={`border-2 rounded-2xl p-3 mb-4 ${
                    metodoPago === 'efectivo' ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <Text className="font-bold">
                    {metodoPago === 'efectivo' ? '✅' : '⬜'} 💵 Efectivo lunes
                  </Text>
                </TouchableOpacity>

                {/* Comprobante */}
                {metodoPago === 'transferencia' && (
                  <TouchableOpacity
                    onPress={seleccionarComprobante}
                    className="border-2 border-dashed border-blue-300 rounded-2xl p-4 mb-6 bg-blue-50"
                  >
                    <Text className="text-center font-bold text-blue-600">
                      {comprobante || confirmacion?.comprobante_pago_url
                        ? '✅ Comprobante adjuntado'
                        : '📎 Adjuntar comprobante'
                      }
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Total */}
                <View className="bg-orange-100 rounded-2xl p-4 mb-6">
                  <Text className="text-center font-black text-orange-700 text-lg">
                    Total: ${monto}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={handleConfirmar}
              disabled={loading}
              className="bg-orange-500 rounded-2xl p-4"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-black text-white text-lg">✅ Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default ComidaSemanal;
