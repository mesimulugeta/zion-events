import React from 'react'

export const TIER_INFO = {
  VVIP: {
    label: 'VVIP',
    icon: '👑',
    color: '#D63C47',
    background: '#FFE9EA',
    gradient: 'linear-gradient(135deg, #FF686B, #D63C47)',
    multiplier: 2,
    perks: [
      'Best-view seating, closest to the stage/action',
      'Dedicated fast-track entry — skip the general line',
      'Access to the exclusive VVIP lounge',
      'Complimentary welcome drink & refreshments',
      'Priority customer support for this booking',
    ],
  },
  VIP: {
    label: 'VIP',
    icon: '⭐',
    color: '#C2570C',
    background: '#FFF1E6',
    gradient: 'linear-gradient(135deg, #FF9B71, #E8743B)',
    multiplier: 1.5,
    perks: [
      'Premium seating location, better than general admission',
      'Priority entry — shorter wait at the gate',
      'Complimentary welcome drink',
    ],
  },
  NORMAL: {
    label: 'Normal',
    icon: '🎫',
    color: '#475569',
    background: '#EEF2F7',
    gradient: 'linear-gradient(135deg, #64748B, #475569)',
    multiplier: 1,
    perks: [
      'Standard seating with full access to the event',
      'General entry',
    ],
  },
}

export function getTierInfo(category) {
  return TIER_INFO[category] || TIER_INFO.NORMAL
}

export function SeatTierBadge({ category }) {
  const tier = getTierInfo(category)
  return React.createElement(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: tier.background,
        color: tier.color,
        border: `1px solid ${tier.color}`,
        borderRadius: '20px',
        padding: '2px 10px',
        fontSize: '0.75rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      },
    },
    `${tier.icon} ${tier.label}`
  )
}