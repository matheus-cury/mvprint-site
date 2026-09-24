// Formulário de contato: monta a mensagem e abre o WhatsApp. O número de quem
// escreve já chega junto com a conversa, então o formulário não pede telefone.
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

export function initContact() {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const service = String(data.get('service') ?? '');
    const message = String(data.get('message') ?? '').trim();

    let text = 'Olá! Vim pelo site da MV Print.\n\n';
    text += `*Nome:* ${name}\n`;
    text += `*Serviço:* ${SERVICE_NAMES[service] ?? service}\n`;
    if (message) text += `*Mensagem:* ${message}`;

    window.location.assign(getWhatsAppLink(text));
  });
}
