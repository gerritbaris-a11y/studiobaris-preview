# StudioBaris Preview-app

Next.js-app die per klant een previewwebsite rendert op basis van data uit Supabase.
Elke klant krijgt een eigen route: `/<slug>` (bijv. `/schildersbedrijf-jansen`).

## Deployen naar Vercel (eenmalig)
Vanuit deze map, kies een van beide:

**A. Via de Vercel CLI**

    npx vercel        # eerste keer: inloggen + project koppelen
    npx vercel --prod # productie-deploy

**B. Via GitHub**
Push deze map naar een GitHub-repo en koppel die in Vercel (auto-deploy).

## Omgevingsvariabelen

Voor het tonen van previews (al ingebouwd als default):
- `NEXT_PUBLIC_SUPABASE_URL` (optioneel, default aanwezig)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optioneel, default aanwezig)

**Verplicht** om het intakeformulier (`/intake`) te laten werken — zet deze in Vercel:
- `SUPABASE_SERVICE_ROLE_KEY` — de service-role key uit Supabase (alleen server-side, nooit publiek)
- `ANTHROPIC_API_KEY` — je Anthropic API-key
- `ANTHROPIC_MODEL` — optioneel, default `claude-sonnet-4-6`

## Routes
- `/<slug>` — de previewsite van een klant (leest live uit Supabase)
- `/intake` — intern formulier om een nieuwe prospect → previewsite te genereren (Workflow 1)
- `/api/intake` — server-route die Claude aanroept, beeld uploadt en opslaat

## Hoe het werkt
- De app leest uit de Supabase-view `public.preview_public` (alleen slug + content + status; leadgegevens blijven afgeschermd).
- Een nieuwe rij in `workflow.previews` met een unieke `slug` is direct live op `/<slug>`.
- Huisstijl (kleuren + Google Fonts) komt uit het `merk`-blok van het content-schema.
