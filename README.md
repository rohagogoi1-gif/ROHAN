# Anime Story Web — Enhanced (Offline)

**Version:** enhanced_story_web_admin (local/offline)  
**Files included**
- `index.html` — Public site (browse stories, read).
- `admin.html` — Admin / user accounts & editor (separate admin page).
- `styles.css` — Styling for both pages.
- `script.js` — Main site logic (reader, list, public actions).
- `script_admin.js` — Admin page logic (accounts, editor with live preview, exports).
- `README.md` — This file.

---

## Quick start (use this first)
1. Unzip the archive (e.g. `enhanced_story_web_admin.zip`).
2. Open `index.html` in your browser (double-click the file or `file://`).
   - This is the public reader interface.
3. Open `admin.html` to manage accounts and stories (admin UI).
   - Admin area is a separate page for safety/usability.

> **No server required** — everything runs in the browser using `localStorage` / `sessionStorage`.

---

## Default accounts & security
- Default admin account (created automatically on first run):
  - **Username:** `admin`
  - **Password:** `mypassword`
- All users & passwords are stored in browser `localStorage` (key: `enhanced_users_v1`).
- Current logged-in user is stored in `sessionStorage` (so session survives page reloads but not cross-browser).
- **Important security note:** This system is meant for local/offline use and convenience. Do **not** use it for real sensitive data or production sites.

---

## Accounts
- On `admin.html`:
  - **Register** creates a new normal user account (non-admin).
  - **Login** will log in either admin or normal user.
  - **Logout** clears the session.
  - After login, a logged-in admin sees the admin panel. Normal users see their username and can change their password.
- **Change password:** After you log in, use the `New password` field and `Change Password` button. That updates the stored password for the current user.

---

## Admin features
(visible only when logged in as admin)
- Add a new story (title, tags, optional thumbnail).
- Edit existing stories:
  - Add / reorder / delete pages.
  - Edit page text and upload images for pages.
  - **Live preview** in the editor: as you type page text the preview updates, applying the *action-italic* rules described below.
- Delete stories.
- Export all stories as JSON (`Export All (JSON)`).
- Export individual stories as HTML (`Export HTML`) — includes italics for actions.

---

## Public features (index.html)
- Browse stories, filter (top rated, most viewed, recent), search by title/tags.
- Read stories (pages display with images and parsed formatting).
- Bookmark (local toggle).
- Download individual story as JSON (button provided).
- Export story as HTML (keeps italics for actions).  
  - To get a PDF, see the PDF section below.

---

## Italic formatting rules (Actions-only system)
This project implements a special italic parser with these rules:

- Use `*asterisks*` around **actions** to mark them *italic*.
  - Example: `The door creaked open, *he moved slowly* toward the window.`
  - Shows as: The door creaked open, *he moved slowly* toward the window.
- **Dialogue is NOT italic**, even if it uses `*asterisks*` inside quotes.
  - Example: `She said, "I will go *now*," and then left.`
  - The `*now*` inside quotes will **not** be italicized; the asterisks are removed inside quotes.
- The parser works by splitting text on quoted segments (single or double quotes):
  - Quoted parts: asterisks stripped (no italics).
  - Unquoted parts: `*text*` → `<em>text</em>`.

This rule prevents inline dialogue from accidentally being italicized while letting action-descriptions be emphasized.

---

## Editor — Live preview
- In `admin.html` → Edit Story → Pages Editor:
  - Each page has a textarea and a `preview` area below it.
  - Preview updates as you type and shows the action-italics live.
  - Uploaded page images show below the editor after saving (browsers don't prefill file inputs for security).

---

## Export options (how to get JSON / HTML / PDF)

### 1. JSON (backup)
- Admin page: `Export All (JSON)` downloads a `stories_backup.json` containing all stories.
- Public page: each story has a `Download` button that downloads that story as a `.json` file.

### 2. HTML (single story)
- Use `Export HTML` while reading a story — a simple static HTML file of the story will be created (contains images as data-URLs if available).
- After exporting HTML you can open it in any browser.

### 3. PDF (two options)
**Note:** The provided code includes HTML export but does **not** automatically generate PDFs (because reliable client-side PDF generation requires a library). You have two easy ways to get a PDF:

**Option A — Print-to-PDF (recommended)**
1. Click `Export HTML` to get a standalone story HTML.
2. Open the exported HTML in your browser.
3. File → Print → Choose `Save as PDF` (or Print to PDF) and save.

**Option B — Add client-side PDF export (one-click)**
- If you want in-app PDF export (client-side), paste the small JS snippet below into both `script.js` and `script_admin.js` (or place it in a new file and include it). It uses the [`html2pdf.js`](https://github.com/eKoopmans/html2pdf) library (which must be included from CDN). This will add `exportStoryPDF(id)` function you can call from a button.

**Add to your HTML head** (admin.html and index.html) just before closing `</head>`:
```html
<!-- optional: html2pdf client-side library for PDF export -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js"></script>
