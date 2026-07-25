export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  slug: string;
  contactType: "whatsapp" | "email" | "form";
}
