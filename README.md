# Chicago Affordable Housing Developer (Game)

An educational browser game: work one affordable housing project in Chicago from concept to close. ~15-20 min play. React 19 + Vite + TypeScript + Tailwind v4 + Zustand.

See `docs/superpowers/specs/2026-06-02-chicago-affordable-housing-developer-game-design.md` for the design.

## Local dev

```bash
export PATH="/c/Users/bpi/tools/node-v22.14.0-win-x64:$PATH"
npm install
npm run dev    # http://localhost:5173
npm test       # vitest
npm run build  # production build to dist/
```

## Deploy (Cloudflare Pages)

1. Push to a GitHub repo
2. In Cloudflare dashboard → Pages → Create project → Connect to GitHub
3. Build command: `npm run build`
4. Build output: `dist`
5. Environment: Node 20
6. Deploy

After first deploy, update the `data-domain` attribute on the Plausible script in `index.html` to the deployed Pages URL.
