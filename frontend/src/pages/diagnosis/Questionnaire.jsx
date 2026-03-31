import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { ClipboardList, ArrowRight } from 'lucide-react'

const OPTIONS = ['Always', 'Sometimes', 'Rarely', 'Never']

export default function Questionnaire() {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [children, setChildren] = useState([])
  const [childId, setChildId] = useState('')
  const [lang, setLang] = useState('en')
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/diagnosis/questionnaire?lang=${lang}`).then(r => {
      setQuestions(r.data.questions)
      setChildren(r.data.children)
      if (r.data.children.length > 0) setChildId(r.data.children[0].id)
    })
  }, [lang])

  const answered = Object.keys(answers).length
  const total = questions.length
  const pct = total ? (answered / total) * 100 : 0

  const submit = async () => {
    const payload = { child_id: childId, answers }
    const res = await api.post('/diagnosis/questionnaire/submit', payload)
    localStorage.setItem('q_score', res.data.overall_score)
    localStorage.setItem('q_categories', JSON.stringify(res.data.category_scores))
    localStorage.setItem('child_id', childId)
    navigate('/diagnosis/video')
  }

  const catColors = {
    social: 'bg-blue-100 text-blue-700',
    communication: 'bg-green-100 text-green-700',
    play: 'bg-yellow-100 text-yellow-700',
    behavior: 'bg-orange-100 text-orange-700',
    sensory: 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 fade-in">

        {/* Header */}
        <div className="glass rounded-3xl p-6 mb-6 text-center">
          <ClipboardList className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
          <h1 className="text-3xl font-black text-gray-800">Behavioural Questionnaire</h1>
          <p className="text-gray-400 mt-2 text-sm">Answer based on your child's typical behaviour over the past 6 months</p>
          <div className="flex justify-center gap-3 mt-3">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">Step 1 of 4</span>
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">~5 minutes</span>
          </div>
        </div>

        {/* Lang + Child selector */}
        <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">Language:</span>
            {['en','hi','mr'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-lg text-xs font-black border-2 transition-all ${lang===l ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {children.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500">Child:</span>
              <select value={childId} onChange={e => setChildId(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold bg-white/80">
                {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
            <span>Progress</span><span>{answered} / {total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500" style={{width: `${pct}%`}}></div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q) => (
          <div key={q.id} className="glass rounded-3xl p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-black text-indigo-600 text-sm flex-shrink-0">{q.id}</div>
              <div className="flex-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColors[q.category] || 'bg-gray-100 text-gray-600'} mb-2 inline-block`}>{q.category}</span>
                <p className="font-bold text-gray-800 mb-4">{q.q}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {OPTIONS.map((opt, val) => (
                    <button key={opt} type="button" onClick={() => setAnswers({...answers, [q.id]: val})}
                      className={`border-2 rounded-2xl p-3 text-center text-sm font-bold transition-all ${answers[q.id] === val ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Submit */}
        <div className="glass rounded-3xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-4">⚠️ This is not a medical diagnosis. Please consult a specialist.</p>
          <button onClick={submit} disabled={answered < total}
            className="btn-primary px-10 py-4 rounded-2xl font-black text-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowRight className="w-5 h-5" /> Continue to Video Assessment
          </button>
        </div>
      </div>
    </div>
  )
}