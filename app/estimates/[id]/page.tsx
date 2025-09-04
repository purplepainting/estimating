'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import InfoTab from '@/components/estimate/InfoTab'
import InteriorTab from '@/components/estimate/InteriorTab'

// Types
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

interface Area {
  id: number
  name: string
  length_ft: number
  width_ft: number
  height_ft: number
}

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

type ActiveTab = 'info' | 'interior' | 'exterior' | 'cabinets' | 'pricing' | 'proposal'

export default function EstimateEditorPage() {
  const params = useParams()
  const estimateId = parseInt(params.id as string)
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('info')
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [exteriorMeasure, setExteriorMeasure] = useState<ExteriorMeasure | null>(null)
  const [elevations, setElevations] = useState<Elevation[]>([])
  const [cabinetGroups, setCabinetGroups] = useState<CabinetGroup[]>([])
  const [estimateLines, setEstimateLines] = useState<EstimateLine[]>([])
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [exteriorMode, setExteriorMode] = useState<'perimeter' | 'elevations'>('perimeter')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (estimateId) {
      fetchEstimateData()
    }
  }, [estimateId])

  const fetchEstimateData = async () => {
    try {
      // Fetch estimate
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimateId)
        .single()

      if (estimateError) throw estimateError
      setEstimate(estimateData)

      // Fetch all related data
      await Promise.all([
        fetchAreas(),
        fetchExteriorMeasure(),
        fetchElevations(),
        fetchCabinetGroups(),
        fetchEstimateLines(),
        fetchPriceItems()
      ])
    } catch (error) {
      console.error('Error fetching estimate data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAreas = async () => {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('id')
    
    if (!error) setAreas(data || [])
  }

  const fetchExteriorMeasure = async () => {
    const { data, error } = await supabase
      .from('exterior_measures')
      .select('*')
      .eq('estimate_id', estimateId)
      .single()
    
    if (!error && data) setExteriorMeasure(data)
  }

  const fetchElevations = async () => {
    const { data, error } = await supabase
      .from('elevations')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('id')
    
    if (!error) setElevations(data || [])
  }

  const fetchCabinetGroups = async () => {
    const { data, error } = await supabase
      .from('cabinet_groups')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('id')
    
    if (!error) setCabinetGroups(data || [])
  }

  const fetchEstimateLines = async () => {
    const { data, error } = await supabase
      .from('estimate_lines')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('id')
    
    if (!error) setEstimateLines(data || [])
  }

  const fetchPriceItems = async () => {
    const { data, error } = await supabase
      .from('price_items')
      .select('*')
      .eq('enabled', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    
    if (!error) setPriceItems(data || [])
  }

  const tabs = [
    { id: 'info', name: 'Info', icon: '👤' },
    { id: 'interior', name: 'Interior', icon: '🏠' },
    { id: 'exterior', name: 'Exterior', icon: '🏗️' },
    { id: 'cabinets', name: 'Cabinets', icon: '🗄️' },
    { id: 'pricing', name: 'Pricing', icon: '💰' },
    { id: 'proposal', name: 'Proposal', icon: '📄' },
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading estimate...</div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Estimate not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {estimate.contact_first} {estimate.contact_last}
        </h1>
        <p className="text-gray-600">Estimate #{estimate.id}</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'info' && (
          <InfoTab 
            estimate={estimate} 
            setEstimate={setEstimate}
            estimateId={estimateId}
          />
        )}
        
        {activeTab === 'interior' && (
          <InteriorTab 
            areas={areas}
            setAreas={setAreas}
            estimateLines={estimateLines}
            setEstimateLines={setEstimateLines}
            priceItems={priceItems.filter(item => item.category === 'interior')}
            estimateId={estimateId}
          />
        )}
        
        {activeTab === 'exterior' && (
          <ExteriorTab 
            exteriorMode={exteriorMode}
            setExteriorMode={setExteriorMode}
            exteriorMeasure={exteriorMeasure}
            setExteriorMeasure={setExteriorMeasure}
            elevations={elevations}
            setElevations={setElevations}
            estimateLines={estimateLines}
            setEstimateLines={setEstimateLines}
            priceItems={priceItems.filter(item => item.category === 'exterior')}
            estimateId={estimateId}
          />
        )}
        
        {activeTab === 'cabinets' && (
          <CabinetsTab 
            cabinetGroups={cabinetGroups}
            setCabinetGroups={setCabinetGroups}
            estimateLines={estimateLines}
            setEstimateLines={setEstimateLines}
            priceItems={priceItems.filter(item => item.category === 'cabinets')}
            estimateId={estimateId}
          />
        )}
        
        {activeTab === 'pricing' && (
          <PricingTab 
            estimateLines={estimateLines}
            areas={areas}
            elevations={elevations}
            cabinetGroups={cabinetGroups}
            exteriorMeasure={exteriorMeasure}
          />
        )}
        
        {activeTab === 'proposal' && (
          <ProposalTab 
            estimate={estimate}
            estimateLines={estimateLines}
            areas={areas}
            elevations={elevations}
            cabinetGroups={cabinetGroups}
          />
        )}
      </div>
    </div>
  )
}

// Placeholder components for remaining tabs
function ExteriorTab({ exteriorMode, setExteriorMode, exteriorMeasure, setExteriorMeasure, elevations, setElevations, estimateLines, setEstimateLines, priceItems, estimateId }: any) {
  return <div className="card">Exterior tab content will go here</div>
}

function CabinetsTab({ cabinetGroups, setCabinetGroups, estimateLines, setEstimateLines, priceItems, estimateId }: any) {
  return <div className="card">Cabinets tab content will go here</div>
}

function PricingTab({ estimateLines, areas, elevations, cabinetGroups, exteriorMeasure }: any) {
  return <div className="card">Pricing tab content will go here</div>
}

function ProposalTab({ estimate, estimateLines, areas, elevations, cabinetGroups }: any) {
  return <div className="card">Proposal tab content will go here</div>
}