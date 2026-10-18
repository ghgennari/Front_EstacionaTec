export function normalizeDocument(value: string | null | undefined): string {
  return (value ?? '').replace(/[^a-zA-Z0-9]/g, '');
}

export function normalizePhone(value: string | null | undefined): string {
  return (value ?? '').replace(/[^0-9]/g, '');
}

export function formatDocument(value: string | null | undefined): string {
  const raw = normalizeDocument(value);
  // Documentos diferentes de CPF continuam aceitando letras e outros tamanhos.
  if (!/^\d{1,11}$/.test(raw)) return raw;
  return raw.replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}

export function formatPhone(value: string | null | undefined): string {
  const raw = normalizePhone(value);
  const country = raw.startsWith('55') && (raw.length === 12 || raw.length === 13);
  const number = country ? raw.slice(2) : raw;
  if (number.length > 11 || !number) return raw;
  const prefix = country ? '+55 ' : '';
  if (number.length <= 2) return prefix + '(' + number;
  const subscriber = number.slice(2);
  const split = number.length === 11 ? 5 : 4;
  return prefix + '(' + number.slice(0, 2) + ') ' + subscriber.slice(0, split)
    + (subscriber.length > split ? '-' + subscriber.slice(split) : '');
}

export function matchesPersonalData(query: string, document: string | null | undefined,
    phone?: string | null): boolean {
  const raw = normalizeDocument(query).toLowerCase();
  if (!raw) return false;
  return normalizeDocument(document).toLowerCase().includes(raw)
    || (/^[0-9\s()+.\/-]+$/.test(query) && normalizePhone(phone).includes(raw));
}

export function personalDataError(document: string, phone: string): string {
  if (!/^[0-9]{11}$/.test(document)) return 'Informe o CPF com exatamente 11 números.';
  if (!/^[0-9]{10,11}$/.test(phone)) return 'Informe o telefone com DDD: 10 números para fixo ou 11 para celular.';
  return '';
}
