'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getQuantityForItem, calculateLineTotal } from '@/lib/calculations'

interface Area {
  id: number
  name: string
  length_ft: number
  width_ft: number
  height_ft: number
}

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

interface EstimateLine {
  id: number
  area_id?: number
  elevation_id?: number
  cabinet_group_id?: number
  price_item_id: number
  snapshot_name: string
  snapshot_category: string
  snapshot_substrate: string
  snapshot_uom: string
  snapshot_rate: number
  qty: number
  selected_modifier_ids: number[]
}

interface Modifier {
  id: number
  item_id?: number
  category?: 'interior' | 'exterior' | 'cabinets'
  label: string
  pct: number
}

interface InteriorTabProps {
  areas: Area[]
  setAreas: (areas: Area[]) => void
  estimateLines: EstimateLine[]
  setEstimateLines: (lines: EstimateLine[]) => void
  priceItems: PriceItem[]
  estimateId: number
}

export default function InteriorTab({ 
  areas, 
  setAreas, 
  estimateLines, 
  setEstimateLines, 
  priceItems, 
  estimateId 
}: InteriorTabProps) {
  const [showAddArea, setShowAddArea] = useState(false)
  const [showAddItem, setShowAddItem] = useState<number | null>(null)
  const [newArea, setNewArea] = useState({
    name: '',
    length_ft: 0,
    width_ft: 0,
    height_ft: 8
  })
  const [modifiers, setModifiers] = useState<Modifier[]>([])

  // Fetch modifiers when component mounts
  useState(() => {
    fetchModifiers()
  })

  const fetchModifiers = async () => {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .or('category.eq.interior,category.is.null')
    
    if (!error) setModifiers(data || [])
  }

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('areas')
        .insert([{ ...newArea, estimate_id: estimateId }])
        .select()
        .single()

      if (error) throw error

      setAreas([...areas, data])
      setNewArea({ name: '', length_ft: 0, width_ft: 0, height_ft: 8 })
      setShowAddArea(false)
    } catch (error) {
      console.error('Error adding area:', error)
      alert('Error adding area')
    }
  }

  const deleteArea = async (areaId: number) => {
    if (!confirm('Delete this area and all its items?')) return

    try {
      // Delete area (cascade will handle estimate_lines)
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', areaId)

      if (error) throw error

      setAreas(areas.filter(area => area.id !== areaId))
      setEstimateLines(estimateLines.filter(line => line.area_id !== areaId))
    } catch (error) {
      console.error('Error deleting area:', error)
      alert('Error deleting area')
    }
  }

  const handleAddItemToArea = async (areaId: number, priceItem: PriceItem, qty: number, modifierIds: number[]) => {
    try {
      const area = areas.find(a => a.id === areaId)
      if (!area) return

      // Calculate auto quantity if applicable
      const calculatedQty = priceItem.uom === 'each' ? qty : getQuantityForItem(
        priceItem.name,
        priceItem.uom,
        { area }
      )

      const newLine = {
        estimate_id: estimateId,
        area_id: areaId,
        price_item_id: priceItem.id,
        snapshot_name: priceItem.name,
        snapshot_category: priceItem.category,
        snapshot_substrate: priceItem.substrate,
        snapshot_uom: priceItem.uom,
        snapshot_rate: priceItem.rate,
        qty: calculatedQty,
        selected_modifier_ids: modifierIds
      }

      const { data, error } = await supabase
        .from('estimate_lines')
        .insert([newLine])
        .select()
        .single()

      if (error) throw error

      setEstimateLines([...estimateLines, data])
      setShowAddItem(null)
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item')
    }
  }

  const updateLineQty = async (lineId: number, newQty: number) => {
    try {
      const { error } = await supabase
        .from('estimate_lines')
        .update({ qty: newQty })
        .eq('id', lineId)

      if (error) throw error

      setEstimateLines(estimateLines.map(line => 
        line.id === lineId ? { ...line, qty: newQty } : line
      ))
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const deleteLine = async (lineId: number) => {
    try {
      const { error } = await supabase
        .from('estimate_lines')
        .delete()
        .eq('id', lineId)

      if (error) throw error

      setEstimateLines(estimateLines.filter(line => line.id !== lineId))
    } catch (error) {
      console.error('Error deleting line:', error)
    }
  }

  const getAreaTotal = (areaId: number) => {
    return estimateLines
      .filter(line => line.area_id === areaId)
      .reduce((total, line) => {
        const modifierPcts = modifiers
          .filter(mod => line.selected_modifier_ids.includes(mod.id))
          .map(mod => mod.pct)
        return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
      }, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Interior Areas</h2>
        <button
          onClick={() => setShowAddArea(true)}
          className="btn-primary"
        >
          Add Area
        </button>
      </div>

      {/* Add Area Form */}
      {showAddArea && (
        <form onSubmit={handleAddArea} className="card space-y-4">
          <h3 className="text-lg font-medium">Add New Area</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
              <input
                type="text"
                className="input"
                value={newArea.name}
                onChange={(e) => setNewArea(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Living Room"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length (ft) *</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={newArea.length_ft}
                onChange={(e) => setNewArea(prev => ({ ...prev, length_ft: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width (ft) *</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={newArea.width_ft}
                onChange={(e) => setNewArea(prev => ({ ...prev, width_ft: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (ft) *</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={newArea.height_ft}
                onChange={(e) => setNewArea(prev => ({ ...prev, height_ft: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button type="submit" className="btn-primary">Add Area</button>
            <button 
              type="button" 
              onClick={() => setShowAddArea(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Areas List */}
      {areas.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No areas added yet. Add an area to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {areas.map((area) => {
            const areaLines = estimateLines.filter(line => line.area_id === area.id)
            const areaTotal = getAreaTotal(area.id)

            return (
              <div key={area.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{area.name}</h3>
                    <p className="text-sm text-gray-600">
                      {area.length_ft}' × {area.width_ft}' × {area.height_ft}' high
                    </p>
                    <p className="text-lg font-semibold text-primary-600">
                      Area Total: ${areaTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddItem(area.id)}
                      className="btn-outline"
                    >
                      Add Item
                    </button>
                    <button
                      onClick={() => deleteArea(area.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete Area
                    </button>
                  </div>
                </div>

                {/* Add Item Modal */}
                {showAddItem === area.id && (
                  <AddItemModal
                    priceItems={priceItems}
                    modifiers={modifiers}
                    onAdd={(item, qty, modifierIds) => handleAddItemToArea(area.id, item, qty, modifierIds)}
                    onCancel={() => setShowAddItem(null)}
                  />
                )}

                {/* Area Items */}
                {areaLines.length === 0 ? (
                  <p className="text-gray-500 text-sm">No items added to this area yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Modifiers</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {areaLines.map((line) => {
                          const lineModifiers = modifiers.filter(mod => line.selected_modifier_ids.includes(mod.id))
                          const modifierPcts = lineModifiers.map(mod => mod.pct)
                          const lineTotal = calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)

                          return (
                            <tr key={line.id}>
                              <td className="px-4 py-2 text-sm">
                                <div className="font-medium">{line.snapshot_name}</div>
                                <div className="text-gray-500">{line.snapshot_substrate} · {line.snapshot_uom.toUpperCase()}</div>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {line.snapshot_uom === 'each' ? (
                                  <input
                                    type="number"
                                    className="input w-20"
                                    value={line.qty}
                                    onChange={(e) => updateLineQty(line.id, parseFloat(e.target.value) || 0)}
                                  />
                                ) : (
                                  <span>{line.qty.toFixed(1)}</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">${line.snapshot_rate.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm">
                                {lineModifiers.length > 0 ? (
                                  <div className="space-y-1">
                                    {lineModifiers.map(mod => (
                                      <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                        {mod.label} ({mod.pct > 0 ? '+' : ''}{(mod.pct * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">None</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm font-medium">${lineTotal.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm">
                                <button
                                  onClick={() => deleteLine(line.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Add Item Modal Component
function AddItemModal({ priceItems, modifiers, onAdd, onCancel }: {
  priceItems: PriceItem[]
  modifiers: Modifier[]
  onAdd: (item: PriceItem, qty: number, modifierIds: number[]) => void
  onCancel: () => void
}) {
  const [selectedItem, setSelectedItem] = useState<PriceItem | null>(null)
  const [qty, setQty] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItem) {
      onAdd(selectedItem, qty, selectedModifiers)
    }
  }

  const relevantModifiers = modifiers.filter(mod => 
    !mod.item_id || (selectedItem && mod.item_id === selectedItem.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">Add Item to Area</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
            <select
              className="input"
              value={selectedItem?.id || ''}
              onChange={(e) => {
                const item = priceItems.find(item => item.id === parseInt(e.target.value))
                setSelectedItem(item || null)
              }}
              required
            >
              <option value="">Choose an item...</option>
              {priceItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.substrate} ({item.uom.toUpperCase()}) - ${item.rate.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {selectedItem?.uom === 'each' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                className="input"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
          )}

          {relevantModifiers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modifiers</label>
              <div className="space-y-2">
                {relevantModifiers.map(modifier => (
                  <label key={modifier.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedModifiers.includes(modifier.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModifiers([...selectedModifiers, modifier.id])
                        } else {
                          setSelectedModifiers(selectedModifiers.filter(id => id !== modifier.id))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {modifier.label} ({modifier.pct > 0 ? '+' : ''}{(modifier.pct * 100).toFixed(0)}%)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary" disabled={!selectedItem}>
              Add Item
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
