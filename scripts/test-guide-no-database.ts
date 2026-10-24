import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import ts from "typescript";
import { z } from "zod";
import { pickerProfiles } from "../src/lib/guides/buildPicker/profiles.server";

async function main() {
  const root = process.cwd();
  const seen = new Set<string>();
  function visit(file: string) {
    if (seen.has(file)) return;
    seen.add(file);
    assert.ok(!/src\/lib\/(prisma|security\/requestLimit)\.ts$/.test(file.replaceAll("\\", "/")), `Database dependency: ${relative(root, file)}`);
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
      if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      const name = specifier.text;
      assert.ok(!["pg", "@prisma/client", "@neondatabase/serverless"].includes(name), `Database runtime import in ${file}: ${name}`);
      const target = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : name.startsWith(".") ? resolve(dirname(file), name) : null;
      if (!target || target.endsWith(".json") || target.endsWith(".css")) continue;
      const resolved = [target + ".ts", target + ".tsx", resolve(target, "index.ts"), resolve(target, "index.tsx")].find(existsSync);
      assert.ok(resolved, `Unresolved local import ${name} in ${file}`);
      visit(resolved);
    }
  }
  for (const entry of ["src/app/guide/page.tsx", "src/app/guide/build/page.tsx", "src/app/guide/build-test/page.tsx", "src/app/layout.tsx", "src/app/api/guide/live-game/route.ts", "src/app/api/stripe/donation/session/route.ts"]) visit(resolve(root, entry));
  const score = (min: number, max: number) => z.number().int().min(min).max(max).nullable();
  const profile = z.object({
    name: z.string().min(1), shields: z.enum(["None", "Low", "Late", "High"]),
    durabilityScore: score(1, 5), shieldScore: score(0, 5), shieldTiming: z.enum(["Late"]).nullable(),
    canBuildSteelcaps: z.boolean().nullable(), mercuryTreadsScore: score(1, 3), qssScore: score(1, 3), ccScore: score(1, 5),
    damageType: z.enum(["AD", "AP", "Mixed"]), damageThreat: z.enum(["Low", "Medium", "High"]),
    damageScore: score(1, 5), deniesResets: z.boolean(), cc: z.enum(["None", "Low", "Medium", "High"]),
  }).strict();
  const profiles = z.array(profile).min(170).parse(await pickerProfiles());
  assert.equal(new Set(profiles.map(row => row.name)).size, profiles.length);
  assert.ok(profiles.some(row => row.name === "Viego"));
  const twitch = JSON.parse(readFileSync(resolve(root, "src/data/guide/twitch-status.json"), "utf8"));
  z.object({ isLive: z.boolean(), title: z.string().optional() }).strict().parse(twitch);
  const guideClient = readFileSync(resolve(root, "src/app/guide/ViegoGuideClient.tsx"), "utf8");
  assert.match(guideClient, /href="\/coaching"\s+prefetch=\{false\}/);
  console.log(`No database runtime dependencies across ${seen.size} guide/picker/layout modules; ${profiles.length} published profiles validated.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
