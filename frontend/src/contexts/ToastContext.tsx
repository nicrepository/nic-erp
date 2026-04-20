import { createContext, useContext, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  showToast: (options: Omit<Toast, "id">) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastStyles: Record<ToastType, { container: string; icon: ReactNode }> = {
  success: {
    container: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />,
  },
  error: {
    container: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    icon: <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
  },
  warning: {
    container: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500",
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />,
  },
  info: {
    container: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(({ type, title, message, duration = 4000 }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message, duration }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const success = useCallback((title: string, message?: string) => showToast({ type: "success", title, message }), [showToast])
  const error = useCallback((title: string, message?: string) => showToast({ type: "error", title, message, duration: 6000 }), [showToast])
  const warning = useCallback((title: string, message?: string) => showToast({ type: "warning", title, message, duration: 5000 }), [showToast])
  const info = useCallback((title: string, message?: string) => showToast({ type: "info", title, message }), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Container fixo de toasts */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-label="Notificações"
      >
        {toasts.map(toast => {
          const style = toastStyles[toast.type]
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 ${style.container}`}
              role="alert"
            >
              {style.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs mt-0.5 opacity-80 leading-snug">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider")
  return ctx
}
