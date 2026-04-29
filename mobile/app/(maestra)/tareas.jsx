import { useState, useRef } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  TextInput, Image, ActivityIndicator, FlatList
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, RADIUS } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { COLORS, RADIUS } from '@/constants/theme';
import api from '@/services/api';
import { COLORS, RADIUS } from '@/constants/theme';
import Toast from 'react-native-toast-message';
import { COLORS, RADIUS } from '@/constants/theme';

function getISOWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + (4 - (d.getDay() || 7)));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  return Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
}

function getSemanaKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + (4 - (d.getDay() || 7)));
  const anioISO = thursday.getFullYear();
  const semana = getISOWeek(dateStr);
  return `${anioISO}-W${String(semana).padStart(2, '0')}`;
}

function getLunesToDomingo(dateStr) {
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date(dateStr + 'T12:00:00');
  const diaSemana = (d.getDay() + 6) % 7;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - diaSemana);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (f) => `${f.getDate()} ${MESES[f.getMonth()]}`;
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

function agruparPorSemana(tareas, orden = 'asc') {
  const mapa = {};
  for (const t of tareas) {
    const dateStr = t.fecha_limite.substring(0, 10);
    const semanaKey = getSemanaKey(dateStr);
    if (!mapa[semanaKey]) {
      mapa[semanaKey] = { semanaKey, label: getLunesToDomingo(dateStr), tareas: [] };
    }
    mapa[semanaKey].tareas.push(t);
  }
  const grupos = Object.values(mapa);
  grupos.sort((a, b) =>
    orden === 'asc' ? a.semanaKey.localeCompare(b.semanaKey) : b.semanaKey.localeCompare(a.semanaKey)
  );
  return grupos;
}

function proximoDiaHabil(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().substring(0, 10);
}

