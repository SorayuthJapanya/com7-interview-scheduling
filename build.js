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
        // Top-level const/let → var: prevents "already declared" errors when GAS
        // inlines all scripts into one page, while keeping components in global scope.
        // Only replaces lines starting at column 0 (top-level); indented code is untouched.
        const safeCode = code.replace(/^const /gm, "var ").replace(/^let /gm, "var ");
        return `<script type="text/javascript">${safeCode}</script>`;
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
