import { createApp } from './app'
import { supabaseDeps } from './deps'
import { loadEnv } from './env'

const app = createApp(supabaseDeps(loadEnv()))
export default app
