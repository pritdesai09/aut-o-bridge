import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { ShieldCheck, Info, Stethoscope, MapPin } from 'lucide-react'

export default function AccessControl() {
  const [doctors, setDoctors] = useState([])
  const [children, setChildren] = useState([])
  const [grantedIds, setGrantedIds] = useState(new Set())
  const [selectedChild, setSelectedChild] = useState('')

  useEffect(() => {
    api.get('/dashboard/access_control').then(r => {
      setDoctors(r.data.doctors)
      setChildren(r.data.children)
      setGrantedIds(new Set(r.data.granted_ids))
      if (r.data.children.length > 0) setSelectedChild(r.data.children[0].id)
    })
  }, [])

  const toggle = async (doctorId) => {
    await api.post('/dashboard/access_control/toggle', { doctor_id: doctorId, child_id: selectedChild })
    setGrantedIds(prev => {
      const next = new Set(prev)
      if (next.has(doctorId)) next.delete(doctorId)
      else next.add(doctorId)
      return next
    })
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 fade-in">

        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-black text-gray-800">Doctor Access Control</h1>
              <p className="text-gray-400 text-sm">Control which doctors can view your child's medical records</p>
            </div>
          </div>
        </div>

        {children.length > 1 && (
          <div className="glass rounded-2xl p-4 mb-6">
            <label className="text-sm font-bold text-gray-600 block mb-2">Managing access for:</label>
            <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white/80 w-full">
              {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-4">
          {doctors.map(doc => (
            <div key={doc.id} className="glass rounded-3xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800">{doc.name}</h3>
                    <p className="text-indigo-600 font-semibold text-sm">{doc.specialty}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {doc.location}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={() => toggle(doc.id)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${grantedIds.has(doc.id) ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${grantedIds.has(doc.id) ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <div className={`text-xs font-bold mt-1 ${grantedIds.has(doc.id) ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {grantedIds.has(doc.id) ? 'Granted' : 'Revoked'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-4 mt-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500 font-semibold">Granting access allows a doctor to view your child's diagnostic reports. You can revoke access at any time.</p>
        </div>
      </div>
    </div>
  )
}