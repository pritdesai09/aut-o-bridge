import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { ScanFace, LayoutGrid, Stethoscope, ShieldCheck, Plus, Baby, CalendarClock, Video, Building2, CalendarX } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    api.get('/dashboard/home').then(r => {
      setChildren(r.data.children || [])
      setAppointments(r.data.appointments || [])
    })
  }, [])

  const quickActions = [
    { to: '/diagnosis/questionnaire', icon: ScanFace, label: 'Start Screening', color: 'bg-indigo-100', iconColor: 'text-indigo-500' },
    { to: '/aac', icon: LayoutGrid, label: 'AAC Board', color: 'bg-orange-100', iconColor: 'text-orange-500' },
    { to: '/doctors', icon: Stethoscope, label: 'Find Doctor', color: 'bg-green-100', iconColor: 'text-green-500' },
    { to: '/access-control', icon: ShieldCheck, label: 'Access Control', color: 'bg-purple-100', iconColor: 'text-purple-500' },
  ]

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 fade-in">

        {/* Header */}
        <div className="glass rounded-3xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
              <Baby className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <Link to="/child-profile" className="btn-primary px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Child
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map(({ to, icon: Icon, label, color, iconColor }) => (
            <Link key={to} to={to} className="glass rounded-2xl p-5 card-hover text-center block">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div className="font-black text-gray-700 text-sm">{label}</div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Children */}
          <div>
            <h2 className="text-xl font-black text-gray-700 mb-4 flex items-center gap-2">
              <Baby className="w-5 h-5 text-indigo-500" /> Children Profiles
            </h2>
            {children.length > 0 ? children.map(child => (
              <div key={child.id} className="glass rounded-3xl p-5 card-hover mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Baby className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <div className="font-black text-gray-800">{child.full_name}</div>
                    <div className="text-xs text-gray-400 font-semibold">DOB: {child.date_of_birth}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/diagnosis/questionnaire" className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1">
                    <ScanFace className="w-3 h-3" /> Screen
                  </Link>
                  <Link to="/doctors" className="btn-secondary flex-1 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Consult
                  </Link>
                </div>
              </div>
            )) : (
              <div className="glass rounded-3xl p-8 text-center">
                <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-black text-lg text-gray-600 mb-2">No Child Profile Yet</h3>
                <p className="text-gray-400 text-sm mb-4">Add your child's profile to begin</p>
                <Link to="/child-profile" className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Child
                </Link>
              </div>
            )}
          </div>

          {/* Appointments */}
          <div>
            <h2 className="text-xl font-black text-gray-700 mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-green-500" /> Appointments
            </h2>
            {appointments.length > 0 ? appointments.map(appt => (
              <div key={appt.id} className="glass rounded-2xl p-4 mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  {appt.mode === 'Online' ? <Video className="w-5 h-5 text-green-600" /> : <Building2 className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-black text-gray-800 text-sm">Dr. {appt.doctor_name || `#${appt.doctor_id}`}</div>
                  <div className="text-xs text-gray-400">{appt.appointment_date} at {appt.appointment_time}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${appt.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {appt.status}
                </span>
              </div>
            )) : (
              <div className="glass rounded-3xl p-8 text-center">
                <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-black text-lg text-gray-600 mb-2">No Appointments</h3>
                <p className="text-gray-400 text-sm mb-4">Book a consultation with a specialist</p>
                <Link to="/doctors" className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" /> Find Doctor
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}