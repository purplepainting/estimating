// Auto-calculation formulas for quantity based on measurements

export interface Area {
  length_ft: number
  width_ft: number
  height_ft: number
}

export interface ExteriorMeasure {
  perimeter_ln_ft: number
  wall_height_ft: number
  eaves_ln_ft: number
  eave_depth_ft: number
}

export interface Elevation {
  length_ft: number
  height_ft: number
  eaves_ln_ft?: number
  fascia_ln_ft?: number
}

export const calculateQuantity = {
  // Interior formulas
  interiorWalls: (area: Area): number => {
    return 2 * (area.length_ft + area.width_ft) * area.height_ft
  },

  ceilings: (area: Area): number => {
    return area.length_ft * area.width_ft
  },

  baseboard: (area: Area): number => {
    return 2 * (area.length_ft + area.width_ft)
  },

  // Exterior formulas - Perimeter mode
  exteriorWallsPerimeter: (measure: ExteriorMeasure): number => {
    return measure.perimeter_ln_ft * measure.wall_height_ft
  },

  eavesPerimeter: (measure: ExteriorMeasure): number => {
    return measure.eaves_ln_ft * measure.eave_depth_ft
  },

  fasciaPerimeter: (measure: ExteriorMeasure): number => {
    return measure.perimeter_ln_ft
  },

  // Exterior formulas - Elevation mode
  exteriorWallsElevation: (elevation: Elevation): number => {
    return elevation.length_ft * elevation.height_ft
  },

  eavesElevation: (elevation: Elevation, eaveDepth: number = 2): number => {
    return (elevation.eaves_ln_ft || elevation.length_ft) * eaveDepth
  },

  fasciaElevation: (elevation: Elevation): number => {
    return elevation.fascia_ln_ft || elevation.length_ft
  }
}

// Helper to determine which calculation to use based on item name/category
export const getQuantityForItem = (
  itemName: string,
  itemUom: string,
  context: {
    area?: Area
    exteriorMeasure?: ExteriorMeasure
    elevation?: Elevation
    mode?: 'perimeter' | 'elevations'
  }
): number => {
  // For EACH items, return 1 (manual count)
  if (itemUom === 'each') {
    return 1
  }

  const name = itemName.toLowerCase()

  // Interior calculations
  if (context.area) {
    if (name.includes('wall') && itemUom === 'sf') {
      return calculateQuantity.interiorWalls(context.area)
    }
    if (name.includes('ceiling') && itemUom === 'sf') {
      return calculateQuantity.ceilings(context.area)
    }
    if (name.includes('baseboard') && itemUom === 'lf') {
      return calculateQuantity.baseboard(context.area)
    }
  }

  // Exterior calculations
  if (context.mode === 'perimeter' && context.exteriorMeasure) {
    if (name.includes('wall') && itemUom === 'sf') {
      return calculateQuantity.exteriorWallsPerimeter(context.exteriorMeasure)
    }
    if (name.includes('eaves') && itemUom === 'sf') {
      return calculateQuantity.eavesPerimeter(context.exteriorMeasure)
    }
    if (name.includes('fascia') && itemUom === 'lf') {
      return calculateQuantity.fasciaPerimeter(context.exteriorMeasure)
    }
  }

  if (context.mode === 'elevations' && context.elevation) {
    if (name.includes('wall') && itemUom === 'sf') {
      return calculateQuantity.exteriorWallsElevation(context.elevation)
    }
    if (name.includes('eaves') && itemUom === 'sf') {
      return calculateQuantity.eavesElevation(context.elevation)
    }
    if (name.includes('fascia') && itemUom === 'lf') {
      return calculateQuantity.fasciaElevation(context.elevation)
    }
  }

  // Default to 1 if no calculation matches
  return 1
}

// Calculate line total with modifiers
export const calculateLineTotal = (
  qty: number,
  rate: number,
  modifierPercentages: number[]
): number => {
  const modifierMultiplier = modifierPercentages.reduce((acc, pct) => acc * (1 + pct), 1)
  return qty * rate * modifierMultiplier
}
