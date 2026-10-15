# POS Demo (PWA)
1. Supabase > SQL Editor: run `supabase/schema.sql`, then `supabase/menu_seed.sql`, then `supabase/customer_view.sql`.
2. Edit `js/config.js` with your URL + anon key.
3. Serve over HTTPS or localhost (e.g. `npx serve .`, GitHub Pages, Netlify). Open once online, then it works offline; use "Install" from the browser.
Files: `index.html` (shell) · `css/style.css` · `js/app.js` (all logic) · `sw.js` (offline cache) · `manifest.json`.
Orders/menu/settings live in localStorage and auto-sync to Supabase when online (Sync Status panel shows pending items).

Customer ordering: open `customer.html?table=5` (get the link from Tables > Copy customer link; make a QR from it with any QR generator). Orders land in Live Orders within ~15 s.
