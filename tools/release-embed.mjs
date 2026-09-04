/**
 * Cuts a release the planner can `npm install` straight from a git tag.
 *
 * The planner depends on this repo as a git dependency, and a git dependency is
 * a checkout, not a build: whatever is in the tagged tree is what lands in
 * `node_modules`. Building on install is not an option either — `prepare` would
 * mean the planner's CI installing this repo's whole toolchain, TypeScript,
 * Vite, Playwright and all, to produce a file this machine already has.
 *
 * So the tag carries the built output and nothing else. It is an *orphan*
 * commit rather than one on `main`: history there is the source, and committing
 * three megabytes of bundle onto it once a release would double the repo inside
 * a year for files nobody reads. An orphan commit has no parent, so it costs
 * exactly its own contents and `main` never sees it.
 *
 * What goes in:
 *
 *   package.json   slim — no devDependencies, no scripts, no `prepare`
 *   dist-embed/    the editor, the compose entry, the content, the types
 *   public/        fonts, stickers, covers, the icon font, snap.svg
 *   server/        the content library, as plain ESM
 *   LICENSE, README.md
 *
 *   node tools/release-embed.mjs            # build, commit, tag, push
 *   node tools/release-embed.mjs --dry-run  # build and show what would be in it
 *   node tools/release-embed.mjs --no-push  # everything but the push
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import emitTypes from './build/emit-types.mjs'
import copyContent from './build/copy-content.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const push = !args.has('--no-push') && !dryRun

const run = (command, commandArgs, options = {}) => execFileSync(command, commandArgs, { cwd: ROOT, stdio: 'inherit', ...options })
// `options` matters here as much as it does for `run`: every git call that
// builds the release tree has to be pointed at the scratch index, and one that
// silently used the repository's own would write a tree of the whole checkout.
const read = (command, commandArgs, options = {}) => execFileSync(command, commandArgs, { cwd: ROOT, encoding: 'utf8', ...options }).trim()

const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const version = source.version
const tag = `embed-v${version}`

/**
 * What the planner installs.
 *
 * `type: module` because everything here is ESM and plain Node will not guess
 * — without it, `import('design-studio/compose')` in a request handler is
 * reparsed as CommonJS first and warns on every boot.
 *
 * No dependencies at all. The lib build inlines everything except React, which
 * is a peer because the host's copy has to be the only one on the page, and
 * Transformers.js, which is optional and 63 MB — see vite.embed.config.ts.
 */
function slimPackage() {
  return {
    name: source.name,
    version,
    description: source.description,
    author: source.author,
    license: 'MIT',
    type: 'module',
    exports: {
      '.': { types: './dist-embed/index.d.ts', import: './dist-embed/design-studio.js' },
      './style.css': './dist-embed/design-studio.css',
      './compose': { types: './dist-embed/compose.d.ts', import: './dist-embed/compose.js' },
      './server': { types: './server/index.d.ts', import: './server/index.mjs' },
      './package.json': './package.json',
    },
    files: ['dist-embed', 'public', 'server', 'LICENSE', 'README.md'],
    peerDependencies: {
      react: '>=19',
      'react-dom': '>=19',
    },
    peerDependenciesMeta: {
      // Only for cutting a background out in the browser. Three other ways to
      // have that feature need nothing installed; see EMBEDDING.md.
      '@huggingface/transformers': { optional: true },
    },
    optionalDependencies: {},
    browserslist: source.browserslist,
    homepage: source.homepage,
  }
}

function build() {
  console.log(`\n— building ${tag}\n`)
  run('npx', ['cross-env', 'NODE_ENV=production', 'vite', 'build', '--config', 'vite.embed.config.ts'])
  run('npx', ['cross-env', 'NODE_ENV=production', 'vite', 'build', '--config', 'vite.compose.config.ts'])
  emitTypes()
  copyContent()

  for (const required of ['dist-embed/design-studio.js', 'dist-embed/design-studio.css', 'dist-embed/index.d.ts', 'dist-embed/compose.js', 'dist-embed/compose.d.ts', 'server/index.mjs', 'server/index.d.ts']) {
    if (!fs.existsSync(path.join(ROOT, required))) throw new Error(`the build did not produce ${required}`)
  }
}

