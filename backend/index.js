// Entry point: loads .env (if present), then starts the server in src/index.js.
// .env must load first, because the database code reads its settings while loading.
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'

const envFile = new URL('.env', import.meta.url) // the .env next to this file
if (existsSync(envFile)) loadEnvFile(envFile)

await import('./src/index.js')
