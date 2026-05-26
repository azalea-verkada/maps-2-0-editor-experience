# Deploy: local → staging → prod

## Staging (your hub)

**Hub:** https://azalea-verkada.github.io/  
**This app:** https://azalea-verkada.github.io/maps-2-0-editor-experience/

Repos:
- Hub: `azalea-verkada/azalea-verkada.github.io`
- App: `azalea-verkada/maps-2-0-editor-experience`

Push to `main` on the app repo → GitHub Actions deploys. Add/update hub card in `azalea-verkada.github.io/src/data/prototypes.ts`.

## Prod (team source of truth)

**Hub:** https://ankush-rustagi.github.io/  
**This app (after promote):** https://ankush-rustagi.github.io/maps-2-0-editor-experience/

### One-time prod setup (Ankush / org admin)

1. Import `azalea-verkada/maps-2-0-editor-experience` → `Ankush-Rustagi/maps-2-0-editor-experience`
2. Enable **Settings → Pages → GitHub Actions**
3. Merge hub PR on `Ankush-Rustagi/Ankush-Rustagi.github.io` (add card in `prototypes.ts` + `site-updates.ts`)

See also: `../azalea-verkada.github.io/WORKFLOW.md`

## Author

Azalea Phangsoa — credited as **Creator** on hub cards.
