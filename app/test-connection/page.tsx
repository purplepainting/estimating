'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Testing...')

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('estimates')
        .select('count')
        .limit(1)

      if (error) {
        setResult(`❌ Database Error: ${error.message}`)
        console.error('Supabase error:', error)
      } else {
        setResult('✅ Database connection successful!')
        console.log('Supabase connection works:', data)
      }
    } catch (error) {
      setResult(`❌ Connection Error: ${error}`)
      console.error('Connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testEnvVars = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let envResult = '🔧 Environment Variables:\n'
    envResult += `URL: ${url ? '✅ Set' : '❌ Missing'}\n`
    envResult += `Key: ${key ? '✅ Set' : '❌ Missing'}\n`
    
    if (url) envResult += `URL Value: ${url}\n`
    if (key) envResult += `Key Value: ${key.substring(0, 20)}...\n`

    setResult(envResult)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <button 
            onClick={testEnvVars}
            className="btn-outline"
          >
            Check Environment Variables
          </button>
          
          <button 
            onClick={testConnection}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Database Connection'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-medium mb-2">Debug Steps:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check environment variables first</li>
            <li>If variables are missing, add them to .env.local or Vercel</li>
            <li>Test database connection</li>
            <li>If connection fails, verify Supabase project is set up</li>
            <li>Make sure you've run the database schema</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
