'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Estimate {
  id: number
  status: 'draft' | 'sent' | 'accepted' | 'lost' | 'archived'
  contact_first: string
  contact_last?: string
  phone?: string
  email?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postal?: string
  scheduled_date?: string
}

interface InfoTabProps {
  estimate: Estimate
  setEstimate: (estimate: Estimate) => void
  estimateId: number
}

export default function InfoTab({ estimate, setEstimate, estimateId }: InfoTabProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    status: estimate.status,
    contact_first: estimate.contact_first,
    contact_last: estimate.contact_last || '',
    phone: estimate.phone || '',
    email: estimate.email || '',
    address1: estimate.address1 || '',
    address2: estimate.address2 || '',
    city: estimate.city || '',
    state: estimate.state || '',
    postal: estimate.postal || '',
    scheduled_date: estimate.scheduled_date || ''
  })

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('estimates')
        .update(formData)
        .eq('id', estimateId)

      if (error) throw error

      setEstimate({ ...estimate, ...formData })
      setEditing(false)
    } catch (error) {
      console.error('Error updating estimate:', error)
      alert('Error updating estimate')
    }
  }

  const handleCancel = () => {
    setFormData({
      status: estimate.status,
      contact_first: estimate.contact_first,
      contact_last: estimate.contact_last || '',
      phone: estimate.phone || '',
      email: estimate.email || '',
      address1: estimate.address1 || '',
      address2: estimate.address2 || '',
      city: estimate.city || '',
      state: estimate.state || '',
      postal: estimate.postal || '',
      scheduled_date: estimate.scheduled_date || ''
    })
    setEditing(false)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      archived: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!editing) {
    return (
      <div className="card space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Estimate Information</h2>
          <button onClick={() => setEditing(true)} className="btn-outline">
            Edit Info
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{estimate.contact_first} {estimate.contact_last}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{estimate.phone || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{estimate.email || '—'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Project Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(estimate.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                <p className="text-gray-900">
                  {estimate.scheduled_date 
                    ? new Date(estimate.scheduled_date).toLocaleDateString() 
                    : '—'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <div className="text-gray-900">
                  {estimate.address1 && <p>{estimate.address1}</p>}
                  {estimate.address2 && <p>{estimate.address2}</p>}
                  {(estimate.city || estimate.state || estimate.postal) && (
                    <p>{estimate.city}, {estimate.state} {estimate.postal}</p>
                  )}
                  {!estimate.address1 && <p>—</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Edit Estimate Information</h2>
        <div className="space-x-2">
          <button onClick={handleSave} className="btn-primary">
            Save Changes
          </button>
          <button onClick={handleCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="input"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="lost">Lost</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              className="input"
              value={formData.contact_first}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_first: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              className="input"
              value={formData.contact_last}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_last: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            className="input mb-2"
            placeholder="Street address"
            value={formData.address1}
            onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
          />
          <input
            type="text"
            className="input"
            placeholder="Apt, suite, etc."
            value={formData.address2}
            onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              className="input"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              className="input"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              className="input"
              value={formData.postal}
              onChange={(e) => setFormData(prev => ({ ...prev, postal: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
          <input
            type="date"
            className="input"
            value={formData.scheduled_date}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
          />
        </div>
      </div>
    </div>
  )
}
