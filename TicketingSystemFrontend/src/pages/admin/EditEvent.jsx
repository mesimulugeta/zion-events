import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [form, setForm] = useState({
    title: '',
    venueName: '',
    description: '',
    startAt: '',
    endAt: '',
    status: 'ACTIVE',
    availableSeats: '',
    category: 'OTHER',
    normalPrice: '',
    vipPrice: '',
    vvipPrice: '',
    imageUrl: '',
  })

  useEffect(() => {
    api.get(`/api/admin/events/${id}`)
      .then(res => {
        const e = res.data
        setForm({
          title: e.title,
          venueName: e.venueName || '',
          description: e.description || '',
          startAt: formatDateTime(e.startAt),
          endAt: formatDateTime(e.endAt),
          status: e.status,
          availableSeats: e.availableSeats,
          category: e.category || 'OTHER',
          
          normalPrice: e.normalPrice ?? e.price ?? '',
          vipPrice: e.vipPrice ?? '',
          vvipPrice: e.vvipPrice ?? '',
          
          imageUrl: e.imageUrl || '',
        })
        if (e.imageUrl) setImagePreview(e.imageUrl)
      })
      .catch(() => setError('Could not load this event.'))
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

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
      await api.put(`/api/admin/events/${id}`, {
        title: form.title,
        venueName: form.venueName,
        description: form.description,
        startAt: form.startAt,
        endAt: form.endAt,
        status: form.status,
        availableSeats: parseInt(form.availableSeats),
        category: form.category,
        
        normalPrice: parseFloat(form.normalPrice),
        vipPrice: parseFloat(form.vipPrice),
        vvipPrice: parseFloat(form.vvipPrice),
        
        price: parseFloat(form.normalPrice),
      })

      if (imageFile) {
        const uploadData = new FormData()
        uploadData.append('image', imageFile)
        await api.post(`/api/admin/events/${id}/upload-image`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEvent = async () => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return
    try {
      await api.put(`/api/admin/events/${id}/cancel`)
      navigate('/')
    } catch {
      setError('Failed to cancel the event.')
    }
  }

  return (
    <div className="ad-page">
      <div className="ad-wrap narrow">
        <div className="ad-card">
          <div className="ad-head">
            <div>
              <h2 className="ad-title">Edit Event</h2>
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
              <label>Event Title</label>
              <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required />
            </div>

            <div className="ad-field">
              <label>Venue Name (Display)</label>
              <input
                type="text" name="venueName" className="form-control" value={form.venueName}
                onChange={handleChange} placeholder="e.g., Addis Ababa Stadium"
              />
            </div>

            <div className="ad-field">
              <label>Description</label>
              <textarea
                name="description" className="form-control" rows="3" value={form.description}
                onChange={handleChange} placeholder="Brief description..."
              />
            </div>

            <div className="ad-grid-2">
              <div className="ad-field">
                <label>Category</label>
                <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="ad-field">
                <label>Status</label>
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
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
                onChange={handleChange} min="0" required
              />
            </div>

            <div className="ad-field" style={{ marginBottom: 22 }}>
              <label>Event Image</label>
              {imagePreview && <img src={imagePreview} alt="Current" className="ad-preview" />}
              <input type="file" accept="image/*" onChange={handleImageChange} className="form-control" />
              <small className="ad-hint">Leave empty to keep the current image.</small>
            </div>

            <div className="ad-actions">
              <button type="button" className="ad-btn ad-btn-ghost" onClick={() => navigate('/')}>Cancel</button>
              <button type="submit" className="ad-btn ad-btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <div className="ad-danger-zone">
            <span>Cancelling will disable new bookings for this event.</span>
            <button
              type="button"
              onClick={handleCancelEvent}
              className="ad-btn ad-btn-danger ad-btn-sm"
              disabled={form.status === 'CANCELLED'}
            >
              Cancel Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}