# JSX Pre-Build Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate `@babel/standalone` runtime transpilation (~870KB, 2–5s CPU per page load) by pre-compiling all 71 JSX files with Babel CLI before `clasp push`, and fix 2 remaining blocking CDN scripts (PERF-003).

**Architecture:** A Node.js `build.js` script walks `gas/`, copies server files as-is, transforms every `.html` file (compiles `<script type="text/babel">` → `<script type="text/javascript">` and strips the Babel CDN tag), and writes output to `dist/gas/`. The `.clasp.json` `rootDir` is changed from `"gas"` to `"dist/gas"` so clasp always pushes compiled output. Source JSX in `gas/` is never modified.

**Tech Stack:** Node.js 24, `@babel/core` ^7, `@babel/preset-react` ^7, `fs-extra` ^11, clasp

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `.gitignore` | Create | Ignore `dist/` and `node_modules/` |
| `package.json` | Create | Babel deps + `build` / `deploy` npm scripts |
| `build.js` | Create | Full build pipeline: clean → copy server → transform HTML |
| `gas/client/Index.html` | Modify lines 14–15 | Add `defer` to flatpickr scripts (PERF-003) |
| `.clasp.json` | Modify line 3 | Change `rootDir` from `"gas"` to `"dist/gas"` |

---

## Task 1: Scaffolding — `.gitignore` and `package.json`

**Files:**
- Create: `.gitignore`
- Create: `package.json`

- [ ] **Step 1: Initialize git repository**

Run from project root:
```bash
git init
git add .clasp.json gas/ docs/
git commit -m "chore: initial commit of existing project"
```

Expected: `Initialized empty Git repository` then commit success.

- [ ] **Step 3: Create `.gitignore`**

Create `/Users/comseven/Euro-Sorayuth/My_Project/COM7_TA/com7-interview-scheduling/.gitignore`:

```
dist/
node_modules/
```

- [ ] **Step 2: Create `package.json`**

Create `/Users/comseven/Euro-Sorayuth/My_Project/COM7_TA/com7-interview-scheduling/package.json`:

```json
{
  "name": "com7-interview-scheduling-build",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "node build.js",
    "deploy": "node build.js && clasp push"
  },
  "devDependencies": {
    "@babel/core": "^7.27.1",
    "@babel/preset-react": "^7.27.1",
    "fs-extra": "^11.3.0"
  }
}
```

- [ ] **Step 4: Create `package.json`** (already shown above)

- [ ] **Step 5: Install dependencies**

Run from project root:
```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` generated. No errors.

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json
git commit -m "chore: add build scaffolding for JSX pre-compile pipeline"
```

---

## Task 2: Fix PERF-003 — Add `defer` to flatpickr scripts in source `Index.html`

**Files:**
- Modify: `gas/client/Index.html` lines 14–15

- [ ] **Step 1: Edit `gas/client/Index.html`**

Find lines 14–15 (the two flatpickr scripts without `defer`):

```html
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/th.js"></script>
```

Replace with:

```html
    <script src="https://cdn.jsdelivr.net/npm/flatpickr" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/th.js" defer></script>
```

- [ ] **Step 2: Verify the change**

Run:
```bash
grep -n "flatpickr" gas/client/Index.html
```

Expected output:
```
12:      href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"
14:    <script src="https://cdn.jsdelivr.net/npm/flatpickr" defer></script>
15:    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/th.js" defer></script>
```

- [ ] **Step 3: Commit**

```bash
git add gas/client/Index.html
git commit -m "perf: add defer to flatpickr CDN scripts (PERF-003)"
```

---

## Task 3: Write `build.js`

**Files:**
- Create: `build.js`

- [ ] **Step 1: Create `build.js` at project root**

Create `/Users/comseven/Euro-Sorayuth/My_Project/COM7_TA/com7-interview-scheduling/build.js`:

```javascript
const fs = require("fs-extra");
const path = require("path");
const babel = require("@babel/core");

const SRC = path.join(__dirname, "gas");
const DIST = path.join(__dirname, "dist", "gas");

async function build() {
  console.log("🔨 Building...");
  await fs.remove(DIST);
  await fs.ensureDir(DIST);
  await walkAndTransform(SRC, DIST);
  console.log("✅ Build complete → dist/gas/");
}

