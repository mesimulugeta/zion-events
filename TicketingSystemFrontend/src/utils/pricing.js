// src/utils/pricing.js
import { TIER_INFO } from '../constants/seatTiers'

// Only used when the backend sends no price. Run the SQL so the backend has real prices.
const DEFAULT_BASE_PRICE = {
  MUSIC: 500, SPORTS: 300, ART: 200, BUSINESS: 600, FOOD: 150, THEATRE: 350, OTHER: 250,
}

export function getBasePrice(event) {
  const raw = Number(event?.price ?? event?.minPrice)
  if (Number.isFinite(raw) && raw > 0) return { value: raw, estimated: false }
  return { value: DEFAULT_BASE_PRICE[event?.category] ?? DEFAULT_BASE_PRICE.OTHER, estimated: true }
}

// Same multipliers as SeatCategory.java: NORMAL x1, VIP x1.5, VVIP x2
export function getTierPrices(event) {
  const { value, estimated } = getBasePrice(event)
  const tiers = ['NORMAL', 'VIP', 'VVIP'].map((key) => ({
    key,
    label: TIER_INFO[key].label,
    price: Math.round(value * TIER_INFO[key].multiplier),
  }))
  return { estimated, tiers }
}

export const formatETB = (n) => `ETB ${Number(n).toLocaleString('en-US')}`