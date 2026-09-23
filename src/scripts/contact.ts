// Formulário de contato: monta a mensagem e abre o WhatsApp.
import { getWhatsAppLink } from '../config/site';

const SERVICE_NAMES: Record<string, string> = {
  plotagem: 'Plotagem veicular',
  comunicacao: 'Fachadas e sinalização',
  ambientes: 'Ambientes e vitrines',
  tapumes: 'Tapumes e lonas',
  adesivos: 'Adesivos e etiquetas',
  grafica: 'Gráfica rápida',
  outro: 'Outro',
};

/** (31) 99999-9999 enquanto digita; aceita também números com +55. */
function formatPhone(raw: string) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function initContact() {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  const phone = form.querySelector<HTMLInputElement>('#whatsapp');
  phone?.addEventListener('input', () => {
    const atEnd = phone.selectionStart === phone.value.length;
    phone.value = formatPhone(phone.value);
    if (atEnd) phone.setSelectionRange(phone.value.length, phone.value.length);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const whatsapp = String(data.get('whatsapp') ?? '').trim();
    const service = String(data.get('service') ?? '');
    const message = String(data.get('message') ?? '').trim();

    let text = 'Olá! Vim pelo site da MV Print.\n\n';
    text += `*Nome:* ${name}\n`;
    text += `*WhatsApp:* ${whatsapp}\n`;
    text += `*Serviço:* ${SERVICE_NAMES[service] ?? service}\n`;
    if (message) text += `*Mensagem:* ${message}`;

    window.location.assign(getWhatsAppLink(text));
  });
}
