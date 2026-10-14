import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: number
  fullScreen?: boolean
  label?: string
}

export function LoadingSpinner({ size = 24, fullScreen = false, label }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 animate-pulse-slow">
          <Loader2 size={28} className="text-white animate-spin" />
        </div>
        {label && <p className="text-slate-400 text-sm mt-2">{label}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 size={size} className="text-blue-400 animate-spin" />
      {label && <span className="text-slate-400 text-sm">{label}</span>}
    </div>
  )
}