function ModalNuevaTarea({ grupoId, onClose, onSuccess, visible }) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fecha_limite: proximoDiaHabil(),
    foto: null
  });
  const [preview, setPreview] = useState(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('titulo', form.titulo);
      fd.append('descripcion', form.descripcion);
      fd.append('fecha_limite', form.fecha_limite);
      fd.append('grupo_id', grupoId);
      if (form.foto) {
        fd.append('foto', {
          uri: form.foto.uri,
          name: form.foto.name || 'foto.jpg',
          type: form.foto.type || 'image/jpeg'
        });
      }
      return api.post('/tareas', fd);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Tarea creada' });
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      setForm({ titulo: '', descripcion: '', fecha_limite: proximoDiaHabil(), foto: null });
      setPreview(null);
      onSuccess?.();
      onClose();
    },
    onError: (err) => Toast.show({
      type: 'error',
      text1: err.response?.data?.error || 'Error al crear tarea'
    })
  });

  const handleFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setForm(p => ({
        ...p,
        foto: {
          uri: asset.uri,
          name: asset.fileName || 'foto.jpg',
          type: asset.type || 'image/jpeg'
        }
      }));
      setPreview(asset.uri);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📋 Nueva Tarea</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={form.titulo}
              onChangeText={(t) => setForm(p => ({ ...p, titulo: t }))}
              placeholder="Ej: Tarea de matemática"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={form.descripcion}
              onChangeText={(d) => setForm(p => ({ ...p, descripcion: d }))}
              placeholder="Detalles de la tarea"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha entrega</Text>
            <TextInput
              style={styles.input}
              value={form.fecha_limite}
              onChangeText={(f) => setForm(p => ({ ...p, fecha_limite: f }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Foto (opcional)</Text>
            <TouchableOpacity style={styles.fotoBtn} onPress={handleFoto}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text>
              <Text style={styles.fotoBtnText}>Seleccionar foto</Text>
            </TouchableOpacity>
            {preview && (
              <View style={{ position: 'relative', marginTop: 12 }}>
                <Image source={{ uri: preview }} style={styles.preview} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    setPreview(null);
                    setForm(p => ({ ...p, foto: null }));
                  }}
                >
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#E2E8F0' }]}
            onPress={onClose}
          >
            <Text style={{ fontWeight: '800', color: '#2D3748' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: form.titulo && !mutation.isPending ? '#3B82F6' : '#CBD5E0' }]}
            onPress={() => mutation.mutate()}
            disabled={!form.titulo || mutation.isPending}
          >
            <Text style={{ fontWeight: '800', color: '#fff' }}>
              {mutation.isPending ? 'Creando...' : 'Crear'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ModalEditarTarea({ tarea, onClose, onSuccess, visible }) {
  const [form, setForm] = useState({
    titulo: tarea?.titulo || '',
    descripcion: tarea?.descripcion || '',
    fecha_limite: tarea?.fecha_limite?.substring(0, 10) || '',
    foto: null
  });
  const [preview, setPreview] = useState(tarea?.foto_url || null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('titulo', form.titulo);
      fd.append('descripcion', form.descripcion);
      fd.append('fecha_limite', form.fecha_limite);
      if (form.foto) {
        fd.append('foto', {
          uri: form.foto.uri,
          name: form.foto.name || 'foto.jpg',
          type: form.foto.type || 'image/jpeg'
        });
      }
      return api.put(`/tareas/${tarea.id}`, fd);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Tarea actualizada' });
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      onSuccess?.();
      onClose();
    },
    onError: (err) => Toast.show({
      type: 'error',
      text1: err.response?.data?.error || 'Error al actualizar'
    })
  });

  const handleFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setForm(p => ({
        ...p,
        foto: {
          uri: asset.uri,
          name: asset.fileName || 'foto.jpg',
          type: asset.type || 'image/jpeg'
        }
      }));
      setPreview(asset.uri);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>✏️ Editar Tarea</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={form.titulo}
              onChangeText={(t) => setForm(p => ({ ...p, titulo: t }))}
              placeholder="Ej: Tarea de matemática"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={form.descripcion}
              onChangeText={(d) => setForm(p => ({ ...p, descripcion: d }))}
              placeholder="Detalles de la tarea"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha entrega</Text>
            <TextInput
              style={styles.input}
              value={form.fecha_limite}
              onChangeText={(f) => setForm(p => ({ ...p, fecha_limite: f }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Foto (opcional)</Text>
            <TouchableOpacity style={styles.fotoBtn} onPress={handleFoto}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text>
              <Text style={styles.fotoBtnText}>Cambiar foto</Text>
            </TouchableOpacity>
            {preview && (
              <View style={{ position: 'relative', marginTop: 12 }}>
                <Image source={{ uri: preview }} style={styles.preview} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    setPreview(null);
                    setForm(p => ({ ...p, foto: null }));
                  }}
                >
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#E2E8F0' }]}
            onPress={onClose}
          >
            <Text style={{ fontWeight: '800', color: '#2D3748' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: form.titulo && !mutation.isPending ? '#3B82F6' : '#CBD5E0' }]}
            onPress={() => mutation.mutate()}
            disabled={!form.titulo || mutation.isPending}
          >
            <Text style={{ fontWeight: '800', color: '#fff' }}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ModalEntregas({ tareaId, titulo, onClose, visible }) {
  const { data, isLoading } = useQuery({
    queryKey: ['alumnos-tarea', tareaId],
    queryFn: () => api.get(`/tareas/${tareaId}/alumnos`).then(r => r.data),
    enabled: visible && !!tareaId
  });

  const entregaron = data?.alumnos.filter(a => a.completada) || [];
  const faltan = data?.alumnos.filter(a => !a.completada) || [];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.centeredModal}>
        <View style={styles.entregas}>
          <View style={styles.entregas_header}>
            <Text style={styles.entregas_title}>📊 Entregas</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.entregas_subtitle}>{titulo}</Text>

          {isLoading ? (
            <ActivityIndicator color="#805AD5" size="large" style={{ marginTop: 20 }} />
          ) : (
            <ScrollView>
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.entregas_label}>✅ Entregaron ({entregaron.length})</Text>
                {entregaron.length === 0 ? (
                  <Text style={styles.entregas_empty}>Ninguno aún</Text>
                ) : (
                  entregaron.map(a => (
                    <Text key={a.id} style={styles.entregas_item}>
                      • {a.nombre_completo}
                    </Text>
                  ))
                )}
              </View>

              <View>
                <Text style={styles.entregas_label_fail}>❌ Faltan ({faltan.length})</Text>
                {faltan.length === 0 ? (
                  <Text style={styles.entregas_empty}>¡Todos entregaron!</Text>
                ) : (
                  faltan.map(a => (
                    <Text key={a.id} style={styles.entregas_item}>
                      • {a.nombre_completo}
                    </Text>
                  ))
                )}
              </View>
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#E2E8F0', marginTop: 12 }]}
            onPress={onClose}
          >
            <Text style={{ fontWeight: '800', color: '#2D3748' }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function TareaCard({ tarea, onPublicar, onDelete, onEdit }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEntregas, setShowEntregas] = useState(false);
  const queryClient = useQueryClient();

  const { data: entregas } = useQuery({
    queryKey: ['entregas', tarea.id],
    queryFn: () => api.get(`/tareas/${tarea.id}/entregas`).then(r => r.data),
    enabled: tarea.publicada
  });

  const publicarMutation = useMutation({
    mutationFn: () => api.put(`/tareas/${tarea.id}/publicar`),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Tarea publicada' });
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      onPublicar?.();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Error' })
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tareas/${tarea.id}`),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Tarea eliminada' });
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      onDelete?.();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Error al eliminar' })
  });

  const fechaFormato = new Date(tarea.fecha_limite.substring(0, 10) + 'T00:00:00')
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[
      styles.tareaCard,
      { borderLeftColor: tarea.publicada ? '#10B981' : '#F59E0B', borderLeftWidth: 4 }
    ]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tareaTitle}>{tarea.titulo}</Text>
        {tarea.descripcion && (
          <Text style={styles.tareaDesc}>{tarea.descripcion.substring(0, 100)}</Text>
        )}
        <Text style={styles.tareaFecha}>📅 Entrega: {fechaFormato}</Text>
      </View>

      <View style={{ gap: 8 }}>
        {!tarea.publicada && (
          <>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={{ fontWeight: '800', color: '#fff', fontSize: 12 }}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: '#10B981' }]}
              onPress={() => publicarMutation.mutate()}
              disabled={publicarMutation.isPending}
            >
              <Text style={{ fontWeight: '800', color: '#fff', fontSize: 12 }}>
                {publicarMutation.isPending ? '...' : 'Pub'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Text style={{ fontWeight: '800', color: '#fff', fontSize: 12 }}>
            {deleteMutation.isPending ? '...' : 'Del'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={[
          styles.badge,
          { backgroundColor: tarea.publicada ? '#D1FAE5' : '#FEF3C7' }
        ]}>
          <Text style={{
            fontWeight: '800',
            fontSize: 11,
            color: tarea.publicada ? '#047857' : '#D97706'
          }}>
            {tarea.publicada ? '✅ Publicada' : '⏳ Borrador'}
          </Text>
        </View>
        {tarea.publicada && entregas && (
          <TouchableOpacity onPress={() => setShowEntregas(true)}>
            <Text style={{ fontWeight: '800', color: '#3B82F6', fontSize: 12 }}>
              📊 {entregas.entregadas}/{entregas.total}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ModalEditarTarea
        tarea={tarea}
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => onEdit?.()}
      />
      <ModalEntregas
        tareaId={tarea.id}
        titulo={tarea.titulo}
        visible={showEntregas}
        onClose={() => setShowEntregas(false)}
      />
    </View>
  );
}

function TabSelector({ tabs, activeTab, onTabChange }) {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tab,
              activeTab === t.key && styles.tabActive
            ]}
            onPress={() => onTabChange(t.key)}
          >
            <Text style={[
              styles.tabLabel,
              activeTab === t.key && styles.tabLabelActive
            ]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === t.key && { backgroundColor: 'rgba(255,255,255,0.3)' }
              ]}>
                <Text style={{ fontWeight: '800', fontSize: 11, color: activeTab === t.key ? '#fff' : '#718096' }}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function NavegadorSemana({ grupos, indice, setIndice, colorEmoji, emptyMsg, onSuccess }) {
  if (grupos.length === 0) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <Text style={{ color: '#A0AEC0', fontSize: 14 }}>{emptyMsg}</Text>
      </View>
    );
  }

  const grupo = grupos[indice];
  const hasPrev = indice > 0;
  const hasNext = indice < grupos.length - 1;

  return (
    <View>
      {/* Navegador */}
      <View style={styles.navigator}>
        <TouchableOpacity
          onPress={() => setIndice(i => i - 1)}
          disabled={!hasPrev}
          style={{ opacity: hasPrev ? 1 : 0.3 }}
        >
          <Text style={{ fontSize: 22 }}>←</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', fontSize: 14, color: '#2D3748' }}>
            {colorEmoji} Semana del {grupo.label}
          </Text>
          <Text style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
            {indice + 1} de {grupos.length} · {grupo.tareas.length} tarea{grupo.tareas.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIndice(i => i + 1)}
          disabled={!hasNext}
          style={{ opacity: hasNext ? 1 : 0.3 }}
        >
          <Text style={{ fontSize: 22 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Tareas de la semana */}
      <View style={{ gap: 12, marginTop: 16 }}>
        {grupo.tareas.map(t => (
          <TareaCard
            key={t.id}
            tarea={t}
            onPublicar={onSuccess}
            onDelete={onSuccess}
            onEdit={onSuccess}
          />
        ))}
      </View>
    </View>
  );
}

export default function MaestraTareas() {
  const { usuario } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('proximas');
  const [indicePorRecibir, setIndicePorRecibir] = useState(0);
  const [indiceVencidas, setIndiceVencidas] = useState(0);
  const queryClient = useQueryClient();

  const { data: grupo, isLoading: grupoLoading } = useQuery({
    queryKey: ['mi-grupo'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
  });

  const { data: tareas, isLoading: tareasLoading } = useQuery({
    queryKey: ['tareas', grupo?.id],
    queryFn: () => api.get(`/tareas?grupo_id=${grupo.id}`).then(r => r.data),
    enabled: !!grupo?.id
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tareas', grupo?.id] });
  };

  if (grupoLoading || tareasLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#805AD5" size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const borradores = tareas?.filter(t => !t.publicada) || [];
  const publicadas = tareas?.filter(t => t.publicada) || [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const porRecibir = publicadas.filter(t => {
    const fechaTarea = new Date(t.fecha_limite.substring(0, 10) + 'T12:00:00');
    return fechaTarea >= hoy;
  });
  const vencidas = publicadas.filter(t => {
    const fechaTarea = new Date(t.fecha_limite.substring(0, 10) + 'T12:00:00');
    return fechaTarea < hoy;
  });

  const gruposPorRecibir = agruparPorSemana(porRecibir, 'asc');
  const gruposVencidas = agruparPorSemana(vencidas, 'desc');

  const totalTareas = tareas?.length || 0;

  const TABS = [
    { key: 'proximas', label: '📬 Próximas', count: porRecibir.length },
    { key: 'vencidas', label: '🗂️ Vencidas', count: vencidas.length },
    { key: 'borradores', label: '📤 Borradores', count: borradores.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>📋 Tareas Grupales</Text>
            <Text style={styles.subtitle}>Grupo: {grupo?.nombre}</Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setShowModal(true)}
          >
            <Text style={{ fontSize: 20 }}>+</Text>
          </TouchableOpacity>
        </View>

        {totalTareas === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⏰</Text>
            <Text style={{ color: '#A0AEC0', fontSize: 16 }}>No hay tareas aún</Text>
          </View>
        ) : (
          <>
            {/* Tabs */}
            <TabSelector tabs={TABS} activeTab={tab} onTabChange={setTab} />

            {/* Tab: Próximas */}
            {tab === 'proximas' && (
              <NavegadorSemana
                grupos={gruposPorRecibir}
                indice={indicePorRecibir}
                setIndice={setIndicePorRecibir}
                colorEmoji="📬"
                emptyMsg="No hay tareas próximas"
                onSuccess={handleSuccess}
              />
            )}

            {/* Tab: Vencidas */}
            {tab === 'vencidas' && (
              <NavegadorSemana
                grupos={gruposVencidas}
                indice={indiceVencidas}
                setIndice={setIndiceVencidas}
                colorEmoji="🗂️"
                emptyMsg="No hay tareas vencidas"
                onSuccess={handleSuccess}
              />
            )}

            {/* Tab: Borradores */}
            {tab === 'borradores' && (
              <View>
                {borradores.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#A0AEC0', fontSize: 14 }}>No hay borradores</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {borradores.map(t => (
                      <TareaCard
                        key={t.id}
                        tarea={t}
                        onPublicar={handleSuccess}
                        onDelete={handleSuccess}
                        onEdit={handleSuccess}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {showModal && (
        <ModalNuevaTarea
          grupoId={grupo?.id}
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#2D3748' },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#718096', marginTop: 4 },
  newBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center',
  },
  tabsContainer: { marginBottom: 16, paddingHorizontal: 16 },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 8, gap: 6,
  },
  tabActive: { borderBottomColor: '#3B82F6' },
  tabLabel: { fontWeight: '800', fontSize: 14, color: '#A0AEC0' },
  tabLabelActive: { color: '#3B82F6' },
  tabBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#E2E8F0'
  },
  navigator: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, paddingVertical: 12,
  },
  tareaCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 12,
    marginHorizontal: 16, marginBottom: 4,
  },
  tareaTitle: { fontWeight: '800', fontSize: 16, color: '#2D3748' },
  tareaDesc: { fontSize: 13, color: '#718096', marginTop: 6 },
  tareaFecha: { fontSize: 12, color: '#A0AEC0', marginTop: 6 },
  smallBtn: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, minWidth: 50,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modal: { flex: 1, backgroundColor: '#F7F8FC' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
  },
  modalTitle: { fontWeight: '900', fontSize: 20, color: '#2D3748' },
  modalContent: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontWeight: '800', fontSize: 14, color: '#2D3748', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#2D3748'
  },
  fotoBtn: {
    backgroundColor: '#F7F8FC', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: RADIUS.md,
    paddingVertical: 20, alignItems: 'center', justifyContent: 'center'
  },
  fotoBtnText: { fontWeight: '600', fontSize: 13, color: '#718096' },
  preview: { width: '100%', height: 120, borderRadius: RADIUS.md },
  removeBtn: {
    position: 'absolute', top: 4, right: 4, width: 32, height: 32,
    backgroundColor: '#EF4444', borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center'
  },
  modalFooter: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  btn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center'
  },
  centeredModal: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entregas: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, maxHeight: '80%', width: '100%'
  },
  entregas_header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entregas_title: { fontWeight: '900', fontSize: 16, color: '#2D3748' },
  entregas_subtitle: { fontSize: 12, color: '#A0AEC0', marginBottom: 12 },
  entregas_label: { fontWeight: '800', fontSize: 12, color: '#059669', textTransform: 'uppercase' },
  entregas_label_fail: { fontWeight: '800', fontSize: 12, color: '#DC2626', textTransform: 'uppercase' },
  entregas_item: { fontSize: 13, color: '#2D3748', marginLeft: 8, marginBottom: 4 },
  entregas_empty: { fontSize: 12, color: '#A0AEC0', marginLeft: 8 },
});
