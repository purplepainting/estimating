'use client'

import { useState, useEffect } from 'react'
import { supabase, getUserRole } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PriceItem {
  id: string
  section: 'interior' | 'exterior' | 'cabinets' | 'general'
  code: string
  label: string
  uom: 'sqft' | 'lnft' | 'ea'
  base_unit_cost: number
  base_unit_price: number
  formula_key: string
  created_at: string
}

interface Modifier {
  id: string
  section: 'interior' | 'exterior' | 'cabinets' | 'general'
  scope: 'item' | 'area' | 'estimate'
  code: string
  label: string
  cost_adjustment: number
  price_adjustment: number
  created_at: string
}

export default function AdminPricingPage() {
  const { user } = useAuth()
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'prices' | 'modifiers'>('prices')

  useEffect(() => {
    const checkPermissions = async () => {
      if (user) {
        const role = await getUserRole()
        setUserRole(role)
        if (role === 'ADMIN') {
          fetchPriceItems()
          fetchModifiers()
        } else {
          setLoading(false)
        }
      }
    }
    checkPermissions()
  }, [user])

  const fetchPriceItems = async () => {
    try {
      const { data, error } = await supabase
        .from('price_items')
        .select('*')
        .order('section', { ascending: true })
        .order('label', { ascending: true })

      if (error) throw error
      setPriceItems(data || [])
    } catch (error) {
      console.error('Error fetching price items:', error)
    }
  }

  const fetchModifiers = async () => {
    try {
      const { data, error } = await supabase
        .from('modifiers')
        .select('*')
        .order('section', { ascending: true })
        .order('label', { ascending: true })

      if (error) throw error
      setModifiers(data || [])
    } catch (error) {
      console.error('Error fetching modifiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePriceItem = async (id: string, field: string, value: number) => {
    try {
      const supabaseAny = supabase as any
      const { error } = await supabaseAny
        .from('price_items')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setPriceItems(items => items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ))
    } catch (error) {
      console.error('Error updating price item:', error)
      alert('Error updating price item')
    }
  }

  const updateModifier = async (id: string, field: string, value: number) => {
    try {
      const supabaseAny = supabase as any
      const { error } = await supabaseAny
        .from('modifiers')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setModifiers(items => items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ))
    } catch (error) {
      console.error('Error updating modifier:', error)
      alert('Error updating modifier')
    }
  }

  if (!user) {
    return <div>Please log in</div>
  }

  if (userRole !== 'ADMIN') {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
          <p className="text-gray-600 mt-2">Manage pricing items and modifiers</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('prices')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prices'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Price Items ({priceItems.length})
            </button>
            <button
              onClick={() => setActiveTab('modifiers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'modifiers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Modifiers ({modifiers.length})
            </button>
          </nav>
        </div>

        {activeTab === 'prices' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Price Items</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formula
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.section === 'interior' ? 'bg-blue-100 text-blue-800' :
                          item.section === 'exterior' ? 'bg-green-100 text-green-800' :
                          item.section === 'cabinets' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.section}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.label}</div>
                        <div className="text-gray-500 text-sm">{item.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.uom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.base_unit_cost}
                          onChange={(e) => updatePriceItem(item.id, 'base_unit_cost', parseFloat(e.target.value))}
                          className="w-20"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.base_unit_price}
                          onChange={(e) => updatePriceItem(item.id, 'base_unit_price', parseFloat(e.target.value))}
                          className="w-20"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.formula_key}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'modifiers' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Modifiers</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scope
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Adj. (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Adj. (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modifiers.map((modifier) => (
                    <tr key={modifier.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          modifier.section === 'interior' ? 'bg-blue-100 text-blue-800' :
                          modifier.section === 'exterior' ? 'bg-green-100 text-green-800' :
                          modifier.section === 'cabinets' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {modifier.section}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{modifier.label}</div>
                        <div className="text-gray-500 text-sm">{modifier.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          modifier.scope === 'item' ? 'bg-yellow-100 text-yellow-800' :
                          modifier.scope === 'area' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {modifier.scope}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          step="0.01"
                          value={modifier.cost_adjustment}
                          onChange={(e) => updateModifier(modifier.id, 'cost_adjustment', parseFloat(e.target.value))}
                          className="w-20"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          step="0.01"
                          value={modifier.price_adjustment}
                          onChange={(e) => updateModifier(modifier.id, 'price_adjustment', parseFloat(e.target.value))}
                          className="w-20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
