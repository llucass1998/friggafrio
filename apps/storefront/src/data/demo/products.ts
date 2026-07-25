import { DemoProduct } from "../../types/product";

export const demoProducts: DemoProduct[] = [
  {
    id: "prod_r600a",
    name: "Gás Refrigerante R600a (Isobutano) 420g",
    description: "Fluido refrigerante natural de alta pureza, ideal para aplicações em refrigeração doméstica e pequenos equipamentos comerciais. Possui excelente eficiência energética e baixíssimo impacto ambiental (GWP = 3).",
    slug: "gas-refrigerante-r600a-420g",
    categoryId: "cat_gases",
    brand: "Friggafrio",
    sku: "FRG-600-420",
    price: 35.90,
    isDemoPrice: true,
    stockStatus: "in_stock",
    allowDirectPurchase: true,
    images: [
      { id: "img_1", url: "https://placehold.co/600x600/eaf5ff/0b4f8a?text=R600a+420g", alt: "Cilindro descartável de Gás R600a" }
    ],
    specs: [
      { name: "Peso Líquido", value: "420g" },
      { name: "Composição", value: "Isobutano (CH(CH3)3)" },
      { name: "ODP", value: "0" },
      { name: "GWP", value: "3" },
      { name: "Classe de Segurança", value: "A3 (Altamente Inflamável)" }
    ],
    applications: [
      "Refrigeradores domésticos",
      "Frigobares",
      "Congeladores horizontais"
    ],
    safetyWarnings: [
      "A seleção, aplicação, armazenamento e manuseio de fluidos refrigerantes devem seguir as especificações do fabricante e as normas de segurança aplicáveis.",
      "Produto altamente inflamável (Classe A3). Não exponha a chamas ou faíscas."
    ]
  },
  {
    id: "prod_comp_herm",
    name: "Compressor Hermético 1/3 HP 220V R134a",
    description: "Compressor hermético de alta eficiência para refrigeração comercial leve. Desenvolvido para oferecer durabilidade, baixo nível de ruído e excelente desempenho térmico.",
    slug: "compressor-hermetico-1-3-hp-220v-r134a",
    categoryId: "cat_compressores",
    brand: "Tecumseh",
    sku: "COMP-TEC-134",
    manufacturerCode: "THB1360Y",
    price: 485.50,
    isDemoPrice: true,
    stockStatus: "in_stock",
    allowDirectPurchase: true,
    images: [
      { id: "img_2", url: "https://placehold.co/600x600/eaf5ff/0b4f8a?text=Compressor+1/3+HP", alt: "Compressor Hermético Preto" }
    ],
    specs: [
      { name: "Potência", value: "1/3 HP" },
      { name: "Tensão", value: "220V / 60Hz" },
      { name: "Gás Compatível", value: "R134a" },
      { name: "Fases", value: "Monofásico" },
      { name: "Aplicação", value: "LBP (Baixa Pressão de Retorno)" }
    ],
    applications: [
      "Freezers comerciais",
      "Ilhas de congelados",
      "Balcões refrigerados"
    ]
  }
];
