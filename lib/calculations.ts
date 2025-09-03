/**
 * Core calculation engine for the estimating app
 * All functions are pure and unit-testable
 */

export interface Dimensions {
  length: number
  width: number
  height?: number
}

export interface ExteriorDimensions {
  perimeter: number
  height: number
  eavesLength: number
  eavesDepth?: number
}

export interface ElevationDimensions {
  length: number
  height: number
}

export interface CalculationResult {
  wallsSqFt: number
  ceilingSqFt: number
  baseboardLf: number
}

export interface ExteriorCalculationResult {
  wallsSqFt: number
  fasciaLf: number
  eavesSqFt: number
}

export interface ElevationCalculationResult {
  wallsSqFt: number
  fasciaLf: number
  eavesSqFt: number
}

/**
 * Interior calculations for a room/area
 */
export function calculateInteriorArea(dimensions: Dimensions): CalculationResult {
  const { length, width, height = 8 } = dimensions
  
  return {
    wallsSqFt: 2 * (length + width) * height,
    ceilingSqFt: length * width,
    baseboardLf: 2 * (length + width)
  }
}

/**
 * Exterior perimeter calculations
 */
export function calculateExteriorPerimeter(dimensions: ExteriorDimensions): ExteriorCalculationResult {
  const { perimeter, height, eavesLength, eavesDepth = 2 } = dimensions
  
  return {
    wallsSqFt: perimeter * height,
    fasciaLf: perimeter,
    eavesSqFt: eavesLength * eavesDepth
  }
}

/**
 * Exterior elevation calculations
 */
export function calculateElevation(dimensions: ElevationDimensions): ElevationCalculationResult {
  const { length, height } = dimensions
  
  return {
    wallsSqFt: length * height,
    fasciaLf: length,
    eavesSqFt: length * 2 // Default 2ft depth
  }
}

/**
 * Calculate extended cost and price with modifiers
 */
export function calculateExtendedPricing(
  quantity: number,
  baseUnitCost: number,
  baseUnitPrice: number,
  modifiers: Array<{ costAdjustment: number; priceAdjustment: number }> = []
): { unitCost: number; unitPrice: number; extendedCost: number; extendedPrice: number } {
  // Apply modifiers multiplicatively
  let costMultiplier = 1
  let priceMultiplier = 1
  
  modifiers.forEach(modifier => {
    costMultiplier *= (1 + modifier.costAdjustment / 100)
    priceMultiplier *= (1 + modifier.priceAdjustment / 100)
  })
  
  const unitCost = baseUnitCost * costMultiplier
  const unitPrice = baseUnitPrice * priceMultiplier
  
  return {
    unitCost: Math.round(unitCost * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    extendedCost: Math.round(unitCost * quantity * 100) / 100,
    extendedPrice: Math.round(unitPrice * quantity * 100) / 100
  }
}

/**
 * Calculate estimate totals with overhead, profit, and tax
 */
export function calculateEstimateTotals(
  subtotal: number,
  overheadPercent: number,
  profitPercent: number,
  taxPercent: number
): {
  overhead: number
  profit: number
  tax: number
  grandTotal: number
} {
  const overhead = Math.round(subtotal * (overheadPercent / 100) * 100) / 100
  const profit = Math.round(subtotal * (profitPercent / 100) * 100) / 100
  const taxableAmount = subtotal + overhead + profit
  const tax = Math.round(taxableAmount * (taxPercent / 100) * 100) / 100
  const grandTotal = Math.round((taxableAmount + tax) * 100) / 100
  
  return {
    overhead,
    profit,
    tax,
    grandTotal
  }
}

/**
 * Calculate quantity based on formula key and dimensions
 */
export function calculateQuantity(
  formulaKey: string,
  dimensions: Dimensions | ExteriorDimensions | ElevationDimensions
): number {
  switch (formulaKey) {
    case 'walls_sqft':
      if ('height' in dimensions) {
        return 2 * (dimensions.length + dimensions.width) * (dimensions.height || 8)
      } else if ('perimeter' in dimensions) {
        return dimensions.perimeter * dimensions.height
      } else {
        return dimensions.length * dimensions.height
      }
    
    case 'ceil_sqft':
      if ('height' in dimensions) {
        return dimensions.length * dimensions.width
      }
      return 0
    
    case 'base_lnft':
      if ('height' in dimensions) {
        return 2 * (dimensions.length + dimensions.width)
      }
      return 0
    
    case 'exterior_walls':
      if ('perimeter' in dimensions) {
        return dimensions.perimeter * dimensions.height
      }
      return 0
    
    case 'eaves_sqft':
      if ('eavesLength' in dimensions) {
        return dimensions.eavesLength * (dimensions.eavesDepth || 2)
      }
      return 0
    
    case 'fascia_lnft':
      if ('perimeter' in dimensions) {
        return dimensions.perimeter
      } else if ('length' in dimensions) {
        return dimensions.length
      }
      return 0
    
    case 'elevation_walls':
      if ('height' in dimensions && dimensions.height) {
        return dimensions.length * dimensions.height
      }
      return dimensions.length * 8 // Default height
    
    case 'manual':
    default:
      return 0
  }
}

/**
 * Subtract openings (windows/doors) from wall square footage
 */
export function subtractOpenings(
  wallSqFt: number,
  openings: Array<{ width: number; height: number }>
): number {
  const openingArea = openings.reduce((total, opening) => {
    return total + (opening.width * opening.height)
  }, 0)
  
  return Math.max(0, wallSqFt - openingArea)
}

/**
 * Calculate cabinet component quantities
 */
export interface CabinetComponents {
  smallFronts: number
  mediumFronts: number
  largeFronts: number
  boxes: number
  panels: number
  crown: number
  toeKick: number
}

export function calculateCabinetQuantities(components: CabinetComponents): {
  totalFronts: number
  totalBoxes: number
  totalPanels: number
  totalCrown: number
  totalToeKick: number
} {
  return {
    totalFronts: components.smallFronts + components.mediumFronts + components.largeFronts,
    totalBoxes: components.boxes,
    totalPanels: components.panels,
    totalCrown: components.crown,
    totalToeKick: components.toeKick
  }
}
