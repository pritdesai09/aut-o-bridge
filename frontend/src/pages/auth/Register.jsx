import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { User, Mail, Phone, Lock, UserPlus, AlertCircle } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.user, res.data.token)
      navigate('/child-profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="glass rounded-3xl p-8 shadow-xl">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.png"
                alt="Aut-o-Bridge"
                className="h-20 w-auto object-contain"
                style={{ maxHeight: '80px' }}
              />
            </div>
            <h1 className="text-3xl font-black text-gray-800">Create Account</h1>
            <p className="text-gray-400 mt-1 text-sm">Start your child's care journey</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-6 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {[
              { name: 'full_name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Your full name' },
              { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'you@email.com' },
              { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '+91 98765 43210' },
              { name: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: 'Minimum 8 characters' },
            ].map(({ name, label, type, icon: Icon, placeholder }) => (
              <div key={name}>
                <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1">
                  <Icon className="w-4 h-4" /> {label}
                </label>
                <input
                  type={type} name={name} value={form[name]}
                  onChange={handle} required placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/80 font-semibold"
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                : <UserPlus className="w-5 h-5" />
              }
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}