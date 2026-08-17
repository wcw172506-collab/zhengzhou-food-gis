export interface Restaurant {
  id: string
  area: string
  typeCode: string
  typeName: string
  name: string
  address: string
  longitude: number
  latitude: number
  phone?: string
  businessHours?: string
  rating?: number
  averagePrice?: number
  businessDistrict?: string
}

export interface Area {
  name: string
  count: number
  types: Record<string, number>
}

export interface RestaurantType {
  code: string
  name: string
  count: number
}

export interface StatisticsData {
  totalRestaurants: number
  totalAreas: number
  totalTypes: number
  areaDistribution: Area[]
  typeDistribution: RestaurantType[]
  ratingDistribution: { rating: string; count: number }[]
  priceDistribution: { range: string; count: number }[]
}