async function walkAndTransform(srcDir, distDir) {
  await fs.ensureDir(distDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const distPath = path.join(distDir, entry.name);

    if (entry.isDirectory()) {
      await walkAndTransform(srcPath, distPath);
    } else if (entry.name.endsWith(".html")) {
      await transformHtml(srcPath, distPath);
    } else {
      await fs.copy(srcPath, distPath);
    }
  }
}

async function transformHtml(srcPath, distPath) {
  let content = await fs.readFile(srcPath, "utf8");

  // Remove @babel/standalone script tag
  content = content.replace(
    /<script[^>]*unpkg\.com\/@babel\/standalone[^>]*><\/script>[ \t]*\n?/g,
    ""
  );

  // Compile JSX → plain JS
  content = content.replace(
    /<script\s+type="text\/babel">([\s\S]*?)<\/script>/g,
    (_, jsx) => {
      try {
        const { code } = babel.transformSync(jsx, {
          presets: ["@babel/preset-react"],
          filename: srcPath,
        });
        return `<script type="text/javascript">${code}</script>`;
      } catch (err) {
        console.error(
          `\n❌ Babel error in ${path.relative(__dirname, srcPath)}:`
        );
        console.error(err.message);
        process.exit(1);
      }
    }
  );

  await fs.writeFile(distPath, content, "utf8");
  console.log(`  ✓ ${path.relative(__dirname, srcPath)}`);
}

build().catch((err) => {
  console.error("❌ Build failed:", err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run the build**

```bash
node build.js
```

Expected: Lines like `✓ gas/client/Index.html`, `✓ gas/client/src/App.html` … for all 71 html files, ending with `✅ Build complete → dist/gas/`

- [ ] **Step 3: Verify `@babel/standalone` is gone from `dist/gas/client/Index.html`**

```bash
grep -c "babel/standalone" dist/gas/client/Index.html
```

Expected output: `0`

- [ ] **Step 4: Verify JSX was compiled in a component file**

```bash
grep -c 'type="text/babel"' dist/gas/client/src/App.html
```

Expected output: `0`

```bash
grep -c 'type="text/javascript"' dist/gas/client/src/App.html
```

Expected output: `1`

- [ ] **Step 5: Verify server files were copied unchanged**

```bash
diff -r gas/server dist/gas/server
```

Expected output: (no output — files are identical)

- [ ] **Step 6: Verify total compiled HTML file count**

```bash
grep -rl 'type="text/javascript"' dist/gas/client/ | wc -l
```

Expected output: `71` (all JSX files compiled)

- [ ] **Step 7: Commit**

```bash
git add build.js
git commit -m "build: add JSX pre-compile pipeline (PERF-002)"
```

---

## Task 4: Update `.clasp.json` to push from `dist/gas/`

**Files:**
- Modify: `.clasp.json` line 3

- [ ] **Step 1: Edit `.clasp.json`**

Change line 3 from:
```json
  "rootDir": "gas",
```

To:
```json
  "rootDir": "dist/gas",
```

Full file after change:
```json
{
  "scriptId": "19BAEQ4LaEwG3YHInaB3OCLqOQZW2lcRDMpX58GgAVZbdWBL3o576gzqs",
  "rootDir": "dist/gas",
  "scriptExtensions": [
    ".js",
    ".gs"
  ],
  "htmlExtensions": [
    ".html"
  ],
  "jsonExtensions": [
    ".json"
  ],
  "filePushOrder": [],
  "skipSubdirectories": false
}
```

- [ ] **Step 2: Run a clean build to confirm the pipeline end-to-end**

```bash
npm run build
```

Expected: `✅ Build complete → dist/gas/` with no errors.

- [ ] **Step 3: Confirm deploy command works (dry run — do NOT push unless ready)**

```bash
node build.js && echo "Build OK — ready to clasp push"
```

Expected output ends with: `Build OK — ready to clasp push`

- [ ] **Step 4: Commit**

```bash
git add .clasp.json
git commit -m "chore: point clasp rootDir to dist/gas compiled output"
```

---

## Done — New Workflow

From now on:

| Action | Command |
|--------|---------|
| Build only | `npm run build` |
| Build + push to GAS | `npm run deploy` |
| Edit source | Edit files in `gas/` as usual |

`dist/` is never committed — it's always regenerated by `build.js`.
