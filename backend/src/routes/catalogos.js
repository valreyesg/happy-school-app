const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const CATALOGOS = {
  'animo': [
    { key: 'feliz',     emoji: '😊', label: 'Feliz'     },
    { key: 'activo',    emoji: '⚡', label: 'Activo'    },
    { key: 'cansado',   emoji: '😴', label: 'Cansado'   },
    { key: 'triste',    emoji: '😢', label: 'Triste'    },
    { key: 'irritable', emoji: '😤', label: 'Irritable' },
  ],
  'cuanto-comio': [
    { key: 'todo',      emoji: '😋', label: 'Todo'      },
    { key: 'casi_todo', emoji: '😊', label: 'Casi todo' },
    { key: 'poco',      emoji: '😐', label: 'Poco'      },
    { key: 'no_comio',  emoji: '❌', label: 'No comió'  },
  ],
  'comportamiento': [
    { key: 'muy_bien',         emoji: '⭐', label: 'Muy bien'   },
    { key: 'bien',             emoji: '👍', label: 'Bien'       },
    { key: 'necesita_mejorar', emoji: '⚠️', label: 'A mejorar' },
  ],
  'condiciones-panial': [
    { key: 'limpio',  label: '✅ Limpio'  },
    { key: 'orina',   label: '💧 Pipí'   },
    { key: 'heces',   label: '💩 Popó'   },
    { key: 'mixto',   label: '🔄 Mixto'  },
    { key: 'diarrea', label: '⚠️ Diarrea' },
  ],
  'tipos-insumo': [
    { key: 'panial',    label: '👶 Pañal'     },
    { key: 'toallitas', label: '🧻 Toallitas' },
    { key: 'crema',     label: '🧴 Crema'     },
  ],
  'vomito-intensidad': [
    { key: 'leve',     label: '🤢 Leve'     },
    { key: 'moderado', label: '🤮 Moderado' },
    { key: 'fuerte',   label: '🚨 Fuerte'   },
  ],
  'tiempos-comida': [
    { key: 'desayuno',     emoji: '🥐', label: 'Desayuno'     },
    { key: 'colacion',     emoji: '🍎', label: 'Colación'     },
    { key: 'comida',       emoji: '🍽️', label: 'Comida'       },
    { key: 'comida_extra', emoji: '🍜', label: 'Comida Extra' },
  ],
  'niveles': [
    { key: 'maternal',  label: 'Maternal'  },
    { key: 'prekinder', label: 'Prekinder' },
    { key: 'kinder1',   label: 'Kinder 1'  },
    { key: 'kinder2',   label: 'Kinder 2'  },
    { key: 'kinder3',   label: 'Kinder 3'  },
  ],
  'roles-personal': [
    { key: 'directora',        label: 'Directora'      },
    { key: 'administrativo',   label: 'Administrativo' },
    { key: 'maestra_titular',  label: 'Miss titular'   },
    { key: 'maestra_auxiliar', label: 'Miss auxiliar'  },
    { key: 'maestra_especial', label: 'Miss especial'  },
    { key: 'maestra_puerta',   label: 'Miss de puerta' },
  ],
  'estados-alumno': [
    { key: 'inscrito',   label: 'Inscrito'   },
    { key: 'reinscrito', label: 'Reinscrito' },
    { key: 'baja',       label: 'Baja'       },
    { key: 'egresado',   label: 'Egresado'   },
  ],
  'tipos-documento': [
    { key: 'acta_nacimiento',     label: 'Acta de nacimiento'       },
    { key: 'curp',                label: 'CURP'                     },
    { key: 'cartilla_vacunacion', label: 'Cartilla de vacunación'   },
    { key: 'comprobante_dom',     label: 'Comprobante de domicilio' },
    { key: 'foto_escolar',        label: 'Fotografía 3×4'          },
    { key: 'ine_tutor',           label: 'INE del tutor'            },
    { key: 'contrato',            label: 'Contrato firmado'         },
    { key: 'otro',                label: 'Otro'                     },
  ],
  'metodos-pago': [
    { key: 'efectivo',      label: 'Efectivo'      },
    { key: 'transferencia', label: 'Transferencia' },
    { key: 'tarjeta',       label: 'Tarjeta'       },
  ],
  'conceptos-pago': [
    { key: 'colegiatura', label: 'Colegiatura' },
    { key: 'material',    label: 'Material'    },
    { key: 'comida',      label: 'Comida'      },
    { key: 'extension',   label: 'Extensión'   },
    { key: 'evento',      label: 'Evento'      },
    { key: 'otro',        label: 'Otro'        },
  ],
};

router.use(authenticate);

router.get('/:tipo', (req, res) => {
  const catalogo = CATALOGOS[req.params.tipo];
  if (!catalogo) return res.status(404).json({ error: `Catálogo '${req.params.tipo}' no existe` });
  res.json({ tipo: req.params.tipo, items: catalogo });
});

module.exports = router;
