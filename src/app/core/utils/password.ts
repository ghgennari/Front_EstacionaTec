export const passwordHelp = 'Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo, sem espaços.';
export function passwordError(value: string, confirmation?: string): string {
  if (value.length < 12 || new TextEncoder().encode(value).length > 72
      || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)
      || !/[^a-zA-Z0-9\s]/.test(value) || /\s/.test(value)) return passwordHelp + ' Limite: 72 bytes.';
  return confirmation !== undefined && value !== confirmation ? 'As senhas não conferem.' : '';
}
