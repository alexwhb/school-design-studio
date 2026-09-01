import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'

function isUp(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.on('connect', () => { socket.destroy(); resolve(true) })
    socket.on('error', () => resolve(false))
    setTimeout(() => { socket.destroy(); resolve(false) }, 800)
  })
}

if (await isUp(4873)) {
  console.log('prod server already up')
} else {
  const out = fs.openSync('/tmp/prod-serve.log', 'a')
  const child = spawn('node', ['tools/bench/serve-builds.mjs'], {
    cwd: process.cwd(), detached: true, stdio: ['ignore', out, out],
  })
  child.unref()
  console.log('prod server started pid', child.pid)
}
const deadline = Date.now() + 20000
while (Date.now() < deadline) {
  if (await isUp(4873)) break
  await new Promise((r) => setTimeout(r, 300))
}
console.log('app-prod', await isUp(4873))
