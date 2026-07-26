import { useEffect, useState } from "react"

declare global {
  const __APP_GIT_SHA__: string
  const __APP_GIT_BRANCH__: string
  const __APP_BUILD_TIME__: string
}

export function DevBuildBadge() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (import.meta.env.DEV) {
      console.log("[FriggaFrio Build]", {
        branch: __APP_GIT_BRANCH__,
        sha: __APP_GIT_SHA__,
        startedAt: __APP_BUILD_TIME__,
        mode: import.meta.env.MODE,
      })
    }
  }, [])

  if (!import.meta.env.DEV || !mounted) return null

  return (
    <div className="fixed bottom-2 left-2 z-[9999] bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded font-mono shadow border border-slate-700/50 backdrop-blur-sm pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
      DEV &middot; {__APP_GIT_BRANCH__} &middot; {__APP_GIT_SHA__}
    </div>
  )
}