/** Every file that goes in the tag, `git add`-able. */
const PAYLOAD = ['dist-embed', 'public', 'server', 'LICENSE', 'README.md', 'package.json']

function sizes() {
  const out = []
  for (const entry of PAYLOAD) {
    const full = path.join(ROOT, entry)
    if (!fs.existsSync(full)) continue
    const bytes = Number(read('du', ['-sk', full]).split(/\s+/)[0]) * 1024
    out.push(`  ${entry.padEnd(14)} ${(bytes / 1024 / 1024).toFixed(1)} MB`)
  }
  return out.join('\n')
}

function release() {
  build()
  console.log(`\n— what goes in the tag\n${sizes()}\n`)

  if (dryRun) {
    console.log('— dry run, nothing committed')
    return
  }

  const branch = read('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  const head = read('git', ['rev-parse', 'HEAD'])
  if (read('git', ['tag', '-l', tag])) throw new Error(`${tag} already exists. Bump the version in package.json.`)

  // The slim package.json is written over the real one for exactly as long as
  // it takes to commit it, and put straight back. Everything is restored in the
  // `finally` below, including after a failure, so a release that goes wrong
  // does not leave a working tree that will not build.
  const realPackage = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
  try {
    fs.writeFileSync(path.join(ROOT, 'package.json'), `${JSON.stringify(slimPackage(), null, 2)}\n`)

    // An orphan index rather than a branch: nothing is checked out, nothing in
    // the working tree moves, and the commit that comes out has no parent.
    const indexFile = path.join(ROOT, '.git-release-index')
    fs.rmSync(indexFile, { force: true })
    const env = { ...process.env, GIT_INDEX_FILE: indexFile }
    // -f because dist-embed is in .gitignore, which is right for the source
    //  tree and exactly wrong for this one commit.
    run('git', ['add', '-f', '--', ...PAYLOAD], { env })
    const tree = read('git', ['write-tree'], { env })
    const message = `design-studio ${tag}\n\nBuilt from ${head} on ${branch}.\nEditor, compose entry, content library, fonts and types. No source, no toolchain.\n`
    const commit = execFileSync('git', ['commit-tree', tree, '-m', message], { cwd: ROOT, encoding: 'utf8', env }).trim()
    fs.rmSync(indexFile, { force: true })

    run('git', ['tag', '-a', tag, commit, '-m', message])

    // What actually went in, rather than what was meant to. A tree built from
    // the wrong index looks fine from the outside and ships the whole checkout.
    const inTag = read('git', ['ls-tree', '--name-only', tag]).split('\n').filter(Boolean)
    const unexpected = inTag.filter((entry) => !PAYLOAD.includes(entry))
    if (unexpected.length) throw new Error(`the tag holds files it should not: ${unexpected.join(', ')}`)
    const missing = PAYLOAD.filter((entry) => !inTag.includes(entry))
    if (missing.length) throw new Error(`the tag is missing ${missing.join(', ')}`)
    if (JSON.parse(read('git', ['show', `${tag}:package.json`])).devDependencies) throw new Error('the tag carries devDependencies')

    console.log(`\n— tagged ${tag} at ${commit.slice(0, 8)} (orphan, built from ${head.slice(0, 8)})`)
    console.log(`  ${inTag.join(', ')}`)
  } finally {
    fs.writeFileSync(path.join(ROOT, 'package.json'), realPackage)
  }

  if (push) {
    run('git', ['push', 'origin', tag])
    console.log(`\n— pushed ${tag}`)
  } else {
    console.log(`\n— not pushed. \`git push origin ${tag}\` when you are ready.`)
  }

  console.log(`\nThe planner pins it with:\n\n  "design-studio": "github:alexwhb/school-design-studio#${tag}"\n`)
}

release()
