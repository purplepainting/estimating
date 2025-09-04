'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getQuantityForItem, calculateLineTotal } from '@/lib/calculations'

interface ExteriorMeasure {
  id: number
  perimeter_ln_ft: number
  wall_height_ft: number
  eaves_ln_ft: number
  eave_depth_ft: number
}

interface Elevation {
  id: number
  name: string
  length_ft: number
  height_ft: number
  eaves_ln_ft?: number
  fascia_ln_ft?: number
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
  label: string
  pct: number
}

interface ExteriorTabProps {
  exteriorMode: 'perimeter' | 'elevations'
  setExteriorMode: (mode: 'perimeter' | 'elevations') => void
  exteriorMeasure: ExteriorMeasure | null
  setExteriorMeasure: (measure: ExteriorMeasure | null) => void
  elevations: Elevation[]
  setElevations: (elevations: Elevation[]) => void
  estimateLines: EstimateLine[]
  setEstimateLines: (lines: EstimateLine[]) => void
  priceItems: PriceItem[]
  estimateId: number
}

export default function ExteriorTab({
  exteriorMode,
  setExteriorMode,
  exteriorMeasure,
  setExteriorMeasure,
  elevations,
  setElevations,
  estimateLines,
  setEstimateLines,
  priceItems,
  estimateId
}: ExteriorTabProps) {
  const [showAddElevation, setShowAddElevation] = useState(false)
  const [showAddItem, setShowAddItem] = useState<'perimeter' | number | null>(null)
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [perimeterForm, setPerimeterForm] = useState({
    perimeter_ln_ft: exteriorMeasure?.perimeter_ln_ft || 0,
    wall_height_ft: exteriorMeasure?.wall_height_ft || 0,
    eaves_ln_ft: exteriorMeasure?.eaves_ln_ft || 0,
    eave_depth_ft: exteriorMeasure?.eave_depth_ft || 2
  })
  const [newElevation, setNewElevation] = useState({
    name: '',
    length_ft: 0,
    height_ft: 0,
    eaves_ln_ft: 0,
    fascia_ln_ft: 0
  })

  useState(() => {
    fetchModifiers()
  })

  const fetchModifiers = async () => {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .or('category.eq.exterior,category.is.null')
    
    if (!error) setModifiers(data || [])
  }

  const savePerimeterMeasure = async () => {
    try {
      if (exteriorMeasure) {
        // Update existing
        const { error } = await supabase
          .from('exterior_measures')
          .update(perimeterForm)
          .eq('id', exteriorMeasure.id)

        if (error) throw error
        setExteriorMeasure({ ...exteriorMeasure, ...perimeterForm })
      } else {
        // Create new
        const { data, error } = await supabase
          .from('exterior_measures')
          .insert([{ ...perimeterForm, estimate_id: estimateId }])
          .select()
          .single()

        if (error) throw error
        setExteriorMeasure(data)
      }
    } catch (error) {
      console.error('Error saving perimeter measure:', error)
      alert('Error saving measurements')
    }
  }

  const handleAddElevation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('elevations')
        .insert([{ ...newElevation, estimate_id: estimateId }])
        .select()
        .single()

      if (error) throw error

      setElevations([...elevations, data])
      setNewElevation({ name: '', length_ft: 0, height_ft: 0, eaves_ln_ft: 0, fascia_ln_ft: 0 })
      setShowAddElevation(false)
    } catch (error) {
      console.error('Error adding elevation:', error)
      alert('Error adding elevation')
    }
  }

  const deleteElevation = async (elevationId: number) => {
    if (!confirm('Delete this elevation and all its items?')) return

    try {
      const { error } = await supabase
        .from('elevations')
        .delete()
        .eq('id', elevationId)

      if (error) throw error

      setElevations(elevations.filter(elev => elev.id !== elevationId))
      setEstimateLines(estimateLines.filter(line => line.elevation_id !== elevationId))
    } catch (error) {
      console.error('Error deleting elevation:', error)
      alert('Error deleting elevation')
    }
  }

  const handleAddItemToPerimeter = async (priceItem: PriceItem, qty: number, modifierIds: number[]) => {
    try {
      if (!exteriorMeasure) return

      const calculatedQty = priceItem.uom === 'each' ? qty : getQuantityForItem(
        priceItem.name,
        priceItem.uom,
        { exteriorMeasure, mode: 'perimeter' }
      )

      const newLine = {
        estimate_id: estimateId,
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

  const handleAddItemToElevation = async (elevationId: number, priceItem: PriceItem, qty: number, modifierIds: number[]) => {
    try {
      const elevation = elevations.find(e => e.id === elevationId)
      if (!elevation) return

      const calculatedQty = priceItem.uom === 'each' ? qty : getQuantityForItem(
        priceItem.name,
        priceItem.uom,
        { elevation, mode: 'elevations' }
      )

      const newLine = {
        estimate_id: estimateId,
        elevation_id: elevationId,
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

  const getPerimeterTotal = () => {
    return estimateLines
      .filter(line => !line.elevation_id && !line.area_id && !line.cabinet_group_id)
      .reduce((total, line) => {
        const modifierPcts = modifiers
          .filter(mod => line.selected_modifier_ids.includes(mod.id))
          .map(mod => mod.pct)
        return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
      }, 0)
  }

  const getElevationTotal = (elevationId: number) => {
    return estimateLines
      .filter(line => line.elevation_id === elevationId)
      .reduce((total, line) => {
        const modifierPcts = modifiers
          .filter(mod => line.selected_modifier_ids.includes(mod.id))
          .map(mod => mod.pct)
        return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
      }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Exterior Mode</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setExteriorMode('perimeter')}
            className={`px-4 py-2 rounded-md ${
              exteriorMode === 'perimeter'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Perimeter Mode (Fast)
          </button>
          <button
            onClick={() => setExteriorMode('elevations')}
            className={`px-4 py-2 rounded-md ${
              exteriorMode === 'elevations'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Elevations Mode (Precise)
          </button>
        </div>
      </div>

      {/* Perimeter Mode */}
      {exteriorMode === 'perimeter' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">Perimeter Measurements</h3>
                {exteriorMeasure && (
                  <p className="text-lg font-semibold text-primary-600 mt-2">
                    Perimeter Total: ${getPerimeterTotal().toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={savePerimeterMeasure} className="btn-primary">
                  Save Measurements
                </button>
                {exteriorMeasure && (
                  <button
                    onClick={() => setShowAddItem('perimeter')}
                    className="btn-outline"
                  >
                    Add Item
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perimeter (LF) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={perimeterForm.perimeter_ln_ft}
                  onChange={(e) => setPerimeterForm(prev => ({ ...prev, perimeter_ln_ft: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wall Height (ft) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={perimeterForm.wall_height_ft}
                  onChange={(e) => setPerimeterForm(prev => ({ ...prev, wall_height_ft: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eaves Length (LF)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={perimeterForm.eaves_ln_ft}
                  onChange={(e) => setPerimeterForm(prev => ({ ...prev, eaves_ln_ft: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eave Depth (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={perimeterForm.eave_depth_ft}
                  onChange={(e) => setPerimeterForm(prev => ({ ...prev, eave_depth_ft: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Add Item Modal */}
            {showAddItem === 'perimeter' && (
              <AddItemModal
                priceItems={priceItems}
                modifiers={modifiers}
                onAdd={(item, qty, modifierIds) => handleAddItemToPerimeter(item, qty, modifierIds)}
                onCancel={() => setShowAddItem(null)}
              />
            )}

            {/* Perimeter Items */}
            {exteriorMeasure && (
              <PerimeterItemsTable
                lines={estimateLines.filter(line => !line.elevation_id && !line.area_id && !line.cabinet_group_id)}
                modifiers={modifiers}
                onUpdateQty={updateLineQty}
                onDelete={deleteLine}
              />
            )}
          </div>
        </div>
      )}

      {/* Elevations Mode */}
      {exteriorMode === 'elevations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Elevations</h2>
            <button
              onClick={() => setShowAddElevation(true)}
              className="btn-primary"
            >
              Add Elevation
            </button>
          </div>

          {/* Add Elevation Form */}
          {showAddElevation && (
            <form onSubmit={handleAddElevation} className="card space-y-4">
              <h3 className="text-lg font-medium">Add New Elevation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={newElevation.name}
                    onChange={(e) => setNewElevation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., North, South, Front"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length (ft) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={newElevation.length_ft}
                    onChange={(e) => setNewElevation(prev => ({ ...prev, length_ft: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (ft) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={newElevation.height_ft}
                    onChange={(e) => setNewElevation(prev => ({ ...prev, height_ft: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eaves Length (LF)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={newElevation.eaves_ln_ft}
                    onChange={(e) => setNewElevation(prev => ({ ...prev, eaves_ln_ft: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">Add Elevation</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddElevation(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Elevations List */}
          {elevations.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No elevations added yet. Add an elevation to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {elevations.map((elevation) => {
                const elevationLines = estimateLines.filter(line => line.elevation_id === elevation.id)
                const elevationTotal = getElevationTotal(elevation.id)

                return (
                  <div key={elevation.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium">{elevation.name}</h3>
                        <p className="text-sm text-gray-600">
                          {elevation.length_ft}' × {elevation.height_ft}' high
                          {elevation.eaves_ln_ft && ` • ${elevation.eaves_ln_ft}' eaves`}
                        </p>
                        <p className="text-lg font-semibold text-primary-600">
                          Elevation Total: ${elevationTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddItem(elevation.id)}
                          className="btn-outline"
                        >
                          Add Item
                        </button>
                        <button
                          onClick={() => deleteElevation(elevation.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Add Item Modal */}
                    {showAddItem === elevation.id && (
                      <AddItemModal
                        priceItems={priceItems}
                        modifiers={modifiers}
                        onAdd={(item, qty, modifierIds) => handleAddItemToElevation(elevation.id, item, qty, modifierIds)}
                        onCancel={() => setShowAddItem(null)}
                      />
                    )}

                    {/* Elevation Items */}
                    {elevationLines.length === 0 ? (
                      <p className="text-gray-500 text-sm">No items added to this elevation yet.</p>
                    ) : (
                      <PerimeterItemsTable
                        lines={elevationLines}
                        modifiers={modifiers}
                        onUpdateQty={updateLineQty}
                        onDelete={deleteLine}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Reusable components
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
        <h3 className="text-lg font-medium mb-4">Add Exterior Item</h3>
        
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

function PerimeterItemsTable({ lines, modifiers, onUpdateQty, onDelete }: {
  lines: EstimateLine[]
  modifiers: Modifier[]
  onUpdateQty: (lineId: number, qty: number) => void
  onDelete: (lineId: number) => void
}) {
  if (lines.length === 0) {
    return <p className="text-gray-500 text-sm mt-4">No items added yet.</p>
  }

  return (
    <div className="overflow-x-auto mt-4">
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
          {lines.map((line) => {
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
                      onChange={(e) => onUpdateQty(line.id, parseFloat(e.target.value) || 0)}
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
                        <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
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
                    onClick={() => onDelete(line.id)}
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
  )
}
