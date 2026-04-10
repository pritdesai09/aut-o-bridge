import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { Camera, Play, Square, Upload, CheckCircle, Maximize2, Minimize2 } from 'lucide-react'

export default function VideoPlayer() {
  const [step, setStep] = useState('instructions')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [cameraError, setCameraError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
    }
  }, [])

  const startSetup = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStep('assessment')
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Click the camera icon in your browser address bar, allow access, then try again.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a webcam and try again.')
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is in use by another app. Please close it and try again.')
      } else {
        setCameraError(`Camera error: ${err.message}. Try refreshing the page.`)
      }
    }
  }

  const startRecording = () => {
    chunksRef.current = []
    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
    let mimeType = ''
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) { mimeType = type; break }
    }
    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {})
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = uploadVideo
    mr.start(1000)
    mediaRecorderRef.current = mr
    setRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds(s => { if (s >= 119) { stopRecording(); return s } return s + 1 })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
    setStep('uploading')
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const uploadVideo = async () => {
    const mimeType = chunksRef.current[0]?.type || 'video/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const fd = new FormData()
    fd.append('video', blob, 'recording.webm')
    const qScore = localStorage.getItem('q_score') || '0.5'
    try {
      const res = await api.post('/diagnosis/analyze-video', fd, {
        headers: { 'X-QScore': qScore }
      })
      navigate(`/diagnosis/processing?job_id=${res.data.job_id}`)
    } catch {
      navigate('/diagnosis/report?job_id=fallback')
    }
  }

  const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 fade-in">

        {/* Header */}
        <div className="glass rounded-3xl p-5 mb-6 text-center">
          <Camera className="w-9 h-9 text-indigo-500 mx-auto mb-1.5" />
          <h1 className="text-2xl font-black text-gray-800">Emotion Response Assessment</h1>
          <p className="text-gray-400 mt-1 text-sm">Your child watches a short video while we observe facial responses</p>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block">Step 2 of 4</span>
        </div>

        {/* Instructions */}
        {step === 'instructions' && (
          <div className="glass rounded-3xl p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-black text-gray-800 mb-5">Before we begin:</h2>
            <div className="space-y-3 mb-6">
              {[
                'Sit your child comfortably in front of the screen',
                'Make sure the room is well-lit',
                'When prompted, click "Allow" for camera access in the browser popup',
                'Let your child watch naturally — do not prompt reactions'
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm flex-shrink-0">{i+1}</div>
                  <span className="font-semibold text-gray-600 text-sm">{tip}</span>
                </div>
              ))}
            </div>
            {cameraError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700 font-semibold">
                ⚠️ {cameraError}
              </div>
            )}
            <button onClick={startSetup} className="btn-primary w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" /> Enable Camera & Continue
            </button>
            <p className="text-center text-xs text-gray-400 mt-3 font-semibold">Best on Chrome or Edge</p>
          </div>
        )}

        {/* Assessment — Expanded layout */}
        {step === 'assessment' && (
          <div className="space-y-4">
            {/* Videos row — side by side, large */}
            <div className={`grid gap-4 ${expanded ? 'grid-cols-1' : 'md:grid-cols-2'}`}>

              {/* Stimulus video */}
              {!expanded && (
                <div className="glass rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                    <span className="text-sm font-black text-gray-600 flex items-center gap-1.5">
                      📺 Stimulus Video
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">Watch this with your child</span>
                  </div>
                  <div className="relative bg-gray-900" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/sCNrK-n68CM?controls=1&rel=0"
                      allowFullScreen
                      title="Stimulus Video"
                    />
                  </div>
                </div>
              )}

              {/* Camera feed — EXPANDED */}
              <div className={`glass rounded-3xl overflow-hidden ${expanded ? 'w-full' : ''}`}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <span className="text-sm font-black text-gray-600 flex items-center gap-2">
                    📷 Child's Camera Feed
                    {recording && (
                      <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        ● REC {fmt(seconds)}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                  >
                    {expanded ? <><Minimize2 className="w-4 h-4" /> Shrink</> : <><Maximize2 className="w-4 h-4" /> Expand</>}
                  </button>
                </div>
                <div
                  className="relative bg-gray-900"
                  style={{ paddingBottom: expanded ? '42%' : '56.25%' }}
                >
                  <video
                    ref={videoRef}
                    autoPlay muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {!recording && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/40 rounded-2xl px-6 py-3 text-white font-bold text-sm flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" /> Camera ready
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls — always visible below videos */}
            <div className="glass rounded-3xl p-6">
              <div className="flex flex-col items-center gap-4">
                {recording ? (
                  <>
                    {/* Timer display */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-5xl font-black text-indigo-600 tabular-nums">{fmt(seconds)}</div>
                        <div className="text-xs text-gray-400 font-semibold mt-1">Recording in progress</div>
                      </div>
                      {/* Progress arc */}
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="26" fill="none" stroke="#e2e8f0" strokeWidth="5"/>
                          <circle cx="30" cy="30" r="26" fill="none" stroke="#6366f1" strokeWidth="5"
                            strokeDasharray={`${(seconds/120)*163} 163`} strokeLinecap="round"/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600">
                          {Math.round((seconds/120)*100)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-500 font-semibold text-sm text-center">
                      Let your child watch naturally. Recording stops automatically at 2 minutes.
                    </p>
                    <button onClick={stopRecording}
                      className="btn-secondary px-10 py-3.5 rounded-2xl font-black text-lg flex items-center gap-2">
                      <Square className="w-5 h-5" /> Stop Recording
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Camera is ready — position your child in front of the screen</span>
                    </div>
                    <p className="text-gray-400 text-sm text-center">
                      Press Start when your child is seated comfortably and the video is visible to them
                    </p>
                    <div className="flex gap-3">
                      <button onClick={startRecording}
                        className="btn-primary px-10 py-3.5 rounded-2xl font-black text-lg flex items-center gap-2">
                        <Play className="w-5 h-5" /> Start Assessment
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold">
                      Click Expand above to make the camera feed larger for better visibility
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Tips strip */}
            <div className="flex gap-3 flex-wrap">
              {['Room should be well-lit', 'Child\'s face clearly visible', 'Recording max 2 minutes', 'No prompting reactions'].map(tip => (
                <div key={tip} className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <CheckCircle className="w-3 h-3 text-green-400" /> {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="glass rounded-3xl p-16 text-center max-w-xl mx-auto">
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Uploading Recording...</h2>
            <p className="text-gray-400 text-sm">Please wait. Do not close this tab.</p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width:'70%'}} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}