/**
 * Local UI fixtures. Vite replaces `import.meta.env.DEV` with `false` in
 * production, so this is constant false in `vite build`, CI, and Vercel.
 * Set the variable with `npm run dev:mock`, not in a committed env file.
 */
export const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK === 'on'
