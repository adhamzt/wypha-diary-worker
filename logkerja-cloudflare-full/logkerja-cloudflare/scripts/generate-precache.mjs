import { readdir, stat, writeFile, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const root = new URL('../out/', import.meta.url).pathname
const allowed = /\.(?:html|txt|js|css|json|webmanifest|png|svg|ico|woff2?)$/i
const urls = []
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const full = join(dir, name)
    const info = await stat(full)
    if (info.isDirectory()) await walk(full)
    else if (allowed.test(name) && !name.endsWith('.map') && name !== 'precache-manifest.json') {
      let rel = relative(root, full).split(sep).join('/')
      if (rel === 'index.html') rel = ''
      else if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length)
      urls.push(`/${rel}`)
    }
  }
}
await walk(root)
const unique = [...new Set(urls)].sort()
const buildVersion = String(Date.now())
await writeFile(join(root, 'precache-manifest.json'), JSON.stringify({ version: buildVersion, urls: unique }, null, 2))
const swPath = join(root, 'sw.js')
const sw = await readFile(swPath, 'utf8')
await writeFile(swPath, sw.replace('__BUILD_VERSION__', buildVersion))
console.log(`LogKerja precache manifest: ${unique.length} assets · build ${buildVersion}`)
