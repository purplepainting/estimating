'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const { signIn, signUp, sendMagicLink } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (isMagicLink) {
        await sendMagicLink(email)
        setMessage('Magic link sent! Check your email.')
      } else if (isSignUp) {
        await signUp(email, password)
        setMessage('Account created successfully! You can now sign in.')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isSignUp ? 'Create your estimating account' : 'Sign in to your account'}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Sign-up mode: {isSignUp ? 'ON' : 'OFF'} | Magic link: {isMagicLink ? 'ON' : 'OFF'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        {!isMagicLink && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('Magic link sent') 
              ? 'bg-success-50 text-success-700 border border-success-200' 
              : 'bg-danger-50 text-danger-700 border border-danger-200'
          }`}>
            {message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading 
            ? (isSignUp ? 'Creating account...' : 'Signing in...')
            : (isMagicLink ? 'Send Magic Link' : (isSignUp ? 'Create Account' : 'Sign In'))
          }
        </Button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary-600 hover:text-primary-500 block w-full"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          
          {!isSignUp && (
            <button
              type="button"
              onClick={() => setIsMagicLink(!isMagicLink)}
              className="text-sm text-gray-500 hover:text-gray-400"
            >
              {isMagicLink ? 'Sign in with password' : 'Sign in with magic link'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
