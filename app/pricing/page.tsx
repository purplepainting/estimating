'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PriceItem {
  id: number
  name: string
  category: 'interior' | 'exterior' | 'cabinets'
  substrate: 'drywall' | 'wood' | 'metal' | 'stucco_masonry'
  uom: 'sf' | 'lf' | 'each'
  rate: number
  enabled: boolean
  prep_finish_text?: string
}

interface Modifier {
  id: number
  item_id?: number
  category?: 'interior' | 'exterior' | 'cabinets'
  label: string
  pct: number
}

interface MainModifier {
  id: number
  name: string
  pct: number
  enabled: boolean
  sort_order: number
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'modifiers' | 'main-modifiers'>('items')
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [mainModifiers, setMainModifiers] = useState<MainModifier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const [showAddModifierForm, setShowAddModifierForm] = useState(false)
  const [editingMainModifier, setEditingMainModifier] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null)

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'interior' as const,
    substrate: 'drywall' as const,
    uom: 'sf' as const,
    rate: 0,
    enabled: true,
    prep_finish_text: ''
  })

  const [newModifier, setNewModifier] = useState({
    item_id: null as number | null,
    category: 'interior' as const,
    label: '',
    pct: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([fetchPriceItems(), fetchModifiers(), fetchMainModifiers()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPriceItems = async () => {
    const { data, error } = await supabase
      .from('price_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (!error) setPriceItems(data || [])
  }

  const fetchModifiers = async () => {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .order('category', { ascending: true })
      .order('label', { ascending: true })

    if (!error) setModifiers(data || [])
  }

  const fetchMainModifiers = async () => {
    const { data, error } = await supabase
      .from('main_modifiers')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })

    if (!error) setMainModifiers(data || [])
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('price_items')
        .insert([newItem])
        .select()
        .single()

      if (error) throw error

      setPriceItems(prev => [...prev, data])
      setNewItem({
        name: '',
        category: 'interior',
        substrate: 'drywall',
        uom: 'sf',
        rate: 0,
        enabled: true,
        prep_finish_text: ''
      })
      setShowAddItemForm(false)
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item')
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const { error } = await supabase
        .from('price_items')
        .update({
          name: editingItem.name,
          category: editingItem.category,
          substrate: editingItem.substrate,
          uom: editingItem.uom,
          rate: editingItem.rate,
          enabled: editingItem.enabled,
          prep_finish_text: editingItem.prep_finish_text
        })
        .eq('id', editingItem.id)

      if (error) throw error

      setPriceItems(prev => prev.map(item => 
        item.id === editingItem.id ? editingItem : item
      ))
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Error updating item')
    }
  }

  const handleAddModifier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('modifiers')
        .insert([newModifier])
        .select()
        .single()

      if (error) throw error

      setModifiers(prev => [...prev, data])
      setNewModifier({
        item_id: null,
        category: 'interior',
        label: '',
        pct: 0
      })
      setShowAddModifierForm(false)
    } catch (error) {
      console.error('Error adding modifier:', error)
      alert('Error adding modifier')
    }
  }

  const handleUpdateMainModifier = async (id: number, newPct: number) => {
    try {
      const { error } = await supabase
        .from('main_modifiers')
        .update({ pct: newPct })
        .eq('id', id)

      if (error) throw error

      setMainModifiers(prev => 
        prev.map(mod => mod.id === id ? { ...mod, pct: newPct } : mod)
      )
      setEditingMainModifier(null)
      setEditingValue('')
    } catch (error) {
      console.error('Error updating main modifier:', error)
      alert('Error updating main modifier')
    }
  }

  const toggleItemEnabled = async (id: number, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('price_items')
        .update({ enabled })
        .eq('id', id)

      if (error) throw error

      setPriceItems(prev => prev.map(item => 
        item.id === id ? { ...item, enabled } : item
      ))
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('price_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPriceItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item')
    }
  }

  const deleteModifier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this modifier?')) return

    try {
      const { error } = await supabase
        .from('modifiers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setModifiers(prev => prev.filter(mod => mod.id !== id))
    } catch (error) {
      console.error('Error deleting modifier:', error)
      alert('Error deleting modifier')
    }
  }

  const getCategoryBadge = (category: string) => {
    const styles = {
      interior: 'bg-blue-100 text-blue-800',
      exterior: 'bg-green-100 text-green-800',
      cabinets: 'bg-purple-100 text-purple-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[category as keyof typeof styles]}`}>
        {category}
      </span>
    )
  }

  const getSubstrateBadge = (substrate: string) => {
    const styles = {
      drywall: 'bg-gray-100 text-gray-800',
      wood: 'bg-yellow-100 text-yellow-800',
      metal: 'bg-indigo-100 text-indigo-800',
      stucco_masonry: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[substrate as keyof typeof styles]}`}>
        {substrate.replace('_', ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading pricing data...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Price Sheet Admin</h1>
        <p className="text-gray-600 mt-2">Manage pricing items and modifiers</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
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
          <button
            onClick={() => setActiveTab('main-modifiers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'main-modifiers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Main Modifiers ({mainModifiers.length})
          </button>
        </nav>
      </div>

      {/* Price Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Price Items</h2>
            <button
              onClick={() => setShowAddItemForm(true)}
              className="btn-primary"
            >
              Add New Item
            </button>
          </div>

          {/* Add Item Form */}
          {showAddItemForm && (
            <form onSubmit={handleAddItem} className="card space-y-4">
              <h3 className="text-lg font-medium">Add New Price Item</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    className="input"
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as any }))}
                  >
                    <option value="interior">Interior</option>
                    <option value="exterior">Exterior</option>
                    <option value="cabinets">Cabinets</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Substrate *</label>
                  <select
                    className="input"
                    value={newItem.substrate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, substrate: e.target.value as any }))}
                  >
                    <option value="drywall">Drywall</option>
                    <option value="wood">Wood</option>
                    <option value="metal">Metal</option>
                    <option value="stucco_masonry">Stucco/Masonry</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
                  <select
                    className="input"
                    value={newItem.uom}
                    onChange={(e) => setNewItem(prev => ({ ...prev, uom: e.target.value as any }))}
                  >
                    <option value="sf">SF (Square Feet)</option>
                    <option value="lf">LF (Linear Feet)</option>
                    <option value="each">EACH</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={newItem.rate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={newItem.enabled}
                    onChange={(e) => setNewItem(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">Enabled</label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep/Finish Text</label>
                <textarea
                  className="input h-20"
                  value={newItem.prep_finish_text}
                  onChange={(e) => setNewItem(prev => ({ ...prev, prep_finish_text: e.target.value }))}
                  placeholder="Text for proposals only..."
                />
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">Add Item</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddItemForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Edit Item Form */}
          {editingItem && (
            <form onSubmit={handleEditItem} className="card space-y-4">
              <h3 className="text-lg font-medium">Edit Price Item</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    className="input"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, category: e.target.value as any } : null)}
                  >
                    <option value="interior">Interior</option>
                    <option value="exterior">Exterior</option>
                    <option value="cabinets">Cabinets</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Substrate *</label>
                  <select
                    className="input"
                    value={editingItem.substrate}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, substrate: e.target.value as any } : null)}
                  >
                    <option value="drywall">Drywall</option>
                    <option value="wood">Wood</option>
                    <option value="metal">Metal</option>
                    <option value="stucco_masonry">Stucco/Masonry</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
                  <select
                    className="input"
                    value={editingItem.uom}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, uom: e.target.value as any } : null)}
                  >
                    <option value="sf">SF (Square Feet)</option>
                    <option value="lf">LF (Linear Feet)</option>
                    <option value="each">EACH</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editingItem.rate}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, rate: parseFloat(e.target.value) || 0 } : null)}
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editEnabled"
                    checked={editingItem.enabled}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, enabled: e.target.checked } : null)}
                    className="mr-2"
                  />
                  <label htmlFor="editEnabled" className="text-sm font-medium text-gray-700">Enabled</label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep/Finish Text</label>
                <textarea
                  className="input h-20"
                  value={editingItem.prep_finish_text || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, prep_finish_text: e.target.value } : null)}
                  placeholder="Text for proposals only..."
                />
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Items Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substrate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(item.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSubstrateBadge(item.substrate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {item.uom.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${item.rate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleItemEnabled(item.id, !item.enabled)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setEditingItem({ ...item })}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modifiers Tab */}
      {activeTab === 'modifiers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Modifiers</h2>
            <button
              onClick={() => setShowAddModifierForm(true)}
              className="btn-primary"
            >
              Add New Modifier
            </button>
          </div>

          {/* Add Modifier Form */}
          {showAddModifierForm && (
            <form onSubmit={handleAddModifier} className="card space-y-4">
              <h3 className="text-lg font-medium">Add New Modifier</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                  <input
                    type="text"
                    className="input"
                    value={newModifier.label}
                    onChange={(e) => setNewModifier(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., High Ceilings"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Percentage *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={newModifier.pct}
                    onChange={(e) => setNewModifier(prev => ({ ...prev, pct: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.25 for +25%, -0.15 for -15%"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specific Item</label>
                  <select
                    className="input"
                    value={newModifier.item_id || ''}
                    onChange={(e) => setNewModifier(prev => ({ 
                      ...prev, 
                      item_id: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                  >
                    <option value="">Apply to all items in category</option>
                    {priceItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    className="input"
                    value={newModifier.category}
                    onChange={(e) => setNewModifier(prev => ({ ...prev, category: e.target.value as any }))}
                  >
                    <option value="interior">Interior</option>
                    <option value="exterior">Exterior</option>
                    <option value="cabinets">Cabinets</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">Add Modifier</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModifierForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Modifiers Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specific Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modifiers.map((modifier) => (
                    <tr key={modifier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {modifier.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {modifier.pct > 0 ? '+' : ''}{(modifier.pct * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {modifier.category && getCategoryBadge(modifier.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {modifier.item_id 
                          ? priceItems.find(item => item.id === modifier.item_id)?.name || 'Unknown'
                          : 'All items'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteModifier(modifier.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Modifiers Tab */}
      {activeTab === 'main-modifiers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Main Modifiers</h2>
            <p className="text-gray-600">Business type pricing adjustments applied to entire estimates</p>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mainModifiers.map((modifier) => (
                    <tr key={modifier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{modifier.name}</div>
                        {modifier.name === 'Residential' && (
                          <div className="text-sm text-gray-500">Default</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingMainModifier === modifier.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              autoFocus
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        ) : (
                          <span className={`font-medium ${
                            modifier.pct >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {modifier.pct > 0 ? '+' : ''}{(modifier.pct * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingMainModifier === modifier.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const newPct = parseFloat(editingValue) / 100
                                if (!isNaN(newPct)) {
                                  handleUpdateMainModifier(modifier.id, newPct)
                                }
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMainModifier(null)
                                setEditingValue('')
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingMainModifier(modifier.id)
                              setEditingValue((modifier.pct * 100).toString())
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
