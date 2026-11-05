// src/utils/eventImages.js
export const categoryFallbackImage = {
  MUSIC:    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
  SPORTS:   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop',
  ART:      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop',
  BUSINESS: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop',
  FOOD:     'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
  THEATRE:  'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=600&h=400&fit=crop',
  OTHER:    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
}

export const getEventImage = (event) => {
  if (event?.imageUrl && event.imageUrl.startsWith('http')) return event.imageUrl
  return categoryFallbackImage[event?.category] || categoryFallbackImage.OTHER
}