import { Service } from "../../types/service";

export const demoServices: Service[] = [
  {
    id: "srv_recuperacao",
    title: "Recuperação e Reciclagem de Refrigerantes",
    description: "Serviço especializado para recolhimento, tratamento e devolução de fluidos refrigerantes conforme normas ambientais.",
    icon: "recycle",
    slug: "recuperacao-e-reciclagem",
    contactType: "form"
  },
  {
    id: "srv_destinacao",
    title: "Destinação de Fluidos e Cilindros",
    description: "Coleta e destinação final ambientalmente adequada de cilindros descartáveis e gases contaminados.",
    icon: "trash-2",
    slug: "destinacao",
    contactType: "whatsapp"
  },
  {
    id: "srv_retrofit",
    title: "Retrofit de Sistemas",
    description: "Estudo e substituição de gases obsoletos por fluidos modernos e eficientes, garantindo melhor performance.",
    icon: "refresh-cw",
    slug: "retrofit",
    contactType: "form"
  }
];
