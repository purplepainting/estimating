'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateLineTotal } from '@/lib/calculations'

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

interface Area {
  id: number
  name: string
  length_ft: number
  width_ft: number
  height_ft: number
}

interface Elevation {
  id: number
  name: string
  length_ft: number
  height_ft: number
  eaves_ln_ft?: number
  fascia_ln_ft?: number
}

interface CabinetGroup {
  id: number
  name: string
}

interface ExteriorMeasure {
  id: number
  perimeter_ln_ft: number
  wall_height_ft: number
  eaves_ln_ft: number
  eave_depth_ft: number
}

interface Modifier {
  id: number
  item_id?: number
  category?: 'interior' | 'exterior' | 'cabinets'
  label: string
  pct: number
}

interface PricingTabProps {
  estimateLines: EstimateLine[]
  areas: Area[]
  elevations: Elevation[]
  cabinetGroups: CabinetGroup[]
  exteriorMeasure: ExteriorMeasure | null
}

export default function PricingTab({
  estimateLines,
  areas,
  elevations,
  cabinetGroups,
  exteriorMeasure
}: PricingTabProps) {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModifiers()
  }, [])

  const fetchModifiers = async () => {
    try {
      const { data, error } = await supabase
        .from('modifiers')
        .select('*')

      if (!error) setModifiers(data || [])
    } catch (error) {
      console.error('Error fetching modifiers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals by section
  const getSectionLines = (sectionType: 'interior' | 'exterior' | 'cabinets') => {
    return estimateLines.filter(line => {
      if (sectionType === 'interior') return line.area_id
      if (sectionType === 'exterior') return line.elevation_id || (!line.area_id && !line.cabinet_group_id)
      if (sectionType === 'cabinets') return line.cabinet_group_id
      return false
    })
  }

  const calculateSectionTotal = (sectionType: 'interior' | 'exterior' | 'cabinets') => {
    const lines = getSectionLines(sectionType)
    return lines.reduce((total, line) => {
      const modifierPcts = modifiers
        .filter(mod => line.selected_modifier_ids.includes(mod.id))
        .map(mod => mod.pct)
      return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
    }, 0)
  }

  const getLineModifiers = (line: EstimateLine) => {
    return modifiers.filter(mod => line.selected_modifier_ids.includes(mod.id))
  }

  const calculateLineTotal = (qty: number, rate: number, modifierPcts: number[]) => {
    const modifierMultiplier = modifierPcts.reduce((acc, pct) => acc * (1 + pct), 1)
    return qty * rate * modifierMultiplier
  }

  const interiorTotal = calculateSectionTotal('interior')
  const exteriorTotal = calculateSectionTotal('exterior')
  const cabinetsTotal = calculateSectionTotal('cabinets')
  const grandTotal = interiorTotal + exteriorTotal + cabinetsTotal

  const interiorLines = getSectionLines('interior')
  const exteriorLines = getSectionLines('exterior')
  const cabinetLines = getSectionLines('cabinets')

  if (loading) {
    return <div className="card">Loading pricing data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <h3 className="text-lg font-medium text-blue-900">Interior</h3>
          <p className="text-2xl font-bold text-blue-600">${interiorTotal.toFixed(2)}</p>
          <p className="text-sm text-blue-700">{interiorLines.length} items</p>
        </div>
        <div className="card bg-green-50">
          <h3 className="text-lg font-medium text-green-900">Exterior</h3>
          <p className="text-2xl font-bold text-green-600">${exteriorTotal.toFixed(2)}</p>
          <p className="text-sm text-green-700">{exteriorLines.length} items</p>
        </div>
        <div className="card bg-purple-50">
          <h3 className="text-lg font-medium text-purple-900">Cabinets</h3>
          <p className="text-2xl font-bold text-purple-600">${cabinetsTotal.toFixed(2)}</p>
          <p className="text-sm text-purple-700">{cabinetLines.length} items</p>
        </div>
        <div className="card bg-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Total</h3>
          <p className="text-3xl font-bold text-gray-900">${grandTotal.toFixed(2)}</p>
          <p className="text-sm text-gray-700">{estimateLines.length} total items</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Detailed Pricing Breakdown</h2>

        {/* Interior Section */}
        {interiorLines.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Interior - ${interiorTotal.toFixed(2)}
            </h3>
            
            {areas.map(area => {
              const areaLines = interiorLines.filter(line => line.area_id === area.id)
              if (areaLines.length === 0) return null

              const areaTotal = areaLines.reduce((total, line) => {
                const modifierPcts = getLineModifiers(line).map(mod => mod.pct)
                return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
              }, 0)

              return (
                <div key={area.id} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {area.name} - ${areaTotal.toFixed(2)}
                  </h4>
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        {areaLines.map(line => {
                          const lineModifiers = getLineModifiers(line)
                          const modifierPcts = lineModifiers.map(mod => mod.pct)
                          const lineTotal = calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)

                          return (
                            <tr key={line.id} className="bg-white">
                              <td className="px-4 py-2 text-sm">
                                <div className="font-medium">{line.snapshot_name}</div>
                                <div className="text-gray-500">{line.snapshot_substrate}</div>
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                {line.qty.toFixed(1)} {line.snapshot_uom.toUpperCase()}
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                ${line.snapshot_rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {lineModifiers.length > 0 ? (
                                  <div className="space-y-1">
                                    {lineModifiers.map(mod => (
                                      <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1">
                                        {mod.label} ({mod.pct > 0 ? '+' : ''}{(mod.pct * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium">
                                ${lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Exterior Section */}
        {exteriorLines.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-green-900 mb-4">
              Exterior - ${exteriorTotal.toFixed(2)}
            </h3>

            {/* Perimeter items (no elevation_id) */}
            {exteriorMeasure && (() => {
              const perimeterLines = exteriorLines.filter(line => !line.elevation_id)
              if (perimeterLines.length === 0) return null

              const perimeterTotal = perimeterLines.reduce((total, line) => {
                const modifierPcts = getLineModifiers(line).map(mod => mod.pct)
                return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
              }, 0)

              return (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Perimeter ({exteriorMeasure.perimeter_ln_ft}' × {exteriorMeasure.wall_height_ft}') - ${perimeterTotal.toFixed(2)}
                  </h4>
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        {perimeterLines.map(line => {
                          const lineModifiers = getLineModifiers(line)
                          const modifierPcts = lineModifiers.map(mod => mod.pct)
                          const lineTotal = calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)

                          return (
                            <tr key={line.id} className="bg-white">
                              <td className="px-4 py-2 text-sm">
                                <div className="font-medium">{line.snapshot_name}</div>
                                <div className="text-gray-500">{line.snapshot_substrate}</div>
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                {line.qty.toFixed(1)} {line.snapshot_uom.toUpperCase()}
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                ${line.snapshot_rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {lineModifiers.length > 0 ? (
                                  <div className="space-y-1">
                                    {lineModifiers.map(mod => (
                                      <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded mr-1">
                                        {mod.label} ({mod.pct > 0 ? '+' : ''}{(mod.pct * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium">
                                ${lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}

            {/* Elevation items */}
            {elevations.map(elevation => {
              const elevationLines = exteriorLines.filter(line => line.elevation_id === elevation.id)
              if (elevationLines.length === 0) return null

              const elevationTotal = elevationLines.reduce((total, line) => {
                const modifierPcts = getLineModifiers(line).map(mod => mod.pct)
                return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
              }, 0)

              return (
                <div key={elevation.id} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {elevation.name} ({elevation.length_ft}' × {elevation.height_ft}') - ${elevationTotal.toFixed(2)}
                  </h4>
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        {elevationLines.map(line => {
                          const lineModifiers = getLineModifiers(line)
                          const modifierPcts = lineModifiers.map(mod => mod.pct)
                          const lineTotal = calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)

                          return (
                            <tr key={line.id} className="bg-white">
                              <td className="px-4 py-2 text-sm">
                                <div className="font-medium">{line.snapshot_name}</div>
                                <div className="text-gray-500">{line.snapshot_substrate}</div>
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                {line.qty.toFixed(1)} {line.snapshot_uom.toUpperCase()}
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                ${line.snapshot_rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {lineModifiers.length > 0 ? (
                                  <div className="space-y-1">
                                    {lineModifiers.map(mod => (
                                      <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded mr-1">
                                        {mod.label} ({mod.pct > 0 ? '+' : ''}{(mod.pct * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium">
                                ${lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cabinets Section */}
        {cabinetLines.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-purple-900 mb-4">
              Cabinets - ${cabinetsTotal.toFixed(2)}
            </h3>
            
            {cabinetGroups.map(group => {
              const groupLines = cabinetLines.filter(line => line.cabinet_group_id === group.id)
              if (groupLines.length === 0) return null

              const groupTotal = groupLines.reduce((total, line) => {
                const modifierPcts = getLineModifiers(line).map(mod => mod.pct)
                return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
              }, 0)

              return (
                <div key={group.id} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {group.name} - ${groupTotal.toFixed(2)}
                  </h4>
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        {groupLines.map(line => {
                          const lineModifiers = getLineModifiers(line)
                          const modifierPcts = lineModifiers.map(mod => mod.pct)
                          const lineTotal = calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)

                          return (
                            <tr key={line.id} className="bg-white">
                              <td className="px-4 py-2 text-sm">
                                <div className="font-medium">{line.snapshot_name}</div>
                                <div className="text-gray-500">{line.snapshot_substrate}</div>
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                {line.qty.toFixed(1)} {line.snapshot_uom.toUpperCase()}
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                ${line.snapshot_rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {lineModifiers.length > 0 ? (
                                  <div className="space-y-1">
                                    {lineModifiers.map(mod => (
                                      <span key={mod.id} className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded mr-1">
                                        {mod.label} ({mod.pct > 0 ? '+' : ''}{(mod.pct * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium">
                                ${lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t-2 border-gray-300 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Total Estimate</h3>
            <p className="text-3xl font-bold text-gray-900">${grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
