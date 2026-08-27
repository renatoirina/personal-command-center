# Personal Command Center

Dashboard locale in stile Apple glassmorphism per tenere insieme salute, allenamenti, alimentazione, finanze, studio e knowledge hub.

Il progetto include solo dati demo anonimi. I dati personali reali vanno tenuti fuori dal repository, per esempio in `private-data/` o tramite export JSON locali non tracciati da Git.

## Avvio

```bash
npm install
npm run dev
```

Poi apri l'indirizzo mostrato dal terminale.

## Dati

- I dati iniziali sono in `src/data/personal-command-center.json`.
- Le modifiche fatte nell'app vengono salvate nel browser con `localStorage`.
- Puoi esportare e importare un JSON dalla barra azioni in alto.
- Il pannello `AI bridge` genera un context pack leggibile da Codex.
- `.gitignore` esclude `private-data/` e `*-export.json` per evitare pubblicazioni accidentali.

## Struttura

- `src/main.jsx`: componenti React e logica dello stato.
- `src/styles.css`: design glassmorphism, responsive layout e dark mode.
- `src/data/personal-command-center.json`: profilo e metriche iniziali.
