import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { Brain } from 'lucide-react'

const STEPS = [
  'Processing questionnaire scores...',
  'Extracting facial emotion frames...',
  'Running DeepFace emotion analysis...',
  'Calculating confidence score...',
]

export default function Processing() {
  const [params] = useSearchParams()
  const jobId = params.get('job_id')
  const [pct, setPct] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const barInterval = setInterval(() => setPct(p => Math.min(p + 1, 95)), 120)
    const stepTimers = [1000,3000,6000,9000].map((t,i) => setTimeout(() => setCurrentStep(i), t))

    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/diagnosis/job-status/${jobId}`)
        if (res.data.status === 'complete' || res.data.status === 'not_found' || res.data.status === 'error') {
          clearInterval(barInterval)
          clearInterval(poll)
          setPct(100)
          setCurrentStep(3)
          setTimeout(() => navigate(`/diagnosis/report?job_id=${jobId}`), 1000)
        }
      } catch { }
    }, 2000)

    setTimeout(() => {
      clearInterval(poll)
      navigate(`/diagnosis/report?job_id=${jobId}`)
    }, 30000)

    return () => {
      clearInterval(barInterval)
      clearInterval(poll)
      stepTimers.forEach(clearTimeout)
    }
  }, [jobId])

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 fade-in text-center">
        <div className="glass rounded-3xl p-12">
          <Brain className="w-16 h-16 text-indigo-400 mx-auto mb-6 float" />
          <h1 className="text-3xl font-black text-gray-800 mb-3">Analysing Results</h1>
          <p className="text-gray-400 mb-8 text-sm">Our AI is processing the facial emotion data and combining it with questionnaire responses.</p>

          <div className="space-y-3 text-left mb-8">
            {STEPS.map((s,i) => (
              <div key={i} className={`flex items-center gap-3 transition-all ${i > currentStep ? 'opacity-30' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-sm font-black">
                  {i < currentStep ? '✅' : i === currentStep ? '⚙️' : '⏳'}
                </div>
                <span className="font-semibold text-gray-600 text-sm">{s}</span>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500" style={{width:`${pct}%`}} />
          </div>
          <div className="text-sm text-gray-400 font-semibold">{pct}%</div>
        </div>
      </div>
    </div>
  )
}