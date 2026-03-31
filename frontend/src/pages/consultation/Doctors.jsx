import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { Stethoscope, Star, MapPin, Briefcase, Video, Building2, Search } from 'lucide-react'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [filters, setFilters] = useState({ specialty: '', mode: '', lang_filter: '' })

  useEffect(() => {
    const params = new URLSearchParams(filters).toString()
    api.get(`/consultation/doctors?${params}`).then(r => setDoctors(r.data))
  }, [filters])

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 fade-in">

        <div className="glass rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Stethoscope className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-black text-gray-800">Find a Specialist</h1>
          </div>
          <p className="text-gray-400 ml-11 text-sm">Connect with certified autism specialists in your language</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <Search className="w-4 h-4 text-gray-400" />
          {[
            { key: 'specialty', options: ['','Child Psychologist','Developmental Pediatrician','Behavioral Therapist','Autism Specialist'], label: 'Specialty' },
            { key: 'mode', options: ['','Online','In-person'], label: 'Mode' },
            { key: 'lang_filter', options: ['','English','Hindi','Marathi'], label: 'Language' },
          ].map(({ key, options, label }) => (
            <select key={key} value={filters[key]} onChange={e => setFilters({...filters, [key]: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">All {label}s</option>
              {options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {doctors.map(doc => (
            <div key={doc.id} className="glass rounded-3xl p-6 card-hover">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-800 text-lg">{doc.name}</h3>
                  <p className="text-indigo-600 font-semibold text-sm">{doc.specialty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_,i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(doc.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-xs text-gray-400 font-semibold ml-1">{doc.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-indigo-600 text-lg">₹{doc.fee}</div>
                  <div className="text-xs text-gray-400">per session</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                  <Briefcase className="w-3 h-3" /> {doc.experience_years} yrs
                </span>
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                  <MapPin className="w-3 h-3" /> {doc.location}
                </span>
                {doc.available_modes.map(m => (
                  <span key={m} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${m==='Online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m==='Online' ? <Video className="w-3 h-3"/> : <Building2 className="w-3 h-3"/>} {m}
                  </span>
                ))}
                {doc.languages.map(l => (
                  <span key={l} className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg">{l}</span>
                ))}
              </div>

              <div className="flex gap-3">
                <Link to={`/doctors/${doc.id}`} className="flex-1 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-600 font-bold text-sm text-center hover:bg-indigo-50 transition-all">
                  View Profile
                </Link>
                <Link to={`/booking/${doc.id}`} className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-sm text-center">
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}