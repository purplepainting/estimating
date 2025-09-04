'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSimplePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testMinimalEstimate = async () => {
    setLoading(true)
    setResult('Testing minimal estimate...')

    try {
      // Test with absolute minimum data
      const minimalData = {
        contact_first: 'Test User'
      }

      console.log('Inserting:', minimalData)

      const { data, error } = await supabase
        .from('estimates')
        .insert([minimalData])
        .select()

      if (error) {
        setResult(`❌ Error: ${error.message}\nDetails: ${JSON.stringify(error, null, 2)}`)
        console.error('Supabase error:', error)
      } else {
        setResult(`✅ Success! Created estimate with ID: ${data[0].id}\nData: ${JSON.stringify(data[0], null, 2)}`)
        console.log('Success:', data)
      }
    } catch (error) {
      setResult(`❌ Exception: ${error}`)
      console.error('Exception:', error)
    } finally {
      setLoading(false)
    }
  }

  const testWithNulls = async () => {
    setLoading(true)
    setResult('Testing with explicit nulls...')

    try {
      const dataWithNulls = {
        contact_first: 'Test User 2',
        contact_last: null,
        phone: null,
        email: null,
        address1: null,
        address2: null,
        city: null,
        state: null,
        postal: null,
        scheduled_date: null
      }

      console.log('Inserting with nulls:', dataWithNulls)

      const { data, error } = await supabase
        .from('estimates')
        .insert([dataWithNulls])
        .select()

      if (error) {
        setResult(`❌ Error: ${error.message}\nDetails: ${JSON.stringify(error, null, 2)}`)
        console.error('Supabase error:', error)
      } else {
        setResult(`✅ Success! Created estimate with ID: ${data[0].id}\nData: ${JSON.stringify(data[0], null, 2)}`)
        console.log('Success:', data)
      }
    } catch (error) {
      setResult(`❌ Exception: ${error}`)
      console.error('Exception:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Simple Estimate Test</h1>
        
        <div className="space-y-4">
          <button 
            onClick={testMinimalEstimate}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Minimal Estimate (Name Only)'}
          </button>
          
          <button 
            onClick={testWithNulls}
            disabled={loading}
            className="btn-outline"
          >
            {loading ? 'Testing...' : 'Test With Explicit Nulls'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Purpose:</strong> Test if we can create estimates with minimal data to isolate the issue.</p>
        </div>
      </div>
    </div>
  )
}
