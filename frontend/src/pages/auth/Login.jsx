import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
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
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
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
            <h1 className="text-3xl font-black text-gray-800">Welcome Back</h1>
            <p className="text-gray-400 mt-1 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-6 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email" name="email" value={form.email}
                onChange={handle} required placeholder="you@email.com"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/80 font-semibold"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                type="password" name="password" value={form.password}
                onChange={handle} required placeholder="Your password"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/80 font-semibold"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                : <LogIn className="w-5 h-5" />
              }
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            New here? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}