export function toMap(items = []) {
  return Object.fromEntries(items.map(item => [item.key, item]));
}

export const ROL_COLOR = {
  directora:        'bg-purple-100 text-purple-700',
  administrativo:   'bg-blue-100 text-blue-700',
  maestra_titular:  'bg-green-100 text-green-700',
  maestra_auxiliar: 'bg-teal-100 text-teal-700',
  maestra_especial: 'bg-yellow-100 text-yellow-700',
  maestra_puerta:   'bg-orange-100 text-orange-700',
};
