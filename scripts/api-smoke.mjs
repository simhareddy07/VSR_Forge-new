import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.API_URL ?? 'http://localhost:4000/api'
const appDirectory = fileURLToPath(new URL('..', import.meta.url))
let serverProcess

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options)
  if (!response.ok) throw new Error(`${options?.method ?? 'GET'} ${path} returned ${response.status}`)
  return response.status === 204 ? undefined : response.json()
}

async function waitForApi() {
  try {
    return await request('/health')
  } catch (error) {
    if (error.cause?.code !== 'ECONNREFUSED') throw error
  }

  serverProcess = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: appDirectory,
    stdio: 'ignore',
    windowsHide: true,
  })

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await request('/health')
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw new Error('API did not become ready on port 4000')
}

try {
  const health = await waitForApi()
  const issue = await request('/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'API smoke test', type: 'Task', priority: 'High' }),
  })
  const updated = await request(`/issues/${issue.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' }),
  })
  await request(`/issues/${issue.id}`, { method: 'DELETE' })

  console.log(JSON.stringify({ database: health.database, created: issue.id, updatedStatus: updated.status, deleted: true }))
} finally {
  serverProcess?.kill()
}