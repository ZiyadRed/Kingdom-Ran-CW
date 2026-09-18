import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicRoot = join(root, 'public')
const output = join(root, 'src', 'asset-versions.json')
const directories = ['icons', 'persos', 'scene_cards']

function visit(directory, versions) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name)
    if (item.isDirectory()) visit(path, versions)
    else if (item.isFile()) {
      const url = '/' + relative(publicRoot, path).split(sep).join('/')
      versions[url] = createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16)
    }
  }
}

const versions = {}
for (const directory of directories) visit(join(publicRoot, directory), versions)
const content = JSON.stringify(Object.fromEntries(Object.entries(versions).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n'
writeFileSync(output, content)
console.log(`Versioned ${Object.keys(versions).length} public artwork files by content hash.`)
