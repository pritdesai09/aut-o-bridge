import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Baby, Calendar, User, Camera, ArrowRight } from 'lucide-react'

export default function ChildProfile() {
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', gender: 'male' })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)
      await api.post('/auth/child-profile', fd)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="glass rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800">Add Your Child</h1>
            <p className="text-gray-400 mt-1 text-sm">Tell us about your child to personalise care</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-4 text-sm font-semibold">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><User className="w-4 h-4" /> Child's Full Name</label>
              <input type="text" required placeholder="Child's name" value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/80 font-semibold"/>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> Date of Birth</label>
              <input type="date" required value={form.date_of_birth}
                onChange={e => setForm({...form, date_of_birth: e.target.value})}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/80 font-semibold"/>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white/80 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><Camera className="w-4 h-4" /> Photo (optional)</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white/80 font-semibold focus:outline-none"/>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/> : <ArrowRight className="w-5 h-5" />}
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}