import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Footer.css'

export default function Footer() {
  const { user } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-col">
          <h3 className="footer-logo">Zion Events</h3>
          <p className="footer-tagline">
            Book, reserve, and manage tickets for the events that matter to you.
          </p>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/search">Browse Events</Link></li>
            {!user && <li><Link to="/login">Login</Link></li>}
            {!user && <li><Link to="/register">Sign Up</Link></li>}
          </ul>
        </div>

        <div className="footer-col">
          <h4>{user?.role === 'ADMIN' ? 'Admin' : 'My Account'}</h4>
          <ul>
            {user?.role === 'USER' && (
              <>
                <li><Link to="/reservations/my">My Reservations</Link></li>
                <li><Link to="/profile">Profile</Link></li>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <li><Link to="/admin/events">Manage Events</Link></li>
                <li><Link to="/admin/reservations">All Reservations</Link></li>
                <li><Link to="/admin/events/new">Create Event</Link></li>
                <li><Link to="/admin/profile">Admin Profile</Link></li>
              </>
            )}
            {!user && (
              <li><span className="footer-muted">Login to manage your bookings</span></li>
            )}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>support@zionevents.com</li>
            <li>+251 900 000 000</li>
            <li>Addis Ababa, Ethiopia</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} Zion Events. All rights reserved.</p>
      </div>
    </footer>
  )
}