import { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

// --- CONFIG ---
const API_URL = 'http://36.255.70.199:3000'

interface Job {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  error?: string
}

function App() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobState, setJobState] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)

  // Polling Logic (The Frontend side of Challenge 2)
  useEffect(() => {
    if (!activeJobId || jobState?.status === 'completed' || jobState?.status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/v1/download/status/${activeJobId}`)
        setJobState(res.data)
      } catch (err) {
        console.error("Polling failed", err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [activeJobId, jobState?.status])

  const startDownload = async () => {
    setLoading(true)
    setJobState(null)
    try {
      // 1. Initiate (Async)
      const res = await axios.post(`${API_URL}/v1/download/initiate`, {
        file_ids: [10001, 10002]
      })
      // const res = await axios.get(`${API_URL}/health`)
      setActiveJobId(res.data.jobId)
      setJobState({ ...res.data, progress: 0 })
    } catch (err) {
      alert("Failed to start download. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 border-b border-slate-700 pb-5">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="text-blue-400" />
            Delineate Mission Control
          </h1>
          <p className="text-slate-400 mt-2">Micro-Ops Hackathon Challenge 2025</p>
        </header>

        {/* --- ACTION CARD --- */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Long-Running Process Simulator</h2>
          
          {!activeJobId ? (
            <button 
              onClick={startDownload}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
              Initiate 120s Download
            </button>
          ) : (
            <div className="space-y-6">
              {/* STATUS INDICATOR */}
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg">
                <span className="text-slate-400">Job ID: <code className="text-yellow-400">{activeJobId.slice(0,8)}...</code></span>
                <Badge status={jobState?.status || 'queued'} />
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{jobState?.progress}%</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${jobState?.progress}%` }} 
                  />
                </div>
              </div>

              {/* RESULT */}
              {jobState?.status === 'completed' && (
                <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" />
                    <div>
                      <p className="font-semibold text-green-400">Processing Complete</p>
                      <p className="text-sm text-green-300/70">File uploaded to MinIO Storage</p>
                    </div>
                  </div>
                  <a 
                    href={jobState.downloadUrl} 
                    target="_blank"
                    className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-medium"
                  >
                    Download File
                  </a>
                </div>
              )}
              
              {jobState?.status === 'failed' && (
                 <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="text-red-400" />
                    <p className="text-red-300">Error: {jobState.error}</p>
                 </div>
              )}

              {/* RESET BUTTON */}
              {(jobState?.status === 'completed' || jobState?.status === 'failed') && (
                <button 
                  onClick={() => setActiveJobId(null)}
                  className="text-slate-400 hover:text-white text-sm underline"
                >
                  Start New Test
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const colors = {
    queued: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400'
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  )
}

export default App