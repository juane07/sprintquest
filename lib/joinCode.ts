// Short, human-dictatable team codes (no confusables: 0/O, 1/I/L excluded).
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const CODE_LENGTH = 6

export function generateJoinCode(len: number = CODE_LENGTH): string {
  let s = ""
  for (let i = 0; i < len; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return s
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export function isValidCodeFormat(code: string): boolean {
  if (code.length === 0) return false
  return [...code].every((ch) => CODE_ALPHABET.includes(ch))
}
