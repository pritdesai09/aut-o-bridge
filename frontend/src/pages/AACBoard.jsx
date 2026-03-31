import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Volume2, Gauge, Undo2, Trash2, MessageSquareText, Waves, LogIn } from 'lucide-react'

const THEMES = {
  calm:      { bg: 'linear-gradient(135deg,#dbeafe,#ede9fe,#dbeafe)', accent: '#3b82f6', tile: 'rgba(239,246,255,0.95)', label: 'Calm 💙',      dot: '#3b82f6' },
  happy:     { bg: 'linear-gradient(135deg,#fef9c3,#fef3c7,#fefce8)', accent: '#f59e0b', tile: 'rgba(255,253,235,0.95)', label: 'Happy 💛',     dot: '#f59e0b' },
  energetic: { bg: 'linear-gradient(135deg,#ffedd5,#fee2e2,#fef9c3)', accent: '#f97316', tile: 'rgba(255,247,237,0.95)', label: 'Energetic 🧡', dot: '#f97316' },
  sleepy:    { bg: 'linear-gradient(135deg,#ede9fe,#fae8ff,#f3e8ff)', accent: '#8b5cf6', tile: 'rgba(245,243,255,0.95)', label: 'Sleepy 💜',    dot: '#8b5cf6' },
  nature:    { bg: 'linear-gradient(135deg,#dcfce7,#d1fae5,#ecfdf5)', accent: '#22c55e', tile: 'rgba(240,253,244,0.95)', label: 'Nature 💚',    dot: '#22c55e' },
  neutral:   { bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0,#f8fafc)', accent: '#64748b', tile: 'rgba(248,250,252,0.95)', label: 'Neutral 🩶',   dot: '#94a3b8' },
}

const CATEGORIES = [
  { id: 'greetings', label: { en:'Greetings', hi:'अभिवादन', mr:'शुभेच्छा' }, tiles: [
    { icon:'👋', en:'Hello', hi:'नमस्ते', mr:'नमस्कार' },
    { icon:'🌅', en:'Good Morning', hi:'शुभ प्रभात', mr:'शुभ सकाळ' },
    { icon:'🌙', en:'Good Night', hi:'शुभ रात्रि', mr:'शुभ रात्र' },
    { icon:'👍', en:'Yes', hi:'हाँ', mr:'हो' },
    { icon:'👎', en:'No', hi:'नहीं', mr:'नाही' },
    { icon:'🙏', en:'Thank You', hi:'धन्यवाद', mr:'धन्यवाद' },
    { icon:'😔', en:'Sorry', hi:'माफ़ करना', mr:'माफ करा' },
    { icon:'🤗', en:'Hug', hi:'गले लगाओ', mr:'मिठी' },
    { icon:'👐', en:'Welcome', hi:'स्वागत है', mr:'स्वागत आहे' },
    { icon:'🙋', en:'My Turn', hi:'मेरी बारी', mr:'माझी पाळी' },
    { icon:'🤝', en:'Please Help', hi:'कृपया मदद', mr:'कृपया मदत करा' },
    { icon:'✋', en:'Wait', hi:'रुको', mr:'थांबा' },
  ]},
  { id: 'feelings', label: { en:'Feelings', hi:'भावनाएं', mr:'भावना' }, tiles: [
    { icon:'😊', en:'Happy', hi:'खुश', mr:'आनंदी' },
    { icon:'😢', en:'Sad', hi:'उदास', mr:'दुःखी' },
    { icon:'😠', en:'Angry', hi:'गुस्सा', mr:'रागावलेला' },
    { icon:'😨', en:'Scared', hi:'डरा हुआ', mr:'घाबरलेला' },
    { icon:'😴', en:'Tired', hi:'थका हुआ', mr:'थकलेला' },
    { icon:'🤒', en:'Sick', hi:'बीमार', mr:'आजारी' },
    { icon:'😕', en:'Confused', hi:'भ्रमित', mr:'गोंधळलेला' },
    { icon:'🥰', en:'Love', hi:'प्यार', mr:'प्रेम' },
    { icon:'😤', en:'Frustrated', hi:'परेशान', mr:'त्रासलेला' },
    { icon:'🤩', en:'Excited', hi:'उत्साहित', mr:'उत्साही' },
    { icon:'😌', en:'Calm', hi:'शांत', mr:'शांत' },
    { icon:'😬', en:'Nervous', hi:'घबराया', mr:'अस्वस्थ' },
    { icon:'🤗', en:'Safe', hi:'सुरक्षित', mr:'सुरक्षित' },
    { icon:'😪', en:'Sleepy', hi:'नींद आ रही', mr:'झोपाळू' },
    { icon:'🤧', en:'Hurt', hi:'दर्द है', mr:'दुखत आहे' },
    { icon:'😎', en:'Good', hi:'अच्छा', mr:'चांगले' },
  ]},
  { id: 'needs', label: { en:'I Need', hi:'मुझे चाहिए', mr:'मला हवे' }, tiles: [
    { icon:'🍽️', en:'Food', hi:'खाना', mr:'जेवण' },
    { icon:'💧', en:'Water', hi:'पानी', mr:'पाणी' },
    { icon:'🚽', en:'Toilet', hi:'शौचालय', mr:'शौचालय' },
    { icon:'😴', en:'Sleep', hi:'नींद', mr:'झोप' },
    { icon:'🤲', en:'Help', hi:'मदद', mr:'मदत' },
    { icon:'🛑', en:'Stop', hi:'रुको', mr:'थांबा' },
    { icon:'➕', en:'More', hi:'और', mr:'अजून' },
    { icon:'🔇', en:'Quiet', hi:'शांत', mr:'शांत' },
    { icon:'🏠', en:'Go Home', hi:'घर जाना', mr:'घरी जायचे' },
    { icon:'🩹', en:'Medicine', hi:'दवाई', mr:'औषध' },
    { icon:'🧸', en:'My Toy', hi:'मेरा खिलौना', mr:'माझे खेळणे' },
    { icon:'📱', en:'Phone', hi:'फ़ोन', mr:'फोन' },
    { icon:'🎵', en:'Music', hi:'संगीत', mr:'संगीत' },
    { icon:'📺', en:'TV', hi:'टीवी', mr:'टीव्ही' },
    { icon:'🧊', en:'Cold', hi:'ठंडा', mr:'थंड' },
    { icon:'🌡️', en:'Hot', hi:'गर्म', mr:'गरम' },
  ]},
  { id: 'food', label: { en:'Food', hi:'खाना', mr:'अन्न' }, tiles: [
    { icon:'🍎', en:'Fruit', hi:'फल', mr:'फळ' },
    { icon:'🥛', en:'Milk', hi:'दूध', mr:'दूध' },
    { icon:'🍞', en:'Bread', hi:'रोटी', mr:'भाकरी' },
    { icon:'🍚', en:'Rice', hi:'चावल', mr:'भात' },
    { icon:'🍪', en:'Biscuit', hi:'बिस्किट', mr:'बिस्किट' },
    { icon:'🧃', en:'Juice', hi:'जूस', mr:'रस' },
    { icon:'🍌', en:'Banana', hi:'केला', mr:'केळ' },
    { icon:'🍫', en:'Chocolate', hi:'चॉकलेट', mr:'चॉकलेट' },
    { icon:'🍦', en:'Ice Cream', hi:'आइसक्रीम', mr:'आइसक्रीम' },
    { icon:'🥚', en:'Egg', hi:'अंडा', mr:'अंडे' },
    { icon:'🍗', en:'Chicken', hi:'चिकन', mr:'कोंबडी' },
    { icon:'🥗', en:'Salad', hi:'सलाद', mr:'सलाड' },
    { icon:'🍜', en:'Noodles', hi:'नूडल्स', mr:'नूडल्स' },
    { icon:'🫓', en:'Roti', hi:'रोटी', mr:'रोटी' },
    { icon:'🍛', en:'Dal', hi:'दाल', mr:'डाळ' },
    { icon:'🫖', en:'Tea', hi:'चाय', mr:'चहा' },
  ]},
  { id: 'actions', label: { en:'Actions', hi:'क्रियाएं', mr:'क्रिया' }, tiles: [
    { icon:'▶️', en:'Play', hi:'खेलना', mr:'खेळणे' },
    { icon:'📚', en:'Read', hi:'पढ़ना', mr:'वाचणे' },
    { icon:'✏️', en:'Draw', hi:'बनाना', mr:'काढणे' },
    { icon:'🎨', en:'Paint', hi:'रंग भरना', mr:'रंगवणे' },
    { icon:'🏃', en:'Run', hi:'दौड़ना', mr:'धावणे' },
    { icon:'🚶', en:'Walk', hi:'चलना', mr:'चालणे' },
    { icon:'🛁', en:'Bath', hi:'नहाना', mr:'आंघोळ' },
    { icon:'🦷', en:'Brush Teeth', hi:'दाँत साफ', mr:'दात घासणे' },
    { icon:'👕', en:'Get Dressed', hi:'कपड़े पहनना', mr:'कपडे घालणे' },
    { icon:'🍽️', en:'Eat', hi:'खाना खाना', mr:'जेवणे' },
    { icon:'💤', en:'Sleep', hi:'सोना', mr:'झोपणे' },
    { icon:'📺', en:'Watch TV', hi:'टीवी देखना', mr:'टीव्ही बघणे' },
    { icon:'🎮', en:'Video Game', hi:'गेम खेलना', mr:'गेम खेळणे' },
    { icon:'🤸', en:'Exercise', hi:'व्यायाम', mr:'व्यायाम' },
    { icon:'🙌', en:'Done', hi:'हो गया', mr:'झाले' },
    { icon:'🔁', en:'Again', hi:'फिर से', mr:'पुन्हा' },
  ]},
  { id: 'places', label: { en:'Places', hi:'जगह', mr:'ठिकाणे' }, tiles: [
    { icon:'🏠', en:'Home', hi:'घर', mr:'घर' },
    { icon:'🏫', en:'School', hi:'स्कूल', mr:'शाळा' },
    { icon:'🏥', en:'Hospital', hi:'अस्पताल', mr:'रुग्णालय' },
    { icon:'🛒', en:'Market', hi:'बाज़ार', mr:'बाजार' },
    { icon:'🌳', en:'Park', hi:'पार्क', mr:'उद्यान' },
    { icon:'⛪', en:'Temple', hi:'मंदिर', mr:'मंदिर' },
    { icon:'🚗', en:'Car', hi:'गाड़ी', mr:'गाडी' },
    { icon:'🚌', en:'Bus', hi:'बस', mr:'बस' },
    { icon:'🍕', en:'Restaurant', hi:'रेस्तरां', mr:'हॉटेल' },
    { icon:'📚', en:'Library', hi:'पुस्तकालय', mr:'ग्रंथालय' },
    { icon:'🏊', en:'Pool', hi:'तालाब', mr:'तलाव' },
    { icon:'🎠', en:'Playground', hi:'खेल का मैदान', mr:'खेळाचे मैदान' },
  ]},
  { id: 'people', label: { en:'People', hi:'लोग', mr:'लोक' }, tiles: [
    { icon:'👩', en:'Mama', hi:'माँ', mr:'आई' },
    { icon:'👨', en:'Papa', hi:'पापा', mr:'बाबा' },
    { icon:'👴', en:'Grandpa', hi:'दादा', mr:'आजोबा' },
    { icon:'👵', en:'Grandma', hi:'दादी', mr:'आजी' },
    { icon:'👦', en:'Brother', hi:'भाई', mr:'भाऊ' },
    { icon:'👧', en:'Sister', hi:'बहन', mr:'बहीण' },
    { icon:'👨‍⚕️', en:'Doctor', hi:'डॉक्टर', mr:'डॉक्टर' },
    { icon:'👩‍🏫', en:'Teacher', hi:'शिक्षक', mr:'शिक्षक' },
    { icon:'👫', en:'Friend', hi:'दोस्त', mr:'मित्र' },
    { icon:'👶', en:'Baby', hi:'बच्चा', mr:'बाळ' },
    { icon:'🧑', en:'Me', hi:'मैं', mr:'मी' },
    { icon:'👨‍👩‍👧', en:'Family', hi:'परिवार', mr:'कुटुंब' },
  ]},
  { id: 'body', label: { en:'Body', hi:'शरीर', mr:'शरीर' }, tiles: [
    { icon:'🤕', en:'Head Hurts', hi:'सिर दर्द', mr:'डोके दुखते' },
    { icon:'👂', en:'Ear', hi:'कान', mr:'कान' },
    { icon:'👁️', en:'Eye', hi:'आँख', mr:'डोळा' },
    { icon:'👃', en:'Nose', hi:'नाक', mr:'नाक' },
    { icon:'👄', en:'Mouth', hi:'मुँह', mr:'तोंड' },
    { icon:'🦷', en:'Tooth', hi:'दाँत', mr:'दात' },
    { icon:'🤢', en:'Stomach Ache', hi:'पेट दर्द', mr:'पोट दुखते' },
    { icon:'🦵', en:'Leg Hurts', hi:'पैर दर्द', mr:'पाय दुखतो' },
    { icon:'✋', en:'Hand', hi:'हाथ', mr:'हात' },
    { icon:'💊', en:'Need Medicine', hi:'दवाई चाहिए', mr:'औषध हवे' },
    { icon:'🩹', en:'Bandage', hi:'पट्टी', mr:'पट्टी' },
    { icon:'🥵', en:'Fever', hi:'बुखार', mr:'ताप' },
  ]},
]

export default function AACBoard() {
  const [lang, setLang] = useState('en')
  const [theme, setTheme] = useState('calm')
  const [activeCat, setActiveCat] = useState('greetings')
  const [sentence, setSentence] = useState([])
  const [volume, setVolume] = useState(1)
  const [speed, setSpeed] = useState(0.9)
  const [speaking, setSpeaking] = useState(false)
  const t = THEMES[theme]

  const speak = (text, langCode) => {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices()
    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' }
    const targetLang = langMap[langCode || lang]
    // Try exact match first, then fallback to hi-IN for Marathi (same script)
    let voice = voices.find(v => v.lang === targetLang)
    if (!voice && targetLang === 'mr-IN') voice = voices.find(v => v.lang === 'hi-IN')
    if (!voice) voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]))
    if (voice) utt.voice = voice
    utt.lang = targetLang
    utt.volume = volume
    utt.rate = speed
    utt.onstart = () => setSpeaking(true)
    utt.onend = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }

  const tileClick = (tile) => {
    const label = tile[lang] || tile.en
    speak(label)
    setSentence(s => [...s, { label, icon: tile.icon }])
  }

  const speakSentence = () => {
    if (sentence.length === 0) return
    speak(sentence.map(s => s.label).join(' '))
  }

  const currentCat = CATEGORIES.find(c => c.id === activeCat)

  return (
    <div style={{ background: t.bg, minHeight: '100vh', transition: 'background 0.5s ease' }}>
      {/* Top bar */}
      <div className="glass sticky top-0 z-50 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow"
                style={{background: t.accent}}>A</Link>
              <div>
                <div className="font-black text-lg leading-none" style={{color: t.accent}}>AAC Board</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Free</span>
                  <span className="text-xs text-gray-400 font-semibold">No login needed</span>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 uppercase">Lang</span>
              <div className="flex gap-1">
                {['en','hi','mr'].map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className="px-3 py-1 rounded-lg text-xs font-black border-2 transition-all"
                    style={{
                      borderColor: lang===l ? t.accent : '#e5e7eb',
                      background: lang===l ? t.accent : 'rgba(255,255,255,0.6)',
                      color: lang===l ? 'white' : '#64748b'
                    }}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood themes */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 uppercase">Mood</span>
              <div className="flex gap-1.5 items-center">
                {Object.entries(THEMES).map(([key, th]) => (
                  <button key={key} onClick={() => setTheme(key)} title={th.label}
                    className="w-6 h-6 rounded-full border-3 transition-all"
                    style={{
                      background: th.dot,
                      borderColor: theme===key ? 'white' : 'transparent',
                      transform: theme===key ? 'scale(1.25)' : 'scale(1)',
                      boxShadow: theme===key ? `0 0 0 2px ${th.dot}` : 'none',
                      border: `3px solid ${theme===key ? 'white' : 'transparent'}`
                    }} />
                ))}
              </div>
            </div>

            {/* Volume + Speed */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <input type="range" min="0" max="1" step="0.1" value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-2 rounded-full cursor-pointer"
                  style={{accentColor: t.accent}}/>
              </div>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-gray-500" />
                <input type="range" min="0.5" max="1.5" step="0.1" value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="w-20 h-2 rounded-full cursor-pointer"
                  style={{accentColor: t.accent}}/>
              </div>
              <Link to="/login" className="text-xs font-black px-3 py-1.5 rounded-xl text-white flex items-center gap-1 shadow"
                style={{background: t.accent}}>
                <LogIn className="w-3 h-3" /> Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Sentence Builder */}
        <div className="glass rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareText className="w-5 h-5 flex-shrink-0" style={{color: t.accent}} />
            <span className="font-black text-sm text-gray-700">Sentence Builder</span>
            <span className="text-xs font-semibold text-gray-400">— tap tiles to add words</span>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 min-h-10 mb-3 items-center">
            {sentence.length === 0 ? (
              <span className="text-gray-300 text-sm font-semibold italic">Tap tiles below to build a sentence...</span>
            ) : sentence.map((item, i) => (
              <button key={i} onClick={() => setSentence(s => s.filter((_,j) => j!==i))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border-2 transition-all hover:text-white"
                style={{borderColor: t.accent, color: t.accent, background: `${t.accent}15`}}
                onMouseEnter={e => { e.currentTarget.style.background = t.accent; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = `${t.accent}15`; e.currentTarget.style.color = t.accent }}>
                <span>{item.icon}</span><span>{item.label}</span>
                <span className="opacity-60 text-xs">✕</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={speakSentence} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-black text-sm shadow"
              style={{background: t.accent}}>
              <Volume2 className="w-4 h-4" /> Speak All
            </button>
            <button onClick={() => setSentence(s => s.slice(0,-1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm border-2 hover:bg-white/60 transition-all"
              style={{borderColor: t.accent, color: t.accent}}>
              <Undo2 className="w-4 h-4" /> Undo
            </button>
            <button onClick={() => setSentence([])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm border-2 border-red-300 text-red-400 hover:bg-red-50 transition-all">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
            {speaking && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-100 text-green-700 font-black text-xs">
                <Waves className="w-4 h-4" /> Speaking...
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{scrollbarWidth:'thin'}}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className="whitespace-nowrap px-4 py-2 rounded-2xl font-black text-sm transition-all border-2 flex-shrink-0"
              style={{
                background: activeCat===cat.id ? t.accent : 'rgba(255,255,255,0.6)',
                color: activeCat===cat.id ? 'white' : '#64748b',
                borderColor: activeCat===cat.id ? t.accent : 'transparent',
                boxShadow: activeCat===cat.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
              }}>
              {cat.label[lang] || cat.label.en}
            </button>
          ))}
        </div>

        {/* Tiles */}
        {currentCat && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {currentCat.tiles.map((tile, i) => (
              <button key={i} onClick={() => tileClick(tile)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 min-h-24 rounded-2xl border-2 transition-all text-center select-none"
                style={{
                  background: t.tile,
                  borderColor: 'rgba(255,255,255,0.8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.07)'; e.currentTarget.style.borderColor=t.accent; e.currentTarget.style.boxShadow=`0 10px 28px rgba(0,0,0,0.13)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.8)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)' }}
                onMouseDown={e => { e.currentTarget.style.transform='scale(0.95)' }}
                onMouseUp={e => { e.currentTarget.style.transform='scale(1.07)' }}>
                <span className="text-3xl leading-none">{tile.icon}</span>
                <span className="font-black text-xs leading-tight text-gray-700">{tile[lang] || tile.en}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}