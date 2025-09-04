'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface MainModifier {
  id: number
  name: string
  pct: number
  enabled: boolean
  sort_order: number
}

export default function NewEstimatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mainModifiers, setMainModifiers] = useState<MainModifier[]>([])
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
    scheduled_date: '',
    main_modifier_id: ''
  })

  useEffect(() => {
    fetchMainModifiers()
  }, [])

  const fetchMainModifiers = async () => {
    try {
      const { data, error } = await supabase
        .from('main_modifiers')
        .select('*')
        .eq('enabled', true)
        .order('sort_order', { ascending: true })

      if (!error && data) {
        setMainModifiers(data)
        // Set Residential as default
        const residential = data.find(mod => mod.name === 'Residential')
        if (residential) {
          setFormData(prev => ({ ...prev, main_modifier_id: residential.id.toString() }))
        }
      }
    } catch (error) {
      console.error('Error fetching main modifiers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare form data - convert empty strings to null for optional fields
      const submitData = {
        contact_first: formData.contact_first, // Required field
        contact_last: formData.contact_last || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address1: formData.address1 || null,
        address2: formData.address2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal: formData.postal || null,
        scheduled_date: formData.scheduled_date || null,
        main_modifier_id: formData.main_modifier_id ? parseInt(formData.main_modifier_id) : null
      }

      console.log('Submitting data:', submitData)

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Type *
          </label>
          <select
            className="input"
            value={formData.main_modifier_id}
            onChange={(e) => handleChange('main_modifier_id', e.target.value)}
            required
          >
            <option value="">Select business type...</option>
            {mainModifiers.map(modifier => (
              <option key={modifier.id} value={modifier.id}>
                {modifier.name} ({modifier.pct >= 0 ? '+' : ''}{(modifier.pct * 100).toFixed(1)}%)
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            This determines the pricing level for the entire estimate
          </p>
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
