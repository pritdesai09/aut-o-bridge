import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ScanFace, LayoutGrid, Stethoscope, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-0 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="AUT-O-BRIDGE"
            className="h-24 w-auto object-contain"
            style={{ maxHeight: '80px' }}
          />
          <span className="font-black text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AUT-O-BRIDGE
          </span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-bold text-base transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link to="/diagnosis/questionnaire" className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-bold text-base transition-colors">
              <ScanFace className="w-4 h-4" /> Diagnose
            </Link>
            <Link to="/aac" className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-bold text-base transition-colors">
              <LayoutGrid className="w-4 h-4" /> Communicate
            </Link>
            <Link to="/doctors" className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-bold text-base transition-colors">
              <Stethoscope className="w-4 h-4" /> Consult
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={handleLogout} className="flex items-center gap-1.5 btn-primary px-4 py-2 rounded-xl text-sm font-bold">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-xl border-2 border-indigo-200 text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-all">Login</Link>
              <Link to="/register" className="btn-primary px-4 py-2 rounded-xl text-sm font-bold">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}