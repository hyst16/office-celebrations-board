import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const readmePath = resolve(root, "README.md");
const offices = JSON.parse(await readFile(resolve(root, "config", "offices.json"), "utf8"));
const readme = (await readFile(readmePath, "utf8")).replace(/\r\n/g, "\n");
const start = "<!-- CONFIGURED_OFFICES:START -->";
const end = "<!-- CONFIGURED_OFFICES:END -->";
const pageBaseUrl = "https://hyst16.github.io/office-celebrations-board";

const section = [
  start,
  "",
  "| Office | TV display URL | Birthday secret | Anniversary secret |",
  "| --- | --- | --- | --- |",
  ...offices.map((office) =>
    `| ${office.name} | \`${pageBaseUrl}/#/display/${office.slug}\` | \`${office.birthdaySecret}\` | \`${office.anniversarySecret}\` |`
  ),
  "",
  "### Required workflow YAML",
  "",
  "Keep these entries under `jobs.build.steps` -> **Generate public celebration data** -> `env:` in `.github/workflows/deploy-pages.yml`:",
  "",
  "```yaml",
  ...offices.flatMap((office) => [
    `${office.birthdaySecret}: \${{ secrets.${office.birthdaySecret} }}`,
    `${office.anniversarySecret}: \${{ secrets.${office.anniversarySecret} }}`
  ]),
  "```",
  "",
  end
].join("\n");

const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
if (!pattern.test(readme)) throw new Error("README is missing configured-office markers.");
const updated = readme.replace(pattern, section);

if (process.argv.includes("--check")) {
  if (updated !== readme) throw new Error("README office details are stale. Run: npm run sync:offices");
  console.log("README office details match config/offices.json.");
} else {
  await writeFile(readmePath, updated);
  console.log(`Updated README details for ${offices.length} office(s).`);
}
