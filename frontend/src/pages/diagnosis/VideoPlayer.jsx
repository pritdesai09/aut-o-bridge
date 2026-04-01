import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { Camera, Play, Square, Upload, CheckCircle } from 'lucide-react'

export default function VideoPlayer() {
  const [step, setStep] = useState('instructions')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      clearInterval(timerRef.current)
    }
  }, [])

  const startSetup = async () => {
    setCameraError('')
    try {
      // Request camera with explicit constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStep('assessment')
    } catch (err) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please click the camera icon in your browser address bar and allow access, then try again.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a webcam and try again.')
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is being used by another application. Please close it and try again.')
      } else {
        setCameraError(`Camera error: ${err.message}. Try refreshing the page.`)
      }
    }
  }

  const startRecording = () => {
    chunksRef.current = []

    // Try different MIME types for compatibility
    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
    let mimeType = ''
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type
        break
      }
    }

    const options = mimeType ? { mimeType } : {}
    const mr = new MediaRecorder(streamRef.current, options)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = uploadVideo
    mr.start(1000)
    mediaRecorderRef.current = mr
    setRecording(true)
    setSeconds(0)

    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s >= 119) {
          stopRecording()
          return s
        }
        return s + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    clearInterval(timerRef.current)
    setRecording(false)
    setStep('uploading')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
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
    } catch (err) {
      console.error('Upload error:', err)
      navigate('/diagnosis/report?job_id=fallback')
    }
  }

  const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 fade-in">

        <div className="glass rounded-3xl p-6 mb-6 text-center">
          <Camera className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
          <h1 className="text-3xl font-black text-gray-800">Emotion Response Assessment</h1>
          <p className="text-gray-400 mt-2 text-sm">Your child will watch a short video while we gently observe facial responses</p>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mt-3 inline-block">Step 2 of 4</span>
        </div>

        {step === 'instructions' && (
          <div className="glass rounded-3xl p-8">
            <h2 className="text-xl font-black text-gray-800 mb-4">Before we begin:</h2>
            <div className="space-y-3 mb-6">
              {[
                'Sit your child comfortably in front of the screen',
                'Make sure the room is well-lit',
                'When prompted, click "Allow" for camera access in the browser popup',
                'Let your child watch naturally — do not prompt reactions'
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm flex-shrink-0">{i+1}</div>
                  <span className="font-semibold text-sm">{tip}</span>
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

            <p className="text-center text-xs text-gray-400 mt-3 font-semibold">
              Make sure you're on Chrome or Edge for best camera support
            </p>
          </div>
        )}

        {step === 'assessment' && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="glass rounded-3xl p-4">
                <div className="text-sm font-bold text-gray-500 mb-2 text-center">📺 Stimulus Video</div>
                <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-video">
                  <iframe
                    width="100%" height="100%"
                    src="https://www.youtube.com/embed/sCNrK-n68CM?controls=0&rel=0"
                    allowFullScreen
                    className="rounded-2xl"
                    title="Stimulus Video"
                  />
                </div>
              </div>
              <div className="glass rounded-3xl p-4">
                <div className="text-sm font-bold text-gray-500 mb-2 text-center">📷 Child's Camera</div>
                <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-video relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  {recording && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> REC
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 text-center">
              {recording ? (
                <>
                  <div className="text-4xl font-black text-indigo-600 mb-2">{fmt(seconds)}</div>
                  <p className="text-gray-500 font-semibold mb-4 text-sm">Recording... Let your child watch naturally</p>
                  <button onClick={stopRecording} className="btn-secondary px-8 py-3 rounded-2xl font-black flex items-center gap-2 mx-auto">
                    <Square className="w-5 h-5" /> Stop Recording
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">Camera ready!</span>
                  </div>
                  <p className="text-gray-500 font-semibold mb-4 text-sm">Press Start when your child is in position</p>
                  <button onClick={startRecording} className="btn-primary px-8 py-3 rounded-2xl font-black flex items-center gap-2 mx-auto">
                    <Play className="w-5 h-5" /> Start Assessment
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {step === 'uploading' && (
          <div className="glass rounded-3xl p-12 text-center">
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-black text-gray-800 mb-2">Uploading Recording...</h2>
            <p className="text-gray-400">Please wait while we securely upload the video for analysis</p>
          </div>
        )}

      </div>
    </div>
  )
}