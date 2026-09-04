/**
 * The package's `.d.ts` files.
 *
 * `tsc --emitDeclarationOnly` gives a tree that mirrors `src/`, which is nearly
 * right — except that every import inside it still says `@/…`, the alias only
 * this repo's bundler knows. A consumer's TypeScript would try to resolve a
 * package called `@` and give up, and the whole point of shipping types is that
 * it does not.
 *
 * So the tree is emitted and then the aliases are rewritten to relative paths.
 * That is the whole job: no bundling of declarations, no api-extractor, no
 * fourth build tool to keep in step. The three entry points get one line each
 * pointing into the tree.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = path.join(ROOT, 'dist-embed')
const TYPES = path.join(OUT, 'types')

function walk(dir) {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...walk(full))
    else if (entry.name.endsWith('.d.ts')) found.push(full)
  }
  return found
}

/** `@/store/types` from `types/src/compose/ops.d.ts` is `../store/types`. */
function relativeToSrc(file, specifier) {
  const target = path.join(TYPES, 'src', specifier.slice(2))
  let out = path.relative(path.dirname(file), target).split(path.sep).join('/')
  if (!out.startsWith('.')) out = `./${out}`
  return out
}

export default function emitTypes() {
  fs.rmSync(TYPES, { recursive: true, force: true })
  execFileSync('npx', ['tsc', '-p', 'tsconfig.types.json'], { cwd: ROOT, stdio: 'inherit' })

  let rewritten = 0
  for (const file of walk(TYPES)) {
    const before = fs.readFileSync(file, 'utf8')
    const after = before.replace(/(from\s+|import\s*\()(['"])(@\/[^'"]+)\2/g, (_whole, lead, quote, specifier) => `${lead}${quote}${relativeToSrc(file, specifier)}${quote}`)
    if (after !== before) {
      fs.writeFileSync(file, after)
      rewritten++
    }
  }

  // One file per entry in `exports`, so a consumer's `types` field points at
  // something short and readable rather than at a path inside the tree.
  fs.writeFileSync(path.join(OUT, 'index.d.ts'), "export * from './types/src/index'\n")
  fs.writeFileSync(path.join(OUT, 'compose.d.ts'), "export * from './types/src/compose/index'\n")

  console.log(`types: ${walk(TYPES).length} declarations, ${rewritten} with aliases rewritten`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) emitTypes()
