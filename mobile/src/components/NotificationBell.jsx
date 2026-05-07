import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function NotificationBell() {
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) translateY.setValue(g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) {
        Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true }).start(() => {
          setModalVisible(false);
          translateY.setValue(0);
        });
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  // Count de no leídas — polling cada 30 s
  const { data: badgeData } = useQuery({
    queryKey: ['mobile-notif-count'],
    queryFn: () => api.get('/notificaciones/no-leidas').then(r => r.data),
    refetchInterval: 30_000,
    enabled: !!token,
  });
  const count = badgeData?.count || 0;

  // Lista completa — solo cuando hay token, refetch al abrir modal
  const { data: notifs = [], isLoading: loadingNotifs, isError: notifError, refetch } = useQuery({
    queryKey: ['mobile-notificaciones'],
    queryFn: () => api.get('/notificaciones').then(r => r.data),
    staleTime: 0,
    enabled: !!token,
    retry: 1,
  });

  const marcarUna = useMutation({
    mutationFn: (id) => api.put(`/notificaciones/${id}/leer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-notificaciones'] });
    },
  });

  const fmtFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      incidente: '🚨',
      aviso_extraordinario: '📢',
      medicamento: '💊',
      bitacora_lista: '📝',
    };
    return iconos[tipo] || '🔔';
  };

  return (
    <>
      {/* Botón campanita */}
      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
          queryClient.invalidateQueries({ queryKey: ['mobile-notificaciones'] });
        }}
        style={styles.bellButton}
      >
        <Text style={styles.bellText}>🔔</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {count > 9 ? '9+' : count}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal bottom-sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            {/* Handle bar — arrastra para cerrar */}
            <View style={styles.handleBarContainer} {...panResponder.panHandlers}>
              <View style={styles.handleBar} />
            </View>

            {/* Title */}
            <Text style={styles.sheetTitle}>Notificaciones</Text>

            {/* List */}
            <ScrollView style={styles.listContainer}>
              {loadingNotifs ? (
                <ActivityIndicator color="#E53E3E" style={{ marginVertical: 24 }} />
              ) : notifError ? (
                <Text style={styles.emptyText}>Error al cargar notificaciones</Text>
              ) : notifs.length === 0 ? (
                <Text style={styles.emptyText}>Sin notificaciones por ahora</Text>
              ) : (
                notifs.map(n => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => !n.leida && marcarUna.mutate(n.id)}
                    style={[
                      styles.notifItem,
                      !n.leida && styles.notifItemUnread,
                    ]}
                  >
                    <Text style={styles.notifIcon}>
                      {getIconoTipo(n.tipo)}
                    </Text>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifTitle}>{n.titulo}</Text>
                      <Text style={styles.notifBody}>{n.cuerpo}</Text>
                      <Text style={styles.notifDate}>{fmtFecha(n.created_at)}</Text>
                    </View>
                    {!n.leida && <View style={styles.notifDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: 8,
    marginRight: 8,
  },
  bellText: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E53E3E',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingBottom: 20,
    flex: 0,
  },
  handleBarContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  notifItemUnread: {
    backgroundColor: '#FFF5F5',
  },
  notifIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2D3748',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  notifDate: {
    fontSize: 11,
    color: '#999',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53E3E',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    paddingVertical: 20,
  },
});
