import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const hash = bytes => createHash('sha256').update(bytes).digest('hex').toUpperCase()

describe('byte-exact source checkout', () => {
  it('retains source hashes in an actual autocrlf=true checkout without pinning ordinary code', () => {
    const temporaryRoot = realpathSync(tmpdir())
    const workspace = mkdtempSync(join(temporaryRoot, 'ranhq-lf-checkout-'))
    const git = (...args) => execFileSync('git', args, { cwd: workspace, stdio: ['ignore', 'pipe', 'pipe'] })
    try {
      git('init', '--quiet')
      git('config', 'core.autocrlf', 'true')
      copyFileSync(join(root, '.gitattributes'), join(workspace, '.gitattributes'))
      const paths = execFileSync('git', ['ls-files', 'data/source'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/)
      const committed = new Map(paths.map(path => [path, execFileSync('git', ['show', `HEAD:${path}`], { cwd: root })]))
      for (const [path, bytes] of committed) {
        mkdirSync(dirname(join(workspace, path)), { recursive: true })
        writeFileSync(join(workspace, path), bytes)
      }
      writeFileSync(join(workspace, 'ordinary.js'), 'const value = 1\n')
      git('add', '--', '.gitattributes', 'data/source', 'ordinary.js')
      const checkout = join(workspace, 'checkout')
      mkdirSync(checkout)
      git('checkout-index', '--all', `--prefix=${checkout.replaceAll('\\', '/')}/`)
      for (const [path, bytes] of committed) {
        expect(hash(readFileSync(join(checkout, path))), path).toBe(hash(bytes))
      }
      const provenance = JSON.parse(readFileSync(join(checkout, 'data/source/_provenance.json'), 'utf8'))
      expect(hash(readFileSync(join(checkout, 'data/source/cw_skills.map.json')))).toBe(provenance.cwSkillMapping.inputFileSha256)
      expect(readFileSync(join(checkout, 'ordinary.js'), 'utf8')).toBe('const value = 1\r\n')
    } finally {
      // Delete only this test's verified temporary repository.
      if (resolve(workspace).startsWith(temporaryRoot + sep) && workspace.includes('ranhq-lf-checkout-')) rmSync(workspace, { recursive: true, force: true })
    }
  }, 30000)
})
