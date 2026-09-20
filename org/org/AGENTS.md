# Verdent React Vite Starter

- Keep `.verdentc.json` aligned with the actual publish build contract.
- Run `npm run build` before handing off for publishing.
- Supabase URL and publishable key are public config; server-only secrets must stay out of source.
- Services added later must listen on the platform `PORT` variable and update `.verdentc.json`.
