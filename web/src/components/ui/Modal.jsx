import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = false,
  dark = false
}) {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'w-full h-full',
  };

  const backdropColor = dark ? 'bg-black/80' : 'bg-black/40';
  const panelBg = dark ? 'bg-black' : 'bg-white';
  const textColor = dark ? 'text-white' : 'text-gray-800';
  const titleColor = dark ? 'text-gray-200' : 'text-gray-800';
  const borderColor = dark ? 'border-gray-800' : 'border-gray-100';
  const buttonHoverBg = dark ? 'hover:bg-gray-900' : 'hover:bg-gray-100';

  return (
    <div
      className={`fixed inset-0 ${backdropColor} z-50 flex items-center justify-center p-4`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`${panelBg} rounded-3xl shadow-2xl w-full ${sizeClasses[size]} animate-fade-in overflow-y-auto max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between sticky top-0 ${panelBg}`}>
            <h2 className={`text-lg font-black ${titleColor}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg ${dark ? 'text-gray-400' : 'text-gray-400'} ${dark ? 'hover:text-gray-200' : 'hover:text-gray-600'} ${buttonHoverBg} transition-colors`}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
