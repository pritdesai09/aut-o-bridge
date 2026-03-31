import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { ArrowLeft, CalendarPlus, Calendar, Clock, MonitorSmartphone, MessageSquare, CheckCircle, Baby } from 'lucide-react'

const TIME_SLOTS = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM']

export default function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [children, setChildren] = useState([])
  const [form, setForm] = useState({ child_id: '', appointment_date: '', appointment_time: '09:00 AM', mode: '', notes: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/consultation/booking/${id}`).then(r => {
      setDoctor(r.data.doctor)
      setChildren(r.data.children)
      if (r.data.children.length > 0) setForm(f => ({...f, child_id: r.data.children[0].id}))
      if (r.data.doctor.available_modes.length > 0) setForm(f => ({...f, mode: r.data.doctor.available_modes[0]}))
    })
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/consultation/booking/${id}`, {...form, doctor_id: parseInt(id)})
      navigate('/dashboard')
    } catch (err) {
      alert('Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!doctor) return <div className="gradient-bg min-h-screen"><Navbar /></div>

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 fade-in">
        <Link to="/doctors" className="flex items-center gap-2 text-gray-400 font-semibold text-sm mb-6 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Doctors
        </Link>

        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div>
              <h2 className="font-black text-gray-800 text-lg">{doctor.name}</h2>
              <p className="text-indigo-600 font-semibold text-sm">{doctor.specialty}</p>
            </div>
          </div>

          <h1 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-indigo-500" /> Book Appointment
          </h1>

          <form onSubmit={submit} className="space-y-4">
            {children.length > 0 && (
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><Baby className="w-4 h-4" /> Select Child</label>
                <select value={form.child_id} onChange={e => setForm({...form, child_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> Date</label>
              <input type="date" required value={form.appointment_date} onChange={e => setForm({...form, appointment_date: e.target.value})}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Time Slot</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} type="button" onClick={() => setForm({...form, appointment_time: t})}
                    className={`text-xs font-bold py-2 rounded-xl border-2 transition-all ${form.appointment_time===t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><MonitorSmartphone className="w-4 h-4" /> Mode</label>
              <div className="flex gap-3">
                {doctor.available_modes.map(m => (
                  <button key={m} type="button" onClick={() => setForm({...form, mode: m})}
                    className={`flex-1 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${form.mode===m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Notes (optional)</label>
              <textarea rows={3} placeholder="Any specific concerns for the doctor..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"/>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-3 flex justify-between items-center">
              <span className="font-bold text-gray-600 text-sm">Consultation Fee</span>
              <span className="font-black text-indigo-600 text-lg">₹{doctor.fee}</span>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/> : <CheckCircle className="w-5 h-5" />}
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}