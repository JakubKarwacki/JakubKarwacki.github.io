# JakubKarwacki.github.io

Osobista strona na GitHub Pages: imię, link do GitHuba i [ContributionSkyline](src/components/ui/contribution-skyline.tsx) (rok aktywności jako mapa 2D / skyline 3D).

Stack: Vite, React 19, TypeScript (strict), Tailwind CSS v4, shadcn.

## Development

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Parametry URL (używane przez workflow generujący obrazek do profile README):
`?embed=1` (sam wykres, 980 px, bez stopki), `?theme=dark|light`, `?view=2d|3d`.
Po zakończeniu animacji strona ustawia `document.documentElement.dataset.ready = "1"`.

## Dane

`public/contributions.json` (`[{date,count}]`) generuje `scripts/fetch-contributions.ts` z GitHub GraphQL
(`GITHUB_TOKEN`). Workflow `deploy.yml` odświeża je przy każdym pushu na `main`, codziennie (cron) i ręcznie,
po czym buduje i wdraża stronę. Przy błędzie skrypt zostawia istniejący plik i kończy się kodem 0.
Lokalnie: `GITHUB_TOKEN=<token> pnpm fetch-contributions`.

## Dlaczego komponenty są w `src/components/ui`

To konwencja shadcn: `components.json` mapuje alias `@/components/ui` na ten katalog, więc `shadcn add <komponent>`
zapisuje tam pliki, a importy działają przez alias `@` → `src`. `contribution-skyline.tsx` jest vendorowany bez zmian.
