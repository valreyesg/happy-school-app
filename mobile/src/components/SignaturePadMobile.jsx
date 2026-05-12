/**
 * SignaturePadMobile.jsx
 * Canvas de firma táctil para React Native (Expo Go compatible).
 * Implementado con react-native-gesture-handler + react-native-svg.
 * No requiere react-native-webview ni builds nativos extra.
 *
 * Props:
 *   onConfirm(dataUrl: string) — devuelve PNG en base64 data:image/png;base64,...
 *   onCancel()                 — cancelar sin firmar
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD_W = SCREEN_W - 48;   // 24px margen cada lado
const PAD_H = 220;

// Convierte array de strokes (path strings) a canvas PNG base64
// usando un canvas virtual mínimo en JS puro (sin WebView)
function strokesToDataUrl(strokes, w, h) {
  // Generamos un SVG string y lo encodificamos como data URI de imagen SVG
  // El backend acepta firma_data como base64 — enviamos SVG embebido en PNG-like data URI
  // En realidad enviamos SVG data URI que el backend almacena tal cual en firma_padre_url
  const pathElements = strokes
    .map(d => `<path d="${d}" stroke="#1a1a2e" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="background:#fff">
  <rect width="${w}" height="${h}" fill="white"/>
  ${pathElements}
</svg>`;

  const b64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}

export default function SignaturePadMobile({ onConfirm, onCancel }) {
  const [strokes, setStrokes] = useState([]);        // paths completos guardados
  const currentPath = useRef('');                    // path en construcción
  const [currentD, setCurrentD] = useState('');     // fuerza re-render del path activo
  const isEmpty = strokes.length === 0 && currentD === '';

  const handleClear = useCallback(() => {
    setStrokes([]);
    currentPath.current = '';
    setCurrentD('');
  }, []);

  const handleConfirm = useCallback(() => {
    const allStrokes = currentD ? [...strokes, currentD] : strokes;
    if (allStrokes.length === 0) return;
    const dataUrl = strokesToDataUrl(allStrokes, PAD_W, PAD_H);
    onConfirm(dataUrl);
  }, [strokes, currentD, onConfirm]);

  // Gesture: pan para dibujar
  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      const x = Math.round(e.x);
      const y = Math.round(e.y);
      currentPath.current = `M${x},${y}`;
      setCurrentD(currentPath.current);
    })
    .onUpdate((e) => {
      const x = Math.round(e.x);
      const y = Math.round(e.y);
      currentPath.current += ` L${x},${y}`;
      setCurrentD(currentPath.current);
    })
    .onEnd(() => {
      if (currentPath.current) {
        setStrokes(prev => [...prev, currentPath.current]);
        currentPath.current = '';
        setCurrentD('');
      }
    })
    .runOnJS(true);

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <Text style={s.title}>✍️ Firmar incidente</Text>
          <Text style={s.subtitle}>
            Al firmar confirmas que estás enterado del incidente reportado.
          </Text>

          {/* Canvas */}
          <View style={s.canvasWrapper}>
            <GestureDetector gesture={panGesture}>
              <View style={s.canvas} collapsable={false}>
                <Svg width={PAD_W} height={PAD_H} style={StyleSheet.absoluteFill}>
                  {/* Strokes guardados */}
                  {strokes.map((d, i) => (
                    <Path
                      key={i}
                      d={d}
                      stroke="#1a1a2e"
                      strokeWidth={2.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {/* Stroke activo */}
                  {currentD ? (
                    <Path
                      d={currentD}
                      stroke="#1a1a2e"
                      strokeWidth={2.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                </Svg>
                {isEmpty && (
                  <Text style={s.placeholder}>Firma aquí con tu dedo</Text>
                )}
              </View>
            </GestureDetector>
          </View>

          {/* Botones */}
          <View style={s.botones}>
            <TouchableOpacity style={s.btnLimpiar} onPress={handleClear}>
              <Text style={s.btnLimpiarTxt}>🗑️ Limpiar</Text>
            </TouchableOpacity>

            <View style={s.botonesRight}>
              <TouchableOpacity style={s.btnCancelar} onPress={onCancel}>
                <Text style={s.btnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnConfirmar, isEmpty && s.btnDisabled]}
                onPress={handleConfirm}
                disabled={isEmpty}
              >
                <Text style={s.btnConfirmarTxt}>✅ Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 16,
    lineHeight: 18,
  },
  canvasWrapper: {
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  canvas: {
    width: PAD_W,
    height: PAD_H,
    backgroundColor: '#FAFAFA',
  },
  placeholder: {
    position: 'absolute',
    top: PAD_H / 2 - 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: '#A0AEC0',
    pointerEvents: 'none',
  },
  botones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  botonesRight: {
    flexDirection: 'row',
    gap: 8,
  },
  btnLimpiar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  btnLimpiarTxt: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  btnCancelar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EDF2F7',
  },
  btnCancelarTxt: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '600',
  },
  btnConfirmar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#38A169',
  },
  btnConfirmarTxt: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#C6F6D5',
  },
});
