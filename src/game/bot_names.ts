export const BOT_NAMES = ['Neo', 'Trinity', 'Satoshi', 'Roxy', 'Cipher', 'Viper', 'Jax']

export function getBotName(playerId: string): string {
  const botNumber = parseInt(playerId.match(/_(\d+)$/)?.[1] || '1', 10)
  return BOT_NAMES[(botNumber - 1) % BOT_NAMES.length] || `Bot ${botNumber}`
}
