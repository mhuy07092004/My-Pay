import { createApp } from './app'
import { supabaseDeps } from './deps'
import { loadEnv } from './env'

const env = loadEnv()
const app = createApp(supabaseDeps(env))
app.listen(env.PORT, () => {
  console.log(`My Pay API listening on http://localhost:${env.PORT}`)
})
