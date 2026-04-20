import { useRef, useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

export default function SignaturePad({ onSign, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2;
    context.strokeStyle = '#333';
    setCtx(context);
  }, []);

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const save = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSign(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-black text-gray-800">Firmar documento</h2>

          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full border-3 border-gray-200 rounded-2xl bg-white cursor-crosshair"
            style={{ height: '200px' }}
          />

          <div className="flex gap-3">
            <button
              onClick={clear}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-red-300 text-red-600 font-bold hover:bg-red-50 transition-colors"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={save}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} /> Confirmar
            </button>
          </div>

          <button
            onClick={onCancel}
            className="w-full px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
