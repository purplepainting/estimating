'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

interface Estimate {
  id: string
  project_id: string
  status: 'draft' | 'sent' | 'accepted' | 'lost'
  total_amount: number
  created_at: string
  projects: {
    name: string
    clients: {
      first_name: string
      last_name?: string
    }
  }
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data directly for testing
    fetchEstimates()
  }, [])

  const fetchEstimates = async () => {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          projects (
            name,
            clients (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEstimates(data || [])
    } catch (error) {
      console.error('Error fetching estimates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
            <p className="text-gray-600 mt-2">Manage your project estimates</p>
          </div>
          <Button className="btn-primary">
            Create New Estimate
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Estimates ({estimates.length})</h2>
          </div>
          
          {estimates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first estimate</p>
              <Button className="btn-primary">
                Create Your First Estimate
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimates.map((estimate) => (
                    <tr key={estimate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {estimate.projects?.name || 'Unknown Project'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {estimate.projects?.clients?.first_name} {estimate.projects?.clients?.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(estimate.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${estimate.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(estimate.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="outline" size="sm" className="mr-2">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

