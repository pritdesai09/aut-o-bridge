import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ChildProfile from './pages/auth/ChildProfile'
import Dashboard from './pages/Dashboard'
import Questionnaire from './pages/diagnosis/Questionnaire'
import VideoPlayer from './pages/diagnosis/VideoPlayer'
import Processing from './pages/diagnosis/Processing'
import Report from './pages/diagnosis/Report'
import AACBoard from './pages/AACBoard'
import Doctors from './pages/consultation/Doctors'
import DoctorProfile from './pages/consultation/DoctorProfile'
import Booking from './pages/consultation/Booking'
import AccessControl from './pages/AccessControl'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/aac" element={<AACBoard />} />
          <Route path="/child-profile" element={<ProtectedRoute><ChildProfile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/diagnosis/questionnaire" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />
          <Route path="/diagnosis/video" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
          <Route path="/diagnosis/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
          <Route path="/diagnosis/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
          <Route path="/doctors/:id" element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>} />
          <Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/access-control" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}