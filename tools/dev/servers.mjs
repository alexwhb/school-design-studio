import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'

const ROOT = process.cwd()

const SERVERS = [
  { name: 'vue', port: 5174, args: ['run', 'dev'], log: '/tmp/vue-dev.log' },
  { name: 'react', port: 5273, args: ['run', 'dev:react'], log: '/tmp/react-dev.log' },
  { name: 'embed-demo', port: 5373, args: ['run', 'dev:embed-demo'], log: '/tmp/embed-demo.log' },
]

function isUp(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, 800)
  })
}

for (const server of SERVERS) {
  if (await isUp(server.port)) {
    console.log(`${server.name}: already up on ${server.port}`)
    continue
  }
  const out = fs.openSync(server.log, 'a')
  const child = spawn('npm', server.args, {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, NODE_ENV: 'development' },
  })
  child.unref()
  console.log(`${server.name}: started pid ${child.pid}`)
}

const deadline = Date.now() + 60_000
for (const server of SERVERS) {
  while (Date.now() < deadline) {
    if (await isUp(server.port)) break
    await new Promise((r) => setTimeout(r, 500))
  }
  console.log(`${server.name}: ${(await isUp(server.port)) ? 'ready' : 'FAILED'} on ${server.port}`)
}
