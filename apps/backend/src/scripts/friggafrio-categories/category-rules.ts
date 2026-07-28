import { CanonicalCategoryHandle } from "./types"
import { normalizeText } from "./normalize-text"

type TextRule = {
  keywords: string[]
  handle: CanonicalCategoryHandle
}

export const TEXT_RULES: TextRule[] = [
  {
    handle: "gases-refrigerantes",
    keywords: [
      "gas r22", "r134a", "r404a", "r410a", "r407c", "r600a",
      "fluido refrigerante", "gas refrigerante", "botija de gas", "lata de gas"
    ]
  },
  {
    handle: "compressores",
    keywords: ["compressor", "motocompressor", "unidade compressora"]
  },
  {
    handle: "camara-fria-condensacao",
    keywords: [
      "condensador", "evaporador", "unidade condensadora", 
      "camara fria", "forcador de ar", "forcador"
    ]
  },
  {
    handle: "valvulas-controles",
    keywords: [
      "valvula", "pressostato", "termostato", "controlador", 
      "sensor", "solenoide", "valvula de expansao"
    ]
  },
  {
    handle: "ferramentas-equipamentos",
    keywords: [
      "manifold", "vacuometro", "bomba de vacuo", "alicate", 
      "flangeador", "cortador", "ferramenta", "detector de vazamento", 
      "balanca de refrigeracao"
    ]
  },
  {
    handle: "instalacao-isolamento",
    keywords: [
      "tubo de cobre", "cobre rigido", "cobre flexivel", "isolamento", 
      "fita", "suporte", "conexao", "curva de cobre", "luva de cobre"
    ]
  },
  {
    handle: "oleos-produtos-quimicos",
    keywords: [
      "oleo", "lubrificante", "solvente", "limpa serpentina", "desengraxante"
    ]
  },
  {
    handle: "cilindros-recolhimento",
    keywords: [
      "cilindro", "recolhedora", "recolhimento", "tanque de recolhimento"
    ]
  },
  {
    handle: "quadros-automacao",
    keywords: [
      "quadro eletrico", "automacao", "contator", "rele", "disjuntor", "temporizador"
    ]
  }
]

export function checkTextRules(normalizedText: string): CanonicalCategoryHandle[] {
  const matches = new Set<CanonicalCategoryHandle>()
  
  for (const rule of TEXT_RULES) {
    for (const keyword of rule.keywords) {
      // Usar boundaries de palavra para evitar falsos positivos
      // como "condensador" batendo em "unidade condensadora" se não for cuidado,
      // mas como estamos usando includes, queremos pegar "compressor" em "compressor 1/4"
      const regex = new RegExp(`\b${keyword}\b`, 'i')
      if (regex.test(normalizedText)) {
        matches.add(rule.handle)
      } else if (normalizedText.includes(keyword)) {
        matches.add(rule.handle)
      }
    }
  }
  
  return Array.from(matches)
}
