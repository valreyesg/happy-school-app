export const ANIMO = {
  feliz:     { emoji: '😊', label: 'Feliz'     },
  activo:    { emoji: '⚡', label: 'Activo'    },
  cansado:   { emoji: '😴', label: 'Cansado'   },
  triste:    { emoji: '😢', label: 'Triste'    },
  irritable: { emoji: '😤', label: 'Irritable' },
};

export const ANIMO_LIST = Object.entries(ANIMO).map(([key, v]) => ({ key, ...v }));

export const CUANTO = {
  todo:      { emoji: '😋', label: 'Todo'      },
  casi_todo: { emoji: '😊', label: 'Casi todo' },
  poco:      { emoji: '😐', label: 'Poco'      },
  no_comio:  { emoji: '❌', label: 'No comió'  },
};

export const CUANTO_LIST = Object.entries(CUANTO).map(([key, v]) => ({ key, ...v }));

export const COMPORTAMIENTO = {
  muy_bien:         { emoji: '⭐', label: 'Muy bien'   },
  bien:             { emoji: '👍', label: 'Bien'       },
  necesita_mejorar: { emoji: '⚠️', label: 'A mejorar' },
};

export const COMPORTAMIENTO_LIST = Object.entries(COMPORTAMIENTO).map(([key, v]) => ({ key, ...v }));

export const TIEMPOS_COMIDA = [
  { key: 'desayuno',     emoji: '🥐', label: 'Desayuno'     },
  { key: 'colacion',     emoji: '🍎', label: 'Colación'     },
  { key: 'comida',       emoji: '🍽️', label: 'Comida'       },
  { key: 'comida_extra', emoji: '🍜', label: 'Comida Extra' },
];

export const CONDICIONES_PANIAL = [
  { key: 'limpio',  emoji: '✅', label: 'Limpio'   },
  { key: 'orina',   emoji: '💧', label: 'Pipí'     },
  { key: 'heces',   emoji: '💩', label: 'Popó'     },
  { key: 'mixto',   emoji: '🔄', label: 'Mixto'    },
  { key: 'diarrea', emoji: '⚠️', label: 'Diarrea'  },
];

export const TIPOS_INSUMO = [
  { key: 'panial',    emoji: '👶', label: 'Pañal'     },
  { key: 'toallitas', emoji: '🧻', label: 'Toallitas' },
  { key: 'crema',     emoji: '🧴', label: 'Crema'     },
];

export const VOMITO_INTENSIDAD = [
  { key: 'leve',     emoji: '🤢', label: 'Leve'     },
  { key: 'moderado', emoji: '🤮', label: 'Moderado' },
  { key: 'fuerte',   emoji: '🚨', label: 'Fuerte'   },
];

export const NIVELES = [
  { key: 'maternal',  label: 'Maternal'  },
  { key: 'prekinder', label: 'Prekinder' },
  { key: 'kinder1',   label: 'Kinder 1'  },
  { key: 'kinder2',   label: 'Kinder 2'  },
  { key: 'kinder3',   label: 'Kinder 3'  },
];
