# Urdu + Arabic Blog

A complete blog website for Urdu (Nastaliq) and Arabic writing.

* Everyone can **read** the blogs. Only **you** can write, edit, delete (password-protected admin panel).
* Sections: **Quran, Hadith, Ikhtilafi Masail (Shia + Sunni), Ikhtilafat (Barelvi + Deobandi + Ahle Hadith), Politicals, My Books**.
* Dark / light mode button on the right side of the header (remembers the reader's choice).
* Urdu shown in **Noto Nastaliq Urdu**, Arabic in **Amiri**. Readers can also make the text bigger/smaller and switch Urdu between Nastaliq and Naskh.
* Links inside posts, quote boxes for verses/hadith, Arabic font for any selected text, English (LTR) paragraphs.
* Drafts, publish/unpublish, edit, delete, search, mobile friendly, sitemap for Google.
* Fonts and editor are included in the folder, so nothing is loaded from other websites.

---------------------------------------------------------------------------

## 1. What is inside

```
server.js               starts the website
.env.example            template for your private settings  (copy to .env)
config/sections.js      the 6 sections (names, colours)  <- edit here to rename/add sections
src/                    the website code (routes, database, security)
views/                  the pages (HTML templates)
views/about.ejs         the "About" page text  <- edit this to write your introduction
public/css/style.css    colours and fonts (see the ":root" part at the top)
public/fonts/           Nastaliq / Naskh / Amiri fonts
scripts/                helper commands (init-db, seed, gen-secret)
```

## 2. Install the tools (one time)

1. **Node.js** (version 18 or newer, "LTS"): https://nodejs.org
2. A **PostgreSQL database** - see step 3 (you can use a free online one, nothing to install).

Open a terminal (Command Prompt / PowerShell on Windows) inside this folder and run:

```
npm install
```

## 3. Database link (`DATABASE_URL`)

The site stores posts in PostgreSQL. The tables are created **automatically** the first
time the site starts, you do not need to write any SQL.

You need one thing: a **connection link**. It always looks like this:

```
postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
```

Pick ONE of these ways to get it:

### Option A - Free online database (easiest, also works when the site is online)
Use any hosted PostgreSQL provider, for example **Neon** (neon.tech) or **Supabase** (supabase.com):

1. Create a free account and a new project/database.
2. Find **"Connection string"** (Neon: dashboard -> *Connect*; Supabase: *Project Settings -> Database -> Connection string -> URI*).
3. Copy it. It looks like  
   `postgresql://user:password@ep-something.region.aws.neon.tech/dbname?sslmode=require`
4. Paste it into `.env` as `DATABASE_URL=...` (step 4).

If the link contains `[YOUR-PASSWORD]`, replace that part (including the brackets) with your real database password.
If your password has special characters like `@ # / ?`, they must be URL-encoded (`@` becomes `%40`).

### Option B - PostgreSQL on your own computer
1. Install PostgreSQL from https://www.postgresql.org/download/ (remember the password you set for the `postgres` user).
2. Create an empty database (in "SQL Shell (psql)" or pgAdmin):
   ```
   CREATE DATABASE urduarabicblog;
   ```
3. Your link is:
   `postgresql://postgres:YOUR_PASSWORD@localhost:5432/urduarabicblog`

## 4. The `.env` file (your private settings)

1. Copy `.env.example` and name the copy exactly `.env`  
   (Windows: `copy .env.example .env`   Mac/Linux: `cp .env.example .env`)
2. Open `.env` in any text editor and fill it in:

| Setting | What to put |
|---|---|
| `DATABASE_URL` | The link from step 3. |
| `ADMIN_PASSWORD` | The password you will type to enter the admin panel. Long and private (at least 8 characters, 12+ is better). |
| `JWT_SECRET` | A long random text that protects your login. Run `npm run gen-secret`, copy the result and paste it here. |
| `SITE_URL` | Your website address, no slash at the end. Testing: `http://localhost:3000`. Online: e.g. `https://myblog.com`. |
| `SITE_TITLE` / `SITE_TAGLINE` | Your blog name and one-line description (Urdu is fine). |
| `ADMIN_PATH` | *(optional)* Address of the admin panel. Default `/admin`. Change to something secret like `/panel-x7k2` to hide it. |
| `NODE_ENV` | `development` on your computer, `production` when the site is online. |
| `PORT` | *(optional)* Default 3000. Hosting companies usually set this for you. |

**Never share `.env` and never upload it to GitHub** (it is already listed in `.gitignore`).

## 5. Run it on your computer

```
npm start
```

Open http://localhost:3000 - that is your website.  
Open http://localhost:3000/admin - log in with your `ADMIN_PASSWORD`.

Want to see sample Urdu / Arabic posts first? Run `npm run seed` once (delete the samples later from the admin panel).

If the site refuses to start it prints exactly which setting is wrong.

## 6. Using the admin panel

* **All posts** page: search, filter by section / status, **View, Edit, Publish/Unpublish, Delete**.
* **New post**: write the title, write the article in the editor, choose the **section**, choose **Urdu or Arabic**, press **Save**.
  * *Status = Draft* keeps it private (only you can see it, with a banner). *Published* makes it public.
  * Select a verse and choose **Font -> Arabic (Naskh)** to show it in the Arabic font.
  * The **quote button** puts a verse/hadith in a highlighted box.
  * The **chain button** adds a link (writing `example.com` works, `https://` is added automatically).
  * **LTR** button: makes one paragraph left-to-right, for English text.
  * *Book / PDF link* shows a "download" button under the post (useful for **My Books**).
  * *Cover image link*: paste the web address of an image (images are not uploaded to the server; use any image host).
* Everything you paste is cleaned automatically, so nobody can inject harmful code into your pages.

## 7. Put it online

This is a normal Node.js website, so it needs a host that runs Node.js
(for example **Render**, **Railway**, **Fly.io**, or your own VPS). Static-only hosts will not work.

Typical steps (Render / Railway style):

1. Put this folder on GitHub (the `.env` file is NOT uploaded, that is correct).
2. Create a new **Web Service** from that GitHub repository.
3. Build command: `npm install`   Start command: `npm start`
4. In the host's **Environment Variables** screen, add the same settings you have in `.env`:
   `DATABASE_URL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `SITE_URL` (your real https address),
   `SITE_TITLE`, `SITE_TAGLINE`, `NODE_ENV=production` (and `ADMIN_PATH` if you use one).
5. Use the free online database from step 3 - option A - so your posts stay safe when the site restarts.
6. Open your website address, then `/your-admin-path`, and log in.

Check your host's current free-plan rules (some free plans put the site to sleep when nobody visits).

Health check address for hosts that ask for one: `/healthz`

## 8. Common changes

* **Rename a section / change its colour**: `config/sections.js`.  
  Never change the `slug` of a section that already has posts.
* **Colours, fonts, sizes**: top of `public/css/style.css` (the `:root` blocks).
* **Bigger default Urdu text**: change `--read-size: 22px;` in `style.css`.
* **Remove the "Bismillah" above the home title**: delete the `basmala` line in `views/index.ejs`.
* **About page text**: `views/about.ejs`.
* **Change admin password**: edit `ADMIN_PASSWORD` in `.env` (or the host's settings) and restart.  
  Changing `JWT_SECRET` logs out every open admin session.

## 9. Backup

Your posts live in the database. Download a backup now and then:

```
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

(Neon and Supabase also have their own backup/export pages.)

## 10. Security notes

* Admin login is rate-limited (8 wrong tries, then a 15 minute wait).
* Login uses a secure, HTTP-only cookie; every admin action carries a CSRF token.
* Post HTML is sanitised on save and again before showing; only safe tags and http/https/mailto/tel links are allowed.
* Use a long admin password, and open the site with `https://` when online.

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| "DATABASE_URL is missing" | You did not create `.env` (step 4). |
| "Could not connect to the database" | Wrong link/password, or the database is not running. Check `DATABASE_URL`. |
| SSL error with an online database | Add `DATABASE_SSL=true` to `.env`. |
| Admin login works locally but not online | Make sure the site is opened with `https://` and `NODE_ENV=production` is set; if you test production over plain http locally, add `COOKIE_SECURE=false`. |
| Urdu looks disconnected or broken | Use a modern browser; the fonts load from the site itself, so a blocked `/fonts` folder would cause it. |
| "Too many wrong attempts" | Wait 15 minutes. |

## Credits / licences

Fonts: Noto Nastaliq Urdu, Noto Naskh Arabic (SIL Open Font License), Amiri (SIL Open Font License).
Editor: Quill 1.x (BSD-3-Clause). Licence files are in `public/fonts` and `public/vendor/quill`.
