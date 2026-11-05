import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import '../../styles/admin.css'

const categoryOptions = [
  { value: 'MUSIC',    label: '🎸 Music / Concert' },
  { value: 'SPORTS',   label: '⚽ Sports / Match' },
  { value: 'ART',      label: '🎨 Art / Exhibition' },
  { value: 'BUSINESS', label: '💼 Business / Summit' },
  { value: 'FOOD',     label: '🍕 Food / Feast' },
  { value: 'THEATRE',  label: '🎭 Theatre / Drama' },
  { value: 'OTHER',    label: '📌 Other' },
]

export default function CreateEvent() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [form, setForm] = useState({
    venueId: '',
    title: '',
    venueName: '',
    description: '',
    startAt: '',
    endAt: '',
    availableSeats: '',
    category: 'OTHER',
    normalPrice: '',
    vipPrice: '',
    vvipPrice: '',
  })

  useEffect(() => {
    api.get('/api/admin/venues')
      .then(res => setVenues(res.data))
      .catch(err => console.error(err))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'venueId') {
        const selectedVenue = venues.find(v => v.id === parseInt(value))
        if (selectedVenue) next.venueName = selectedVenue.name
      }
      return next
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const eventRes = await api.post('/api/admin/events', {
        venueId: parseInt(form.venueId),
        title: form.title,
        venueName: form.venueName,
        description: form.description,
        startAt: form.startAt,
        endAt: form.endAt,
        availableSeats: parseInt(form.availableSeats),
        category: form.category,
        
        normalPrice: parseFloat(form.normalPrice),
        vipPrice: parseFloat(form.vipPrice),
        vvipPrice: parseFloat(form.vvipPrice),
        price: parseFloat(form.normalPrice), 
      })
      
      const eventId = eventRes.data.eventId
      if (imageFile) {
        const uploadData = new FormData()
        uploadData.append('image', imageFile)
        await api.post(`/api/admin/events/${eventId}/upload-image`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ad-page">
      <div className="ad-wrap narrow">
        <div className="ad-card">
          <div className="ad-head">
            <div>
              <h2 className="ad-title">Create Event</h2>
              <div className="ad-title-bar" />
            </div>
            <button type="button" className="ad-btn ad-btn-ghost" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>

          {error && (
            <div className="ad-notice error" role="alert">
              <span>!</span><span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="ad-field">
              <label>Venue</label>
              <select name="venueId" className="form-select" value={form.venueId} onChange={handleChange} required>
                <option value="" disabled>— Select a venue —</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name} · {venue.address}</option>
                ))}
              </select>
            </div>

            <div className="ad-field">
              <label>Event Title</label>
              <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required />
            </div>

            <div className="ad-field">
              <label>Venue Name (Display)</label>
              <input
                type="text" name="venueName" className="form-control" value={form.venueName}
                onChange={handleChange} placeholder="e.g., Addis Ababa Stadium"
              />
              <small className="ad-hint">Auto-fills from the venue, but you can edit it.</small>
            </div>

            <div className="ad-field">
              <label>Description</label>
              <textarea
                name="description" className="form-control" rows="3" value={form.description}
                onChange={handleChange} placeholder="Brief description of the event..."
              />
            </div>

            <div className="ad-field">
              <label>Category</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="ad-field" style={{ marginBottom: 0 }}>
                <label>🎫 Normal Price (ETB) *</label>
                <input type="number" name="normalPrice" className="form-control" value={form.normalPrice} onChange={handleChange} min="0" step="0.01" required />
              </div>
              <div className="ad-field" style={{ marginBottom: 0 }}>
                <label>⭐ VIP Price (ETB) *</label>
                <input type="number" name="vipPrice" className="form-control" value={form.vipPrice} onChange={handleChange} min="0" step="0.01" required />
              </div>
              <div className="ad-field" style={{ marginBottom: 0 }}>
                <label>👑 VVIP Price (ETB) *</label>
                <input type="number" name="vvipPrice" className="form-control" value={form.vvipPrice} onChange={handleChange} min="0" step="0.01" required />
              </div>
            </div>

            <div className="ad-grid-2">
              <div className="ad-field">
                <label>Start Date &amp; Time</label>
                <input type="datetime-local" name="startAt" className="form-control" value={form.startAt} onChange={handleChange} required />
              </div>
              <div className="ad-field">
                <label>End Date &amp; Time</label>
                <input type="datetime-local" name="endAt" className="form-control" value={form.endAt} onChange={handleChange} required />
              </div>
            </div>

            <div className="ad-field">
              <label>Available Seats</label>
              <input
                type="number" name="availableSeats" className="form-control" value={form.availableSeats}
                onChange={handleChange} min="1" required
              />
              <small className="ad-hint">Should match the venue capacity.</small>
            </div>

            <div className="ad-field" style={{ marginBottom: 22 }}>
              <label>Event Image (optional)</label>
              {imagePreview && <img src={imagePreview} alt="Preview" className="ad-preview" />}
              <input type="file" accept="image/*" onChange={handleImageChange} className="form-control" />
            </div>

            <div className="ad-actions">
              <button type="button" className="ad-btn ad-btn-ghost" onClick={() => navigate('/')}>Cancel</button>
              <button type="submit" className="ad-btn ad-btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}