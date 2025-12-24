# LABAlumni

Piattaforma di job placement per studenti LABA Firenze e aziende.

## Stack Tecnologico

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **TypeScript**: Per type safety

## Setup Locale

1. Installa le dipendenze:
```bash
npm install
```

2. Configura Supabase:
   - Crea un progetto su Supabase (o usa Supabase local)
   - Copia `.env.local.example` in `.env.local`
   - Inserisci le credenziali Supabase

3. Esegui le migrazioni del database:
   - Per nuove installazioni: esegui `supabase/migrations/001_initial_schema.sql`
   - Per database esistenti: vedi `MIGRATION_GUIDE.md` per le istruzioni complete

4. Avvia il server di sviluppo:
```bash
npm run dev
```

## Struttura Progetto

- `/app` - Routes e pagine Next.js
- `/components` - Componenti React riutilizzabili
- `/lib` - Utilities e configurazioni
- `/supabase` - Migrazioni e configurazioni database
- `/types` - Definizioni TypeScript

## Funzionalità

- **Area Studenti**: Profilo, portfolio, visualizzazione annunci filtrati per corso
- **Area Aziende**: Gestione annunci, collaborazioni, bacheca comunitaria
- **Bacheca Comunitaria**: Articoli pubblicati dalle aziende
- **Messaggistica**: Scambio email tra studenti e aziende

