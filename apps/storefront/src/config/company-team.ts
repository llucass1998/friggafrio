export type CompanyTeamMember = {
  id: string
  name: string
  role: string
  area?: string
  biography?: string
  imageSrc?: string
  imageAlt: string
  group: "founder" | "leadership" | "team"
  active: boolean
  order: number
}

export const companyTeam: CompanyTeamMember[] = [
  {
    "id": "paulo-neulaender",
    "name": "Paulo Neulaender",
    "role": "Fundador e Diretor",
    "area": "Diretoria",
    "biography": "Conhecido no setor como Paulinho, possui mais de 35 anos de experiência técnica em refrigeração e climatização, com grande conhecimento na transição de fluidos refrigerantes.",
    "imageSrc": "/images/team/paulo-neulaender.webp",
    "imageAlt": "Foto do Diretor Paulo Neulaender",
    "group": "founder",
    "active": true,
    "order": 1
  },
  {
    "id": "tita-arantes",
    "name": "Tita Arantes",
    "role": "Diretora De Compras",
    "area": "Diretoria",
    "biography": "Tita Arantes (diretora de compras) , com mais de 15 anos de experiencia , Tita traz sua expertise na avaliação de\n                    fornecedores e produtos, mantendo assim a qualidade que focamos na Frigga.",
    "imageAlt": "Foto de Tita Arantes",
    "group": "leadership",
    "active": true,
    "order": 2,
    "imageSrc": "/images/team/tita-arantes.webp"
  },
  {
    "id": "ricardo-lopes",
    "name": "Ricardo Lopes",
    "role": "Diretor De Rh E Finanças",
    "area": "Diretoria",
    "biography": "Ricardo Lopes (diretor de RH e finanças) , com mais de 15 anos Ricardinho como é conhecido por todos, administra a\n                                equipe da Frigga, mantendo sempre todos com otimismo e foco em suas funções do dia a dia.",
    "imageAlt": "Foto de Ricardo Lopes",
    "group": "leadership",
    "active": true,
    "order": 3,
    "imageSrc": "/images/team/ricardo-lopes.webp"
  },
  {
    "id": "rodrigo-lopes",
    "name": "Rodrigo Lopes",
    "role": "Diretor Comercial",
    "area": "Diretoria",
    "biography": "Rodrigo Lopes (diretor comercial) , com mais de 20 anos de mercado Rodriguinho como é conhecido no setor, trouxe toda\n                                sua bagagem em vendas e suporte na area de expedição, com isso faz com que a Frigga tenha competividade nos preços,\n                                atendimento qualificado e agilidade nas entregas.",
    "imageAlt": "Foto de Rodrigo Lopes",
    "group": "leadership",
    "active": true,
    "order": 4,
    "imageSrc": "/images/team/rodrigo-lopes.webp"
  },
  {
    "id": "eduardo-medeiros",
    "name": "Eduardo Medeiros",
    "role": "Diretor Operacional",
    "area": "Diretoria",
    "biography": "Eduardo Medeiros, (diretor operacional) , com mais de 20 anos no setor, Edu como é chamado, vem com suas experiência em\nvendas e conhecimento de produtos, agregando a equipe de vendas informações técnicas e comerciais,  focando também\nnas questões ambientais dos fluidos refrigerantes, preocupação desde o inicio de abertura da Frigga.",
    "imageAlt": "Foto de Eduardo Medeiros",
    "group": "leadership",
    "active": true,
    "order": 5,
    "imageSrc": "/images/team/eduardo-medeiros.webp"
  },
  {
    "id": "rodrigo-spagnolo",
    "name": "Rodrigo Spagnolo",
    "role": "Diretor Comercial",
    "area": "Diretoria",
    "biography": "Rodrigo Spagnolo, (diretor comercial) , Rodrigão como é conhecido no setor, traz uma bagagem de 20 anos,\n                                fortalecendo a área comercial da Frigga e colaborando diretamente na logistica junto a expedição, motivação da equipe de vendas,\n                                fortalecendo diariamente o incentivo da equipe de vendas e todos colaboradores para sermos sempre uma equipe ágil e\n                                comprometida com nossos clientes.",
    "imageAlt": "Foto de Rodrigo Spagnolo",
    "group": "leadership",
    "active": true,
    "order": 6,
    "imageSrc": "/images/team/rodrigo-spagnolo.webp"
  },
  {
    "id": "ernane-mascarenhas",
    "name": "Ernane Mascarenhas",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Ernane Mascarenhas",
    "group": "team",
    "active": true,
    "order": 7,
    "imageSrc": "/images/team/ernane-mascarenhas.webp"
  },
  {
    "id": "francisco-lima",
    "name": "Francisco Lima",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Francisco Lima",
    "group": "team",
    "active": true,
    "order": 8,
    "imageSrc": "/images/team/francisco-lima.webp"
  },
  {
    "id": "kaio",
    "name": "Kaio",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Kaio",
    "group": "team",
    "active": true,
    "order": 9,
    "imageSrc": "/images/team/kaio.webp"
  },
  {
    "id": "camila",
    "name": "Camila",
    "role": "Caixa",
    "area": "Equipe",
    "imageAlt": "Foto de Camila",
    "group": "team",
    "active": true,
    "order": 10,
    "imageSrc": "/images/team/camila.webp"
  },
  {
    "id": "josefa-de-lima-silva",
    "name": "Josefa De Lima Silva",
    "role": "Copa e Limpeza",
    "area": "Equipe",
    "imageAlt": "Foto de Josefa De Lima Silva",
    "group": "team",
    "active": true,
    "order": 11,
    "imageSrc": "/images/team/josefa-de-lima-silva.webp"
  },
  {
    "id": "ana-carolina",
    "name": "Ana Carolina",
    "role": "Financeiro",
    "area": "Equipe",
    "imageAlt": "Foto de Ana Carolina",
    "group": "team",
    "active": true,
    "order": 12,
    "imageSrc": "/images/team/ana-carolina.webp"
  },
  {
    "id": "natalia-coelho",
    "name": "Natália Coelho",
    "role": "Faturamento",
    "area": "Equipe",
    "imageAlt": "Foto de Natália Coelho",
    "group": "team",
    "active": true,
    "order": 13,
    "imageSrc": "/images/team/natalia-coelho.webp"
  },
  {
    "id": "lucas",
    "name": "Lucas",
    "role": "Motorista",
    "area": "Equipe",
    "imageAlt": "Foto de Lucas",
    "group": "team",
    "active": true,
    "order": 14,
    "imageSrc": "/images/team/lucas.webp"
  },
  {
    "id": "paulo",
    "name": "Paulo",
    "role": "Coord. de Expedição",
    "area": "Equipe",
    "imageAlt": "Foto de Paulo",
    "group": "team",
    "active": true,
    "order": 15,
    "imageSrc": "/images/team/paulo.webp"
  },
  {
    "id": "victor",
    "name": "Victor",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Victor",
    "group": "team",
    "active": true,
    "order": 16,
    "imageSrc": "/images/team/victor.webp"
  },
  {
    "id": "vitor",
    "name": "Vitor",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Vitor",
    "group": "team",
    "active": true,
    "order": 17,
    "imageSrc": "/images/team/vitor.webp"
  },
  {
    "id": "william",
    "name": "William",
    "role": "Expedição",
    "area": "Equipe",
    "imageAlt": "Foto de William",
    "group": "team",
    "active": true,
    "order": 18,
    "imageSrc": "/images/team/william.webp"
  },
  {
    "id": "daniel",
    "name": "Daniel",
    "role": "Motorista",
    "area": "Equipe",
    "imageAlt": "Foto de Daniel",
    "group": "team",
    "active": true,
    "order": 19,
    "imageSrc": "/images/team/daniel.webp"
  },
  {
    "id": "douglas",
    "name": "Douglas",
    "role": "Expedição",
    "area": "Equipe",
    "imageAlt": "Foto de Douglas",
    "group": "team",
    "active": true,
    "order": 20,
    "imageSrc": "/images/team/douglas.webp"
  },
  {
    "id": "kaka",
    "name": "Kaka",
    "role": "Limpeza",
    "area": "Equipe",
    "imageAlt": "Foto de Kaka",
    "group": "team",
    "active": true,
    "order": 21,
    "imageSrc": "/images/team/kaka.webp"
  },
  {
    "id": "rafaela",
    "name": "Rafaela",
    "role": "Caixa",
    "area": "Equipe",
    "imageAlt": "Foto de Rafaela",
    "group": "team",
    "active": true,
    "order": 22,
    "imageSrc": "/images/team/rafaela.webp"
  },
  {
    "id": "roberto",
    "name": "Roberto",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Roberto",
    "group": "team",
    "active": true,
    "order": 23,
    "imageSrc": "/images/team/roberto.webp"
  },
  {
    "id": "sidnei",
    "name": "Sidnei",
    "role": "Vendedor Especialista",
    "area": "Equipe",
    "imageAlt": "Foto de Sidnei",
    "group": "team",
    "active": true,
    "order": 24,
    "imageSrc": "/images/team/sidnei.webp"
  }
];
