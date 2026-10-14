import { Link } from 'react-router-dom'
import { Shield, ChevronRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

const features = [
  {
    icon: '📍',
    title: 'Auto Location Capture',
    desc: 'Your GPS location is captured automatically — no manual address entry needed.',
  },
  {
    icon: '📸',
    title: 'Photo Evidence',
    desc: 'Upload a photo to give authorities clear visual context of the problem.',
  },
  {
    icon: '🔔',
    title: 'Real-time Tracking',
    desc: 'Get notified when your issue status changes from Pending → Resolved.',
  },
  {
    icon: '🗺️',
    title: 'Live Issue Map',
    desc: 'See all reported civic issues in your area on an interactive map.',
  },
  {
    icon: '⚡',
    title: 'Fast Assignment',
    desc: 'Authorities can instantly prioritize and assign issues to field teams.',
  },
  {
    icon: '📊',
    title: 'Authority Dashboard',
    desc: 'Full analytics dashboard for authorities to track resolution metrics.',
  },
]

const steps = [
  { icon: '👁️', label: 'Notice a problem', desc: 'Spot a pothole, broken light, or overflow' },
  { icon: '📱', label: 'Open CivicFix', desc: 'Open the app in any browser' },
  { icon: '📋', label: 'Report the issue', desc: 'Fill in type, description & photo' },
  { icon: '📍', label: 'Location captured', desc: 'GPS auto-captures coordinates' },
  { icon: '✅', label: 'Issue submitted', desc: 'Report goes live instantly' },
  { icon: '🏛️', label: 'Authority acts', desc: 'Team prioritizes and assigns' },
  { icon: '🔄', label: 'Status updates', desc: 'You receive live progress updates' },
  { icon: '🎉', label: 'Resolved!', desc: 'Problem fixed and confirmed' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Civic Issue Reporting Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            Fix Your City.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Together.
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            CivicFix connects citizens with authorities to resolve potholes, broken streetlights,
            drainage overflows, and other public infrastructure problems — fast.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5"
            >
              Report an Issue
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 glass border border-white/20 hover:border-white/40 text-white font-semibold rounded-2xl transition-all hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>

          {/* Live stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14">
            {[
              { icon: CheckCircle2, value: '2,847', label: 'Issues Resolved', color: 'text-emerald-400' },
              { icon: Clock, value: '4.2h', label: 'Avg Response Time', color: 'text-blue-400' },
              { icon: AlertTriangle, value: '128', label: 'Active Reports', color: 'text-amber-400' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center">
                <div className={`flex items-center justify-center gap-1.5 text-2xl font-bold ${color}`}>
                  <Icon size={20} />
                  {value}
                </div>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-950/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How CivicFix Works</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            From spotting a problem to seeing it fixed — the entire journey in 8 steps.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-full w-4 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent z-10" />
                )}
                <div className="glass rounded-2xl p-4 text-center border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1">
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <span className="inline-block text-xs font-bold text-blue-400 mb-1">Step {i + 1}</span>
                  <h3 className="text-sm font-semibold text-white mb-1">{step.label}</h3>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Built for Citizens & Authorities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/20 transition-all hover:-translate-y-1 group"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Issue categories */}
      <section className="py-20 px-4 bg-slate-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">What Can You Report?</h2>
          <p className="text-slate-400 mb-10">8 categories covering all common civic problems.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: '🕳️', label: 'Pothole' },
              { icon: '🛣️', label: 'Road Damage' },
              { icon: '🌊', label: 'Drainage' },
              { icon: '🗑️', label: 'Garbage' },
              { icon: '💡', label: 'Streetlight' },
              { icon: '💧', label: 'Water Leakage' },
              { icon: '🚶', label: 'Footpath' },
              { icon: '📋', label: 'Other' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2.5 glass rounded-full border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all cursor-default"
              >
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl border border-blue-500/20 p-10">
            <Shield size={40} className="text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to make your city better?</h2>
            <p className="text-slate-400 mb-8">
              Join thousands of citizens using CivicFix to report and track infrastructure issues.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50"
            >
              Get Started Free
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Shield size={12} className="text-white" />
          </div>
          <span className="font-bold text-white">Civic<span className="text-blue-400">Fix</span></span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} CivicFix. Empowering citizens, enabling authorities.
        </p>
      </footer>
    </div>
  )
}
