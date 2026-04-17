import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      const usuario = await login(email.trim().toLowerCase(), password);
      const routes = {
        directora: '/(directora)/',
        administrativo: '/(admin)/',
        maestra_titular: '/(maestra)/',
        maestra_especial: '/(maestra)/',
        maestra_puerta: '/(maestra)/',
        padre: '/(padre)/',
      };
      router.replace(routes[usuario.rolPrincipal] || '/login');
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Credenciales incorrectas. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header con gradiente */}
        <LinearGradient
          colors={['#FED7D7', '#E9D5FF']}
          style={styles.header}
        >
          <Text style={styles.emoji}>🏫</Text>
          <Text style={styles.title}>Happy School</Text>
          <Text style={styles.slogan}>Comunidad Infantil</Text>
        </LinearGradient>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.welcomeTitle}>¡Hola! 👋</Text>
          <Text style={styles.welcomeSub}>Inicia sesión para continuar</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#CBD5E0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholderTextColor="#CBD5E0"
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                <Text style={{ fontSize: 20 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Entrar a la app 🚀</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            ¿Problemas para entrar? Contacta a la directora 📞
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emoji: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: '900', color: '#805AD5' },
  slogan: { fontSize: 16, fontWeight: '700', color: '#B794F4', letterSpacing: 1 },
  form: { flex: 1, padding: 24, paddingTop: 32 },
  welcomeTitle: { fontSize: 28, fontWeight: '900', color: '#2D3748', marginBottom: 4 },
  welcomeSub: { fontSize: 15, fontWeight: '600', color: '#718096', marginBottom: 28 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: '#4A5568', marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    backgroundColor: '#FAFAFA',
  },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  loginBtn: {
    backgroundColor: '#805AD5',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#805AD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  helpText: {
    textAlign: 'center',
    color: '#CBD5E0',
    fontWeight: '600',
    marginTop: 24,
    fontSize: 13,
  },
});
