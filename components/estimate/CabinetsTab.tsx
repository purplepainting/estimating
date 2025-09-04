'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateLineTotal } from '@/lib/calculations'

interface CabinetGroup {
  id: number
  name: string
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

interface CabinetsTabProps {
  cabinetGroups: CabinetGroup[]
  setCabinetGroups: (groups: CabinetGroup[]) => void
  estimateLines: EstimateLine[]
  setEstimateLines: (lines: EstimateLine[]) => void
  priceItems: PriceItem[]
  estimateId: number
}

export default function CabinetsTab({
  cabinetGroups,
  setCabinetGroups,
  estimateLines,
  setEstimateLines,
  priceItems,
  estimateId
}: CabinetsTabProps) {
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAddItem, setShowAddItem] = useState<number | null>(null)
  const [newGroup, setNewGroup] = useState({ name: '' })
  const [modifiers, setModifiers] = useState<Modifier[]>([])

  useState(() => {
    fetchModifiers()
  })

  const fetchModifiers = async () => {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .or('category.eq.cabinets,category.is.null')
    
    if (!error) setModifiers(data || [])
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('cabinet_groups')
        .insert([{ ...newGroup, estimate_id: estimateId }])
        .select()
        .single()

      if (error) throw error

      setCabinetGroups([...cabinetGroups, data])
      setNewGroup({ name: '' })
      setShowAddGroup(false)
    } catch (error) {
      console.error('Error adding cabinet group:', error)
      alert('Error adding cabinet group')
    }
  }

  const deleteGroup = async (groupId: number) => {
    if (!confirm('Delete this cabinet group and all its items?')) return

    try {
      const { error } = await supabase
        .from('cabinet_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      setCabinetGroups(cabinetGroups.filter(group => group.id !== groupId))
      setEstimateLines(estimateLines.filter(line => line.cabinet_group_id !== groupId))
    } catch (error) {
      console.error('Error deleting cabinet group:', error)
      alert('Error deleting cabinet group')
    }
  }

  const handleAddItemToGroup = async (groupId: number, priceItem: PriceItem, qty: number, modifierIds: number[]) => {
    try {
      const newLine = {
        estimate_id: estimateId,
        cabinet_group_id: groupId,
        price_item_id: priceItem.id,
        snapshot_name: priceItem.name,
        snapshot_category: priceItem.category,
        snapshot_substrate: priceItem.substrate,
        snapshot_uom: priceItem.uom,
        snapshot_rate: priceItem.rate,
        qty: qty,
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

  const getGroupTotal = (groupId: number) => {
    return estimateLines
      .filter(line => line.cabinet_group_id === groupId)
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
        <h2 className="text-xl font-semibold">Cabinet Groups</h2>
        <button
          onClick={() => setShowAddGroup(true)}
          className="btn-primary"
        >
          Add Cabinet Group
        </button>
      </div>

      {/* Add Group Form */}
      {showAddGroup && (
        <form onSubmit={handleAddGroup} className="card space-y-4">
          <h3 className="text-lg font-medium">Add New Cabinet Group</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
            <input
              type="text"
              className="input"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Kitchen, Island, Bathroom"
              required
            />
          </div>
          
          <div className="flex gap-4">
            <button type="submit" className="btn-primary">Add Group</button>
            <button 
              type="button" 
              onClick={() => setShowAddGroup(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Groups List */}
      {cabinetGroups.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No cabinet groups added yet. Add a group to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {cabinetGroups.map((group) => {
            const groupLines = estimateLines.filter(line => line.cabinet_group_id === group.id)
            const groupTotal = getGroupTotal(group.id)

            return (
              <div key={group.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{group.name}</h3>
                    <p className="text-lg font-semibold text-primary-600">
                      Group Total: ${groupTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddItem(group.id)}
                      className="btn-outline"
                    >
                      Add Item
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete Group
                    </button>
                  </div>
                </div>

                {/* Add Item Modal */}
                {showAddItem === group.id && (
                  <AddItemModal
                    priceItems={priceItems}
                    modifiers={modifiers}
                    onAdd={(item, qty, modifierIds) => handleAddItemToGroup(group.id, item, qty, modifierIds)}
                    onCancel={() => setShowAddItem(null)}
                  />
                )}

                {/* Group Items */}
                {groupLines.length === 0 ? (
                  <p className="text-gray-500 text-sm">No items added to this group yet.</p>
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
                        {groupLines.map((line) => {
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
                                <input
                                  type="number"
                                  className="input w-20"
                                  value={line.qty}
                                  onChange={(e) => updateLineQty(line.id, parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-4 py-2 text-sm">${line.snapshot_rate.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm">
                                {lineModifiers.length > 0 ? (
                                  <div className="space-y-1">
                                    {lineModifiers.map(mod => (
                                      <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
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
        <h3 className="text-lg font-medium mb-4">Add Cabinet Item</h3>
        
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              className="input"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              min="1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {selectedItem?.uom === 'each' 
                ? 'Count of doors, drawers, etc.'
                : selectedItem?.uom === 'sf' 
                ? 'Square feet of cabinet surface'
                : 'Linear feet of trim, etc.'
              }
            </p>
          </div>

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
