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

  serverProcess = spawn(process.execPath, ['--import', 'tsx', 'backend/src/index.ts'], {
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
  const email = `smoke-${Date.now()}@example.com`
  const auth = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'API Smoke', email, password: 'password123' }),
  })
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }
  const issue = await request('/issues', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'API smoke test', type: 'Task', priority: 'High' }),
  })
  const updated = await request(`/issues/${issue.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'Done' }),
  })
  await request(`/issues/${issue.id}`, { method: 'DELETE', headers })

  console.log(JSON.stringify({ database: health.database, authenticated: auth.user.email === email, created: issue.id, updatedStatus: updated.status, deleted: true }))
} finally {
  serverProcess?.kill()
}