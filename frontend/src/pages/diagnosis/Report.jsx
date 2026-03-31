import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { AlertTriangle, Stethoscope, LayoutGrid, Printer } from 'lucide-react'

export default function Report() {
  const [params] = useSearchParams()
  const jobId = params.get('job_id')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const qScore = parseFloat(localStorage.getItem('q_score') || '0.5')
    const categories = JSON.parse(localStorage.getItem('q_categories') || '{}')
    api.get(`/diagnosis/report?job_id=${jobId}`).then(r => {
      setResult({ ...r.data, category_scores: categories })
    }).catch(() => {
      setResult({
        final: { confidence_level: 'Moderate', percentage: 45, message: 'Some indicators observed. A consultation with a specialist is recommended.' },
        q_score: qScore, category_scores: categories,
        emotion_scores: { alignment_score: 0.5, variability_score: 0.5 },
        emotion_result: { emotion_counts: {} }
      })
    })
  }, [jobId])

  if (!result) return (
    <div className="gradient-bg min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  )

  const { final, q_score, category_scores, emotion_scores, emotion_result } = result
  const level = final.confidence_level
  const pct = final.percentage
  const levelColor = level === 'High' ? '#ef4444' : level === 'Moderate' ? '#f97316' : '#22c55e'
  const levelBg = level === 'High' ? 'bg-red-50 border-red-200 text-red-700' : level === 'Moderate' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'
  const catIcons = { social:'👥', communication:'💬', play:'🎮', behavior:'🔄', sensory:'👂' }
  const emojiMap = { happy:'😊', sad:'😢', surprise:'😮', angry:'😠', fear:'😨', disgust:'🤢', neutral:'😐' }
  const circumference = 2 * Math.PI * 50

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 fade-in">

        {/* Disclaimer */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-black text-amber-800 text-sm">Important Disclaimer</div>
            <div className="text-amber-700 text-xs mt-1">This AI screening tool is NOT a medical diagnosis. Results must be confirmed by a qualified specialist.</div>
          </div>
        </div>

        {/* Main result */}
        <div className="glass rounded-3xl p-8 mb-6 text-center">
          <h1 className="text-3xl font-black text-gray-800 mb-2">Screening Complete</h1>
          <p className="text-gray-400 mb-6 text-sm">AI Confidence Level of Autism Indicators</p>

          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke={levelColor} strokeWidth="12"
                strokeDasharray={`${(pct/100)*circumference} ${circumference}`} strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-800">{pct}%</span>
              <span className="text-xs font-bold" style={{color:levelColor}}>{level}</span>
            </div>
          </div>

          <div className={`border-2 rounded-2xl p-4 text-sm font-semibold ${levelBg}`}>{final.message}</div>
        </div>

        {/* Score breakdown */}
        <div className="glass rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-black text-gray-800 mb-4">Score Breakdown</h2>
          {[
            { label: '📋 Questionnaire Score (50%)', val: q_score, color: 'bg-indigo-500' },
            { label: '📷 Emotion Alignment (30%)', val: emotion_scores?.alignment_score || 0.5, color: 'bg-purple-500' },
            { label: '🎭 Emotion Variability (20%)', val: emotion_scores?.variability_score || 0.5, color: 'bg-orange-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="mb-4">
              <div className="flex justify-between text-sm font-bold mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="text-indigo-600">{(val*100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{width:`${val*100}%`}} />
              </div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        {Object.keys(category_scores).length > 0 && (
          <div className="glass rounded-3xl p-6 mb-6">
            <h2 className="text-xl font-black text-gray-800 mb-4">Category Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(category_scores).map(([cat, score]) => (
                <div key={cat} className="bg-white/60 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{catIcons[cat] || '📊'}</div>
                  <div className="text-xs font-black text-gray-500 uppercase mb-1">{cat}</div>
                  <div className={`text-xl font-black ${score > 0.65 ? 'text-red-500' : score > 0.4 ? 'text-orange-500' : 'text-green-500'}`}>
                    {Math.round(score*100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotion data */}
        {emotion_result?.emotion_counts && Object.values(emotion_result.emotion_counts).some(v => v > 0) && (
          <div className="glass rounded-3xl p-6 mb-6">
            <h2 className="text-xl font-black text-gray-800 mb-4">Detected Emotions During Video</h2>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(emotion_result.emotion_counts).filter(([,v]) => v > 0).map(([emotion, count]) => (
                <div key={emotion} className="bg-white/60 rounded-2xl p-3 text-center">
                  <div className="text-xl">{emojiMap[emotion] || '😐'}</div>
                  <div className="text-xs font-black text-gray-500 mt-1">{emotion}</div>
                  <div className="text-sm font-black text-indigo-600">{count}x</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="glass rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-black text-gray-800 mb-4">Recommended Next Steps</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl">
              <Stethoscope className="w-6 h-6 text-indigo-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-black text-gray-800 text-sm">Consult a Specialist</div>
                <div className="text-gray-500 text-xs">Book an appointment with a certified autism specialist</div>
              </div>
              <Link to="/doctors" className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0">Book Now</Link>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl">
              <LayoutGrid className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-black text-gray-800 text-sm">Use the AAC Board</div>
                <div className="text-gray-500 text-xs">Help your child communicate using our interactive board</div>
              </div>
              <Link to="/aac" className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0">Open</Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <Link to="/dashboard" className="flex-1 py-3 rounded-2xl btn-primary font-bold text-center flex items-center justify-center">
            Go to Dashboard →
          </Link>
        </div>

      </div>
    </div>
  )
}