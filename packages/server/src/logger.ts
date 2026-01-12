// ANSI color codes
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'

export const logger = {
  /** Dim text for background info (e.g., incoming RPC methods) */
  dim: (message: string) => console.log(`${DIM}${message}${RESET}`),

  /** Red text with x prefix for errors/warnings */
  error: (message: string) => console.warn(`${RED}x ${message}${RESET}`),

  /** Green text with + prefix for success */
  success: (message: string) => console.log(`${GREEN}+ ${message}${RESET}`),

  /** Yellow text with ⏳ prefix for pending/waiting (includes leading newline) */
  pending: (message: string) => console.log(`\n${YELLOW}⏳ ${message}${RESET}`),

  /** Yellow text with ⚠ prefix for warnings */
  warn: (message: string) => console.log(`${YELLOW}⚠ ${message}${RESET}`),

  /** Plain console.error */
  fatal: (message: string) => console.error(message),

  /** Raw console.log (for banners, etc.) */
  raw: (message: string) => console.log(message),
}

/** Format text as bold */
export const bold = (text: string) => `${BOLD}${text}${RESET}`

/** Format text as dim */
export const dim = (text: string) => `${DIM}${text}${RESET}`
