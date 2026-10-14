import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { MapPin, Upload, X, Loader2, CheckCircle2, Navigation, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useGeolocation } from '../../hooks/useGeolocation'
import { createIssue } from '../../services/issuesService'
import { demoCreateIssue } from '../../lib/demo'
import { supabaseConfigured } from '../../lib/supabase'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../../utils/helpers'
import type { IssueCategory } from '../../lib/database.types'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [IssueCategory, string][]

// Default demo location (Bengaluru city centre) used when geo is unavailable
const DEMO_DEFAULT_LAT = 12.9716
const DEMO_DEFAULT_LNG = 77.5946
const DEMO_DEFAULT_ADDR = 'Bengaluru City Centre (demo location)'

export function ReportIssuePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const geo = useGeolocation()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory | '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  })

  const handleCaptureLocation = async () => {
    try {
      await geo.getLocation()
      toast.success('Location captured!')
    } catch {
      toast.error(geo.error ?? 'Could not get location')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return toast.error('Please sign in to report an issue')
    if (!form.category) return toast.error('Please select a category')
    if (!form.title.trim()) return toast.error('Please enter a title')
    if (!form.description.trim()) return toast.error('Please enter a description')

    const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))

    // ── Demo mode ────────────────────────────────────────────────────────────
    if (isDemo) {
      // Use captured geo or fall back to demo default so presenters are never blocked
      const lat = geo.latitude ?? DEMO_DEFAULT_LAT
      const lng = geo.longitude ?? DEMO_DEFAULT_LNG
      const addr = geo.address ?? (geo.latitude ? null : DEMO_DEFAULT_ADDR)

      setSubmitting(true)
      try {
        const issue = demoCreateIssue(
          {
            title: form.title,
            description: form.description,
            category: form.category as IssueCategory,
            latitude: lat,
            longitude: lng,
            address: addr,
            photo,
            reporter_id: profile.id,
          },
          profile
        )
        setSubmittedId(issue.id)
        toast.success(`Issue reported! ID: ${issue.id}`)
      } catch (err: any) {
        toast.error(err.message ?? 'Failed to submit report')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // ── Supabase mode ────────────────────────────────────────────────────────
    if (!geo.latitude || !geo.longitude) return toast.error('Please capture your location first')

    setSubmitting(true)
    try {
      await createIssue({
        title: form.title,
        description: form.description,
        category: form.category as IssueCategory,
        latitude: geo.latitude,
        longitude: geo.longitude,
        address: geo.address,
        photo,
        reporter_id: profile.id,
      })
      setSubmittedId('submitted')
      toast.success('Issue reported successfully!')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Issue Reported!</h2>

        {/* Complaint ID badge */}
        {submittedId !== 'submitted' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-5">
            <Hash size={14} className="text-blue-400" />
            <span className="text-sm font-mono font-bold text-blue-300">
              Complaint ID: {submittedId}
            </span>
          </div>
        )}

        <p className="text-slate-400 mb-8 leading-relaxed">
          Your report has been submitted. Authorities will review and prioritize it shortly.
          You can track its progress from your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
          >
            View My Reports
          </button>
          <button
            onClick={() => {
              setSubmittedId(null)
              setForm({ title: '', description: '', category: '' })
              setPhoto(null)
              setPhotoPreview(null)
            }}
            className="px-6 py-3 glass border border-white/20 text-white font-semibold rounded-xl transition-all hover:border-white/40"
          >
            Report Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Report a Civic Issue</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Fill in the details below.
          {!supabaseConfigured && ' Location is optional in demo mode — a default will be used.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div className="glass rounded-2xl p-5 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3">Issue Category *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: key }))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                  form.category === key
                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-xl">{CATEGORY_ICONS[key]}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title + Description */}
        <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Large pothole on MG Road near bus stop"
              required
              maxLength={120}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the problem in detail — size, severity, how long it's been there, etc."
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div className="glass rounded-2xl p-5 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3">Photo Evidence <span className="text-slate-500 font-normal">(optional)</span></label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                className="absolute top-2 right-2 w-8 h-8 bg-slate-900/80 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-slate-900/80 text-xs text-slate-300">
                {photo?.name}
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={28} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {isDragActive ? 'Drop photo here...' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-600 mt-1">PNG, JPG up to 10MB{!supabaseConfigured ? ' · stored locally in demo mode' : ''}</p>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="glass rounded-2xl p-5 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3">
            Location {supabaseConfigured ? '*' : <span className="text-slate-500 font-normal">(optional — default used if unavailable)</span>}
          </label>

          {geo.latitude && geo.longitude ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <MapPin size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-300">Location captured!</p>
                <p className="text-xs text-slate-400 mt-0.5 break-words">
                  {geo.address ?? `${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  📍 {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCaptureLocation}
                className="text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={geo.loading}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {geo.loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Navigation size={16} />
                )}
                {geo.loading ? 'Getting your location...' : 'Capture My Location'}
              </button>
              {!supabaseConfigured && (
                <p className="text-xs text-amber-400/70 mt-2 text-center">
                  Demo mode: if you skip this, a default Bengaluru location will be used.
                </p>
              )}
            </>
          )}
          {geo.error && <p className="text-xs text-rose-400 mt-2">{geo.error}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-base"
        >
          {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}
