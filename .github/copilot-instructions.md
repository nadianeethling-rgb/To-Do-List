## Purpose

Short, focused instructions to help AI coding agents work productively in this repository (a small static single-page Task Manager).

## Big picture

- This is a single-page, framework-free web app composed of static assets: `index.html`, `script.js`, and `styles.css`.
- All app state is client-side. There is no backend, build step, or test harness in the repository.

## Key files

- `index.html` — app shell and form. Script is included at the end of body.
- `script.js` — app logic, DOM manipulation and storage. Primary place to change behavior.
- `styles.css` — visual styles and class names used by `script.js` (e.g. `.notepad-window`, `.notepad-list`, `.task-content`, `.category-label`, `.task-text`, `.task-buttons`, `.remove-btn`, `.note-photo`).

## Data model (discoverable in `script.js`)

- The app stores tasks as an array in localStorage under the key `tasks`.
- Each task is an object with these properties:
  - `id` (number, generated with `Date.now()`)
  - `text` (string)
  - `category` (string: `Work` | `Personal` | `Other`)
  - `fontColor` (string, hex)
  - `categoryColor` (string, hex) — chosen from `categoryColors` mapping at top of `script.js`
  - `dueDate` (string, from `<input type="date">`, format `YYYY-MM-DD`)
  - `priority` (string: cycles `Normal` → `High` → `Low`)
  - `photo` (string) — currently a URL returned by `URL.createObjectURL(file)`

Example saved JSON:
```json
{ "id": 1610000000000, "text": "Buy milk", "category": "Personal", "fontColor": "<fontColor>", "categoryColor": "<categoryColor>", "dueDate": "2026-01-10", "priority": "Normal", "photo": "blob:http://..." }
```

Important note (observable in `script.js`): the `photo` value is produced via `URL.createObjectURL(...)` and then persisted into localStorage. Object URLs are not reliable long-term storage for files — after a page unload they may become invalid. If you work on photo persistence, consider switching to FileReader (data URL) or IndexedDB for discoverable, cross-session persistence.

## UI & behavior patterns

- Imperative DOM rendering: `renderTasks()` rebuilds the list from the `tasks` array and applies inline styles for category color and font color.
- Priority is represented visually by `li.style.borderLeft` and the priority button displays current priority; toggling cycles three states.
- Editing uses `prompt()` (quick-and-dirty inline edit). Removal stores the last deleted task in `lastDeletedTask` and shows a transient undo widget (4s) appended to `document.body`.
- Filtering and sorting are client-side in-memory ops: `filterCategory` controls visibleTasks; sorting uses `new Date(dueDate)` and treats missing due dates as 'last'.

## Developer workflow / running locally

- No build step. To preview, open `index.html` in a browser. For a simple local server (useful for file/URL behavior), run one of these from the repo root:

  - Python (if available): `python -m http.server 8000`
  - Node (if available): `npx http-server -p 8000`

- After changes to `script.js` refresh the browser. Use the browser console to inspect `localStorage.getItem('tasks')` and runtime errors.

## Conventions & notes for contributors / agents

- Make small edits directly to `script.js`. Patterns to follow:
  - Keep DOM creation and class names consistent with `styles.css`.
  - Update `renderTasks()` when changing the task shape or UI elements.
  - Persist changes via `saveTasks()` (already used throughout).

- Quick debugging helpers (discoverable in code):
  - Reset state: `localStorage.removeItem('tasks')` in the console.
  - Inspect current tasks: `JSON.parse(localStorage.getItem('tasks') || '[]')`.

## When modifying image handling

- Current behavior: on form submit the code stores `URL.createObjectURL(file)` in `task.photo`. This produces a blob URL string saved to `localStorage`.
- Because blob URLs are ephemeral, any work that needs reliable persistence should convert the file to a Data URL (`FileReader.readAsDataURL`) or persist the raw file into IndexedDB and store a stable reference.

## Safety & scope

- This repo contains only static client-side code. No secrets, auth, or networked services to mock. Keep changes confined to the three main files unless you add tooling (then update README or add a small `package.json`).

---

If anything above is unclear or you'd like the agent instructions to include example code snippets (for example: replacing `URL.createObjectURL` with `FileReader`), tell me which area to expand and I will iterate.
