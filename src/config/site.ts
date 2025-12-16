// Configurações centralizadas do site MV Print
// Edite aqui para atualizar em todo o site

export const SITE = {
  name: 'MV Print',
  legalName: 'Mv Print Bh Digital Ltda',
  cnpj: '33.770.142/0001-97',
  foundingDate: '2019-05-29',
  url: 'https://mvprint.com.br',
  description: 'Gráfica e comunicação visual em Belo Horizonte. Plotagem veicular, envelopamento, adesivos, banners, fachadas e tapumes.',
};

export const CONTACT = {
  whatsapp: {
    number: '5531973024426',
    display: '(31) 97302-4426',
    link: 'https://wa.me/5531973024426',
  },
  phone: {
    number: '+553132226708',
    display: '(31) 3222-6708',
  },
  email: 'atendimento@mvprint.com.br',
};

export const ADDRESS = {
  street: 'Rua Bernardes Carvalho, 21, Fundos',
  neighborhood: 'Santa Terezinha',
  city: 'Belo Horizonte',
  state: 'MG',
  zip: '31360-130',
  country: 'BR',
  full: 'Rua Bernardes Carvalho, 21 - Santa Terezinha, Belo Horizonte/MG',
  geo: {
    latitude: -19.8876,
    longitude: -43.9541,
  },
};

export const SOCIAL = {
  instagram: 'https://www.instagram.com/mvprintbh',
  facebook: 'https://www.facebook.com/mvprintbh',
};

export const HOURS = {
  weekdays: '08:00 às 18:00',
  saturday: '08:00 às 12:00',
  display: 'Seg a Sex: 08h às 18h | Sáb: 08h às 12h',
};

// Mensagens pré-preenchidas do WhatsApp
export const WHATSAPP_MESSAGES = {
  default: 'Olá! Vim pelo site da MV Print e gostaria de solicitar um orçamento.',
  plotagem: 'Olá! Gostaria de um orçamento para plotagem veicular.',
  comunicacao: 'Olá! Gostaria de um orçamento para comunicação visual.',
  adesivos: 'Olá! Gostaria de um orçamento para adesivos/banners.',
  grafica: 'Olá! Gostaria de um orçamento para gráfica rápida.',
  portfolio: 'Olá! Vi o portfólio da MV Print e gostaria de solicitar um orçamento.',
  duvida: 'Olá! Tenho uma dúvida sobre os serviços da MV Print.',
};

// Função helper para gerar link do WhatsApp com mensagem
export function getWhatsAppLink(message: keyof typeof WHATSAPP_MESSAGES | string = 'default'): string {
  const msg = WHATSAPP_MESSAGES[message as keyof typeof WHATSAPP_MESSAGES] || message;
  return `${CONTACT.whatsapp.link}?text=${encodeURIComponent(msg)}`;
}
