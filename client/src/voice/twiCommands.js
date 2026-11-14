// Editable text-command dictionary only. Twi speech recognition is not implemented or validated.
export const twiCommands = {
  'kɔ fie': { intent: 'navigate', route: '/' },
  'kɔ dashboard': { intent: 'navigate', route: '/dashboard' },
  'kɔ asase': { intent: 'navigate', route: '/soil' },
  'kɔ afifide': { intent: 'navigate', route: '/advisory' }
};
export function parseTwiCommand(input) {
  const normalized = String(input || '').toLocaleLowerCase('ak').trim();
  const match = Object.entries(twiCommands).find(([phrase]) => phrase.toLocaleLowerCase('ak') === normalized);
  return match ? match[1] : { intent: 'unknown', route: null };
}
