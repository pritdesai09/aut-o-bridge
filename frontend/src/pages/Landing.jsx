import { Link } from 'react-router-dom'
import { ScanFace, Stethoscope, LayoutGrid, BarChart2, UserPlus, Puzzle, Target, MessageCircle } from 'lucide-react'

export default function Landing() {
  return (
    <div className="gradient-bg min-h-screen relative">
      <div className="blob w-96 h-96 bg-indigo-400 -top-20 -left-20"></div>
      <div className="blob w-80 h-80 bg-purple-400 top-40 right-0"></div>
      <div className="blob w-72 h-72 bg-orange-300 bottom-20 left-20"></div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">A</div>
            <span className="font-black text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Aut-o-Bridge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/aac" className="px-4 py-2 rounded-xl text-sm font-bold text-orange-600 border-2 border-orange-200 hover:bg-orange-50 transition-all flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4" /> Try AAC Board Free
            </Link>
            <Link to="/login" className="px-4 py-2 rounded-xl border-2 border-indigo-200 text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-all">Login</Link>
            <Link to="/register" className="btn-primary px-5 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 fade-in">
              Bridging the Gap<br/>
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-400 bg-clip-text text-transparent">for Every Child</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Aut-o-Bridge supports families on the autism journey — from early AI-assisted screening to specialist consultations and interactive communication tools built for your child.
            </p>
            <Link to="/register" className="btn-primary px-8 py-4 rounded-2xl font-black text-lg shadow-xl inline-flex items-center gap-2">
              <ScanFace className="w-5 h-5" /> Start Free Screening
            </Link>
            <div className="flex items-center gap-6 mt-8">
              {[['2000+','Families Helped','text-indigo-600'],['15+','Specialists','text-purple-600'],['3','Languages','text-orange-500']].map(([val,label,color])=>(
                <div key={label} className="text-center">
                  <div className={`font-black text-2xl ${color}`}>{val}</div>
                  <div className="text-xs text-gray-400 font-semibold">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="float w-80 h-80 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden p-8">
              <Puzzle className="w-24 h-24 text-indigo-400 mb-4" />
              <div className="font-black text-xl text-indigo-700 text-center">Every piece matters</div>
              <div className="text-gray-500 text-sm mt-2 text-center">Supporting every child's unique journey</div>
              <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-800 mb-3">Everything Your Family Needs</h2>
          <p className="text-gray-400 text-lg">One platform. Complete support.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ScanFace, title: 'AI Screening', desc: 'Behavioural questionnaire + facial emotion analysis for early autism detection', color: 'from-blue-100 to-indigo-100', iconColor: 'text-indigo-500' },
            { icon: Stethoscope, title: 'Expert Consult', desc: 'Connect with certified autism specialists online or in-person', color: 'from-green-100 to-emerald-100', iconColor: 'text-green-500' },
            { icon: LayoutGrid, title: 'AAC Board', desc: 'Interactive communication tool with voice output — free to use, no account needed', color: 'from-orange-100 to-amber-100', iconColor: 'text-orange-500' },
            { icon: BarChart2, title: 'Care Dashboard', desc: 'Track progress, manage doctor access and monitor your child\'s care journey', color: 'from-purple-100 to-pink-100', iconColor: 'text-purple-500' },
          ].map(({ icon: Icon, title, desc, color, iconColor }) => (
            <div key={title} className="glass rounded-3xl p-6 card-hover text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className={`w-8 h-8 ${iconColor}`} />
              </div>
              <h3 className="font-black text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="blob w-64 h-64 bg-indigo-300 -top-20 -left-20"></div>
          <div className="blob w-48 h-48 bg-purple-300 -bottom-10 -right-10"></div>
          <div className="relative">
            <h2 className="text-4xl font-black text-gray-800 mb-4">Begin Your Child's Journey Today</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">Early detection changes everything. Create a free account to start the AI screening.</p>
            <Link to="/register" className="btn-primary px-10 py-4 rounded-2xl font-black text-xl inline-flex items-center gap-3 shadow-2xl">
              <UserPlus className="w-6 h-6" /> Create Free Account
            </Link>
            <p className="text-gray-400 text-sm mt-4">No credit card required · Takes 2 minutes</p>
          </div>
        </div>
      </section>
    </div>
  )
}