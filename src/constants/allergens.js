// Ürün formunda seçilir, dijital menüde gösterilir.
// Veritabanında virgülle ayrılmış kod listesi olarak saklanır: "gluten,sut"
export const ALLERGENS = [
  { code: 'gluten',     label: 'Gluten'        },
  { code: 'sut',        label: 'Süt'           },
  { code: 'yumurta',    label: 'Yumurta'       },
  { code: 'findik',     label: 'Sert kabuklu'  },
  { code: 'yerfistigi', label: 'Yer fıstığı'   },
  { code: 'soya',       label: 'Soya'          },
  { code: 'balik',      label: 'Balık'         },
  { code: 'kabuklu',    label: 'Kabuklu deniz' },
  { code: 'susam',      label: 'Susam'         },
  { code: 'hardal',     label: 'Hardal'        },
  { code: 'kereviz',    label: 'Kereviz'       },
  { code: 'sulfit',     label: 'Sülfit'        },
]

export function parseAllergens(csv) {
  return (csv || '').split(',').map(s => s.trim()).filter(Boolean)
}

export function allergenLabels(csv) {
  const map = Object.fromEntries(ALLERGENS.map(a => [a.code, a.label]))
  return parseAllergens(csv).map(code => map[code] || code)
}
