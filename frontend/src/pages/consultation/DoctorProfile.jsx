import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { ArrowLeft, Stethoscope, Star, Briefcase, MapPin, IndianRupee, FileText, Languages, MonitorSmartphone, CalendarPlus } from 'lucide-react'

export default function DoctorProfile() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)

  useEffect(() => {
    api.get(`/consultation/doctor/${id}`).then(r => setDoctor(r.data))
  }, [id])

  if (!doctor) return <div className="gradient-bg min-h-screen"><Navbar /></div>

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
        <Link to="/doctors" className="flex items-center gap-2 text-gray-400 font-semibold text-sm mb-6 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Doctors
        </Link>

        <div className="glass rounded-3xl p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-12 h-12 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-800">{doctor.name}</h1>
              <p className="text-indigo-600 font-bold">{doctor.specialty}</p>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_,i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(doctor.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
                <span className="text-sm text-gray-500 font-bold ml-1">{doctor.rating} / 5.0</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Briefcase, label: 'Experience', value: `${doctor.experience_years} yrs`, bg: 'bg-indigo-50', color: 'text-indigo-500' },
              { icon: IndianRupee, label: 'Per Session', value: `₹${doctor.fee}`, bg: 'bg-green-50', color: 'text-green-500' },
              { icon: MapPin, label: 'Location', value: doctor.location, bg: 'bg-purple-50', color: 'text-purple-500' },
            ].map(({ icon: Icon, label, value, bg, color }) => (
              <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
                <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                <div className="font-black text-gray-800 text-sm">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <h3 className="font-black text-gray-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> About</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{doctor.bio}</p>
          </div>

          <div className="mb-5">
            <h3 className="font-black text-gray-700 mb-2 flex items-center gap-2"><Languages className="w-4 h-4" /> Languages</h3>
            <div className="flex gap-2 flex-wrap">
              {doctor.languages.map(l => <span key={l} className="bg-purple-100 text-purple-700 text-sm font-bold px-3 py-1 rounded-xl">{l}</span>)}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-black text-gray-700 mb-2 flex items-center gap-2"><MonitorSmartphone className="w-4 h-4" /> Available Modes</h3>
            <div className="flex gap-2">
              {doctor.available_modes.map(m => (
                <span key={m} className={`font-bold px-3 py-1 rounded-xl text-sm ${m==='Online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{m}</span>
              ))}
            </div>
          </div>

          <Link to={`/booking/${doctor.id}`} className="btn-primary w-full py-4 rounded-2xl font-black text-lg text-center flex items-center justify-center gap-2">
            <CalendarPlus className="w-5 h-5" /> Book Appointment
          </Link>
        </div>
      </div>
    </div>
  )
}