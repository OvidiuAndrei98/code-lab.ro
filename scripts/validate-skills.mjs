import { readFile, readdir, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import prettier from "prettier";

for (const name of await readdir("skills")) {
  const root = resolve("skills", name);
  const text = await readFile(join(root, "SKILL.md"), "utf8");
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error(`${name}: missing frontmatter`);
  await prettier.format(frontmatter[1], { parser: "yaml" });
  const skillName = frontmatter[1].match(/^name: (.+)$/m)?.[1];
  const description = frontmatter[1].match(/^description: (.+)$/m)?.[1];
  if (
    skillName !== name ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName) ||
    skillName.length > 64
  )
    throw new Error(`${name}: invalid name`);
  if (!description || description.length > 1024 || /[<>]/.test(description))
    throw new Error(`${name}: invalid description`);
  if (/\bTODO\b|\[insert|\[TBD\]/i.test(text))
    throw new Error(`${name}: unfinished instructions`);
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(target)) continue;
    await access(resolve(root, target));
  }
  const metadata = await readFile(join(root, "agents/openai.yaml"), "utf8");
  await prettier.format(metadata, { parser: "yaml" });
  if (
    !metadata.includes(`$${name}`) ||
    !metadata.includes("allow_implicit_invocation: true")
  )
    throw new Error(`${name}: invalid UI metadata`);
  console.log(
    `PASS ${name}: frontmatter, name, description, references and UI metadata`,
  );
}
