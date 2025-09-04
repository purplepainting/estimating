'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateLineTotal } from '@/lib/calculations'

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

interface Modifier {
  id: number
  item_id?: number
  category?: 'interior' | 'exterior' | 'cabinets'
  label: string
  pct: number
}

interface ProposalTabProps {
  estimate: Estimate
  estimateLines: EstimateLine[]
  areas: Area[]
  elevations: Elevation[]
  cabinetGroups: CabinetGroup[]
}

interface ItemSummary {
  name: string
  substrate: string
  category: string
  totalQty: number
  uom: string
  totalCost: number
}

export default function ProposalTab({
  estimate,
  estimateLines,
  areas,
  elevations,
  cabinetGroups
}: ProposalTabProps) {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [priceItems, setPriceItems] = useState<any[]>([])
  const [sowText, setSowText] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [modifiersRes, priceItemsRes] = await Promise.all([
        supabase.from('modifiers').select('*'),
        supabase.from('price_items').select('*')
      ])

      if (!modifiersRes.error) setModifiers(modifiersRes.data || [])
      if (!priceItemsRes.error) setPriceItems(priceItemsRes.data || [])

      // Generate initial SOW text
      generateSOW()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const generateSOW = () => {
    let sow = `SCOPE OF WORK - PAINTING ESTIMATE\n\n`
    sow += `Client: ${estimate.contact_first} ${estimate.contact_last || ''}\n`
    if (estimate.address1) {
      sow += `Property: ${estimate.address1}`
      if (estimate.address2) sow += `, ${estimate.address2}`
      if (estimate.city || estimate.state) sow += `\n${estimate.city || ''}, ${estimate.state || ''} ${estimate.postal || ''}`
      sow += `\n\n`
    }

    // Get prep/finish text from items
    const itemTexts = new Set<string>()
    estimateLines.forEach(line => {
      const priceItem = priceItems.find(item => item.id === line.price_item_id)
      if (priceItem?.prep_finish_text) {
        itemTexts.add(priceItem.prep_finish_text)
      }
    })

    if (itemTexts.size > 0) {
      sow += `WORK TO BE PERFORMED:\n\n`
      Array.from(itemTexts).forEach(text => {
        sow += `• ${text}\n`
      })
      sow += `\n`
    }

    sow += `All work will be performed in a professional manner using quality materials and proven techniques. `
    sow += `Work area will be protected and cleaned upon completion.\n\n`
    sow += `EXCLUSIONS:\n`
    sow += `• Repair of damaged or rotted substrates\n`
    sow += `• Moving of furniture or belongings\n`
    sow += `• Color matching of existing finishes\n\n`

    setSowText(sow)
  }

  // Calculate summary by item type and substrate
  const getItemSummaries = (): ItemSummary[] => {
    const summaryMap = new Map<string, ItemSummary>()

    estimateLines.forEach(line => {
      const key = `${line.snapshot_name}-${line.snapshot_substrate}`
      const modifierPcts = modifiers
        .filter(mod => line.selected_modifier_ids.includes(mod.id))
        .map(mod => mod.pct)
      const lineTotal = calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)

      if (summaryMap.has(key)) {
        const existing = summaryMap.get(key)!
        existing.totalQty += line.qty
        existing.totalCost += lineTotal
      } else {
        summaryMap.set(key, {
          name: line.snapshot_name,
          substrate: line.snapshot_substrate,
          category: line.snapshot_category,
          totalQty: line.qty,
          uom: line.snapshot_uom,
          totalCost: lineTotal
        })
      }
    })

    return Array.from(summaryMap.values()).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return a.name.localeCompare(b.name)
    })
  }

  const calculateGrandTotal = () => {
    return estimateLines.reduce((total, line) => {
      const modifierPcts = modifiers
        .filter(mod => line.selected_modifier_ids.includes(mod.id))
        .map(mod => mod.pct)
      return total + calculateLineTotal(line.qty, line.snapshot_rate, modifierPcts)
    }, 0)
  }

  const grandTotal = calculateGrandTotal()
  const itemSummaries = getItemSummaries()

  const printProposal = () => {
    window.print()
  }

  if (loading) {
    return <div className="card">Loading proposal...</div>
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Proposal</h2>
        <div className="flex gap-2">
          <button onClick={printProposal} className="btn-outline">
            Print Proposal
          </button>
          <button 
            onClick={() => {/* TODO: Send proposal */}}
            className="btn-primary"
          >
            Send to Client
          </button>
        </div>
      </div>

      {/* Proposal Content */}
      <div className="card proposal-content">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PAINTING ESTIMATE</h1>
          <p className="text-lg text-gray-600">Estimate #{estimate.id}</p>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">CLIENT INFORMATION</h3>
            <div className="space-y-1">
              <p><strong>Name:</strong> {estimate.contact_first} {estimate.contact_last}</p>
              {estimate.phone && <p><strong>Phone:</strong> {estimate.phone}</p>}
              {estimate.email && <p><strong>Email:</strong> {estimate.email}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">PROJECT INFORMATION</h3>
            <div className="space-y-1">
              {estimate.address1 && (
                <div>
                  <p><strong>Address:</strong></p>
                  <p>{estimate.address1}</p>
                  {estimate.address2 && <p>{estimate.address2}</p>}
                  {(estimate.city || estimate.state || estimate.postal) && (
                    <p>{estimate.city}, {estimate.state} {estimate.postal}</p>
                  )}
                </div>
              )}
              {estimate.scheduled_date && (
                <p><strong>Scheduled:</strong> {new Date(estimate.scheduled_date).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">SCOPE OF WORK</h3>
          <textarea
            className="input h-64 w-full"
            value={sowText}
            onChange={(e) => setSowText(e.target.value)}
            placeholder="Enter scope of work details..."
          />
        </div>

        {/* Summary Roll-ups */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">PROJECT SUMMARY</h3>
          
          {/* By Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {['interior', 'exterior', 'cabinets'].map(category => {
              const categoryItems = itemSummaries.filter(item => item.category === category)
              const categoryTotal = categoryItems.reduce((sum, item) => sum + item.totalCost, 0)
              
              if (categoryItems.length === 0) return null

              return (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 capitalize mb-2">{category}</h4>
                  <p className="text-2xl font-bold text-primary-600">${categoryTotal.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{categoryItems.length} item types</p>
                </div>
              )
            })}
          </div>

          {/* Item Details */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Substrate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemSummaries.map((item, index) => {
                  const categoryColors = {
                    interior: 'text-blue-800',
                    exterior: 'text-green-800',
                    cabinets: 'text-purple-800'
                  }

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${categoryColors[item.category as keyof typeof categoryColors]}`}>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.substrate.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalQty.toFixed(1)} {item.uom.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${item.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="border-t-2 border-gray-300 pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">TOTAL ESTIMATE</h3>
              <p className="text-sm text-gray-600">All labor and materials included</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary-600">${grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
          <h4 className="font-semibold text-gray-900 mb-2">TERMS & CONDITIONS</h4>
          <ul className="space-y-1">
            <li>• 50% deposit required to begin work</li>
            <li>• Final payment due upon completion</li>
            <li>• All materials and labor guaranteed for 2 years</li>
            <li>• Estimate valid for 30 days</li>
            <li>• Additional work requires written approval</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .proposal-content {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .btn-outline, .btn-primary {
            display: none !important;
          }
          
          h2 {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
