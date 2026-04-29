import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { RADIUS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RADIUS } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { RADIUS } from '@/constants/theme';
import api from '@/services/api';
import { RADIUS } from '@/constants/theme';
import { useState } from 'react';
import { RADIUS } from '@/constants/theme';

export default function PadreQRScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['padre-mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data.hijos),
  });

  const hijos = data || [];
  const hijoActual = hijos[selectedIndex];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && hijos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2D3748" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hijoActual) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.errorText}>No tienes hijos registrados en el sistema</Text>
          <Text style={styles.subText}>Contacta a la directora para agregarlos</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Título */}
        <Text style={styles.title}>QR de Acceso</Text>

        {/* Selector de hijos (tabs horizontal) */}
        {hijos.length > 1 && (
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {hijos.map((hijo, idx) => (
                <Text
                  key={hijo.id}
                  style={[
                    styles.tab,
                    idx === selectedIndex ? styles.tabActive : styles.tabInactive
                  ]}
                  onPress={() => setSelectedIndex(idx)}
                >
                  {hijo.nombre_completo.split(' ')[0]}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contenido principal del hijo */}
        <View style={styles.cardContainer}>
          {/* Foto del alumno */}
          {hijoActual.foto_url && (
            <Image
              source={{ uri: hijoActual.foto_url }}
              style={styles.foto}
            />
          )}

          {/* Nombre */}
          <Text style={styles.nombreAlumno}>{hijoActual.nombre_completo}</Text>

          {/* Grupo */}
          <Text style={styles.grupoText}>{hijoActual.grupo_nombre || 'Sin grupo'}</Text>

          {/* QR Code */}
          {hijoActual.qr_code_url ? (
            <>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: hijoActual.qr_code_url }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.helperText}>
                Muestra este código QR en la puerta de entrada/salida
              </Text>
            </>
          ) : (
            <View style={styles.noQRContainer}>
              <Text style={styles.noQREmoji}>📱</Text>
              <Text style={styles.noQRText}>
                El QR de tu hijo aún no está disponible
              </Text>
              <Text style={styles.noQRSubtext}>
                Contacta a la directora para generarlo
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabs: {
    paddingHorizontal: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    fontSize: 14,
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  tabActive: {
    backgroundColor: '#805AD5',
    color: '#FFFFFF',
  },
  tabInactive: {
    backgroundColor: '#E2E8F0',
    color: '#718096',
  },
  cardContainer: {
    alignItems: 'center',
    gap: 16,
  },
  foto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  nombreAlumno: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D3748',
    textAlign: 'center',
  },
  grupoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
  },
  qrContainer: {
    width: 280,
    height: 280,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 8,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
  },
  noQRContainer: {
    width: 280,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E0',
    marginVertical: 12,
  },
  noQREmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noQRText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  noQRSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginTop: 12,
  },
  subText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
});
