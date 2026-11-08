# challonge-obs

Local Challonge bracket viewer. A Bun server serves the built SPA and a same-origin Challonge
module proxy on `127.0.0.1:8787`. No external account, no external proxy, no API key.

## Run

```bash
bun install
bun run build
bun run start
```

Open `http://127.0.0.1:8787`. URL import works because the browser calls `/api/challonge` on the
same origin. The server fetches the public module page, the parser reads `TournamentStore`, and the
snapshot is stored in SQLite on the local server; the active tournament is stored in the local
overlay state and shared with the OBS overlay. Use the «Турниры» button to switch between or
delete saved snapshots.

## Windows executable

```bash
bun run build:exe
```

This writes `release/PivoChallonge.exe` for Windows x64. The frontend is embedded in the
executable, so the target machine does not need Bun. Put the exe in a writable folder and run it;
it starts the local server and opens `http://127.0.0.1:8787` in the default browser. SQLite data
lives in `data/` next to the exe and stays there when the exe is rebuilt. `OPEN_BROWSER=0` skips
the browser; `PORT` changes the port. The console stays open while the app runs.

On the first launch the exe creates `settings.json` next to itself:

```json
{
  "port": 8787,
  "open_browser": true,
  "db_path": "data/challonge.sqlite"
}
```

`port` sets the listen port. `open_browser` controls the automatic browser launch. `db_path` sets
the SQLite file relative to the folder containing the exe; absolute paths also work.
`DB_PATH` overrides it. The file is created once and is not overwritten by rebuilds. `PORT` and
`OPEN_BROWSER=0` still override it for one run.

For OBS, point a Browser Source at `http://127.0.0.1:8787/overlay`. The page is transparent and
receives the active bracket, view, visibility, pointer, modules, and focus over SSE. When a match or
player-history modal is open in the control panel, the overlay shows the same read-only dialog.
The right-side "Оверлей" panel groups all 13 output modules; its switches are saved optimistically
through `PUT /api/overlay/modules`, and the cursor-size slider persists 32-64 px through
`PUT /api/overlay/pointer-size`. A local "Превью в приложении" switch, off by default and not
persisted, makes the control-panel cards and dialogs use the overlay card and dialog flags. The
header button collapses the panel. Match and player dialogs
share the same `DialogPanel` in the control panel and the overlay, so their size does not jump
between surfaces; the overlay only omits the "Скрыть матч" action while reserving its space.

Manual HTML/JSON paste also works without the server; open the tournament page, save or copy its
HTML, and paste it into the import panel.

## Development

Run Vite and the local API together:

```bash
bun run dev
```

Open the Vite URL (`http://127.0.0.1:22848`). Vite proxies `/api` to
`http://127.0.0.1:8787`. The runner starts both processes and stops both on Ctrl+C. To run them
separately, use `bun run dev:server` and `bun run dev:ui`.

The server is Bun + Elysia. `GET /health` returns `{ ok, db }` after a real SQLite query.
The database is `data/challonge.sqlite` (gitignored), created automatically. Override it with
`DB_PATH=/path/to/db.sqlite bun run start`; `BACKEND_ROOT` overrides the project root used for
`dist/` and the default database path.

The server entry, database, plugins, routes, and services live in `server/`; server-only configs,
types, and helpers live in `src/configs/server`, `src/types/server`, and `src/lib/server`. Frontend
calls go through the classes in `src/api` (`tournaments`, `challonge`, `overlay`, `health`), backed by
the shared `HttpApi` in `src/lib/api`. The overlay server contract includes read-only SSE state,
partial module switches at `PUT /api/overlay/modules`, the persisted cursor size at
`PUT /api/overlay/pointer-size`, and SQLite persistence restored on startup. All control-panel
`useOverlayState` consumers share one SSE connection.
The production `/overlay` page reuses the shared bracket renderer and subscribes through
`api.overlay`; the `App.tsx` control panel owns tournament selection and refresh, and writes the
active slug to the same overlay state. Server tests live in
`server/__tests__/`. The HTTP and SSE reference is in `.docs/API.md`.

The overlay is at `http://127.0.0.1:22848/overlay` in Vite; it uses the real API proxy.

Commands: `bun run dev`, `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`, `bun run build:exe`, `bun run start`.
