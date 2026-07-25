export interface ProductSpec {
  name: string;
  value: string;
}

export interface ProductDocument {
  id: string;
  name: string;
  type: "pdf" | "datasheet" | "manual" | "safety";
  url: string;
}

export interface DemoProduct {
  id: string;
  name: string;
  description: string;
  slug: string;
  categoryId: string;
  brand: string;
  sku: string;
  manufacturerCode?: string;
  price: number;
  isDemoPrice: boolean;
  stockStatus: "in_stock" | "out_of_stock" | "on_demand";
  allowDirectPurchase: boolean;
  images: { id: string; url: string; alt: string }[];
  specs: ProductSpec[];
  applications: string[];
  documents?: ProductDocument[];
  safetyWarnings?: string[];
}
