import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AuthResponse } from '../auth'
import { authApi } from '../auth'
import { AuthFormPage } from './AuthFormPage'
import { LandingPage } from './LandingPage'

export function AuthPage({ onAuthenticated }: { onAuthenticated: (result: AuthResponse) => void }) {
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegistering = mode === 'register'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = isRegistering ? await authApi.register({ name, email, password }) : await authApi.login({ email, password })
      onAuthenticated(result)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not authenticate')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'landing') return <LandingPage onSignIn={() => setMode('login')} onRegister={() => setMode('register')} />

  return <AuthFormPage isRegistering={isRegistering} name={name} email={email} password={password} error={error} busy={busy} onNameChange={setName} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={submit} onBack={() => setMode('landing')} onSwitchMode={() => { setMode(isRegistering ? 'login' : 'register'); setError('') }} />
}
