import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'

import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Verify2FA from './pages/Verify2FA'
import Search from './pages/Search'
import Seats from './pages/Seats'
import ReservePreview from './pages/ReservePreview'
import MyReservations from './pages/MyReservations'
import PaymentVerify from './pages/PaymentVerify'
import Profile from './pages/Profile'
import AdminEvents from './pages/admin/AdminEvents'
import AdminReservations from './pages/admin/AdminReservations'
import CreateEvent from './pages/admin/CreateEvent'
import EditEvent from './pages/admin/EditEvent'
import AdminProfile from './pages/admin/AdminProfile'
import ResetPassword from './pages/ResetPassword'

function AuthRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return children
}

function UserRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'USER') return <Navigate to="/" />
  return children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'ADMIN') return <Navigate to="/" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
      <Route path="/verify-2fa" element={<Layout><Verify2FA /></Layout>} />
      <Route path="/search" element={<Layout><Search /></Layout>} />

      <Route path="/payment/verify/:reservationId" element={<Layout><PaymentVerify /></Layout>} />

      <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />

      <Route path="/profile" element={
        <AuthRoute><Layout><Profile /></Layout></AuthRoute>
      } />

      <Route path="/events/:id/seats" element={
        <UserRoute><Layout><Seats /></Layout></UserRoute>
      } />
      <Route path="/reservations/preview" element={
        <UserRoute><Layout><ReservePreview /></Layout></UserRoute>
      } />
      <Route path="/reservations/my" element={
        <UserRoute><Layout><MyReservations /></Layout></UserRoute>
      } />

      <Route path="/admin/events" element={
        <AdminRoute><Layout><AdminEvents /></Layout></AdminRoute>
      } />
      <Route path="/admin/reservations" element={
        <AdminRoute><Layout><AdminReservations /></Layout></AdminRoute>
      } />
      <Route path="/admin/events/new" element={
        <AdminRoute><Layout><CreateEvent /></Layout></AdminRoute>
      } />
      <Route path="/admin/events/:id/edit" element={
        <AdminRoute><Layout><EditEvent /></Layout></AdminRoute>
      } />
      <Route path="/admin/profile" element={
        <AdminRoute><Layout><AdminProfile /></Layout></AdminRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </PreferencesProvider>
    </BrowserRouter>
  )
}

