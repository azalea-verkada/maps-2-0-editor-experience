# Verkada Maps 2.0 Editor Experience

Live at https://ankush-rustagi.github.io/maps-2-0-editor-experience/

Interactive editor prototype for Verkada Maps 2.0 — in-context edit mode, tool palette, device placement, and structural drawing. Built on the [Navigation Audit](https://ankush-rustagi.github.io/maps-2-0-nav-audit/) IA with Maps v1 PRD editor MVP scope.

**Author:** Azalea Phangsoa

## Features

- 14 editor preset states (Manage Maps home, tool modes, FOV adjust, dragover upload, etc.)
- 3 viewer preset states (null, place card, files flyout)
- Workspace focus toggle: Editor focus / Full IA
- Interactive PrototypeFrame with editor top bar, tool strip, left/right panels, canvas overlays
- State persistence via localStorage

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- shadcn/ui (new-york style, neutral palette)
- Locked dark mode

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.
