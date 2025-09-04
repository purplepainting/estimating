'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewEstimatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    contact_first: '',
    contact_last: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postal: '',
    scheduled_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare form data with proper date format
      const submitData = {
        ...formData,
        // Convert date to YYYY-MM-DD format if provided
        scheduled_date: formData.scheduled_date || null
      }

      const { data, error } = await supabase
        .from('estimates')
        .insert([submitData])
        .select()
        .single()

      if (error) throw error

      // Redirect to the new estimate editor
      router.push(`/estimates/${data.id}`)
    } catch (error) {
      console.error('Error creating estimate:', error)
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error creating estimate: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Estimate</h1>
        <p className="text-gray-600 mt-2">Create a new painting estimate</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              className="input"
              value={formData.contact_first}
              onChange={(e) => handleChange('contact_first', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              className="input"
              value={formData.contact_last}
              onChange={(e) => handleChange('contact_last', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            className="input"
            placeholder="Street address"
            value={formData.address1}
            onChange={(e) => handleChange('address1', e.target.value)}
          />
        </div>

        <div>
          <input
            type="text"
            className="input"
            placeholder="Apt, suite, etc. (optional)"
            value={formData.address2}
            onChange={(e) => handleChange('address2', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              className="input"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              className="input"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              className="input"
              value={formData.postal}
              onChange={(e) => handleChange('postal', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date
          </label>
          <input
            type="date"
            className="input"
            value={formData.scheduled_date}
            onChange={(e) => handleChange('scheduled_date', e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Estimate'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
