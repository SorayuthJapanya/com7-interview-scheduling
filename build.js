const fs = require("fs-extra");
const path = require("path");
const babel = require("@babel/core");

const SRC = path.join(__dirname, "gas");
const DIST = path.join(__dirname, "dist", "gas");

/**
 * ฟังก์ชันหลักสำหรับ build โปรเจค
 * ลบโฟลเดอร์ dist เก่าออก แล้วสร้างใหม่ จากนั้นเริ่มแปลงไฟล์ทั้งหมด
 */
async function build() {
  console.log("🔨 Building...");
  await fs.remove(DIST);
  await fs.ensureDir(DIST);
  await walkAndTransform(SRC, DIST);
  console.log("✅ Build complete → dist/gas/");
}

/**
 * วนลูปผ่านทุกไฟล์และโฟลเดอร์ใน srcDir แบบ recursive
 * - ถ้าเป็นโฟลเดอร์ → เรียกตัวเองซ้ำ
 * - ถ้าเป็นไฟล์ .html → ส่งไปแปลง JSX
 * - ไฟล์อื่น → copy ตรงๆ โดยไม่แก้ไข
 * @param {string} srcDir - โฟลเดอร์ต้นทาง
 * @param {string} distDir - โฟลเดอร์ปลายทาง
 */
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

/**
 * แปลงไฟล์ HTML ไฟล์เดียว:
 * 1. ลบ script tag ของ @babel/standalone ออก (ไม่จำเป็นอีกต่อไป)
 * 2. แปลงทุก <script type="text/babel"> → <script type="text/javascript">
 *    โดยใช้ Babel compile JSX → plain JS
 * 3. แปลง const/let ระดับ top-level → var เพื่อป้องกัน "already declared"
 *    เมื่อ GAS include() นำทุกไฟล์มารวมกันในหน้าเดียว
 * @param {string} srcPath - path ไฟล์ต้นทาง
 * @param {string} distPath - path ไฟล์ปลายทาง
 */
async function transformHtml(srcPath, distPath) {
  let content = await fs.readFile(srcPath, "utf8");

  // ลบ script tag ของ @babel/standalone ออก
  content = content.replace(
    /<script[^>]*unpkg\.com\/@babel\/standalone[^>]*><\/script>[ \t]*\n?/g,
    ""
  );

  // แปลง JSX → plain JS ด้วย Babel
  content = content.replace(
    /<script\s+type="text\/babel">([\s\S]*?)<\/script>/g,
    (_, jsx) => {
      try {
        const { code } = babel.transformSync(jsx, {
          presets: ["@babel/preset-react"],
          filename: srcPath,
        });
        // แปลง const/let ระดับ top-level (ต้นบรรทัด) → var
        // เพื่อให้ redeclare ข้ามไฟล์ได้โดยไม่ error และ component ยังอยู่ใน global scope
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
