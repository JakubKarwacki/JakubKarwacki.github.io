import { useEffect, useMemo, useState } from "react"
import ContributionSkyline, { type ContributionDay } from "@/components/ui/contribution-skyline"

const DURATION = 1300
const READY_DELAY = DURATION + 500

type Params = { embed: boolean; theme: "dark" | "light" | null; view: "2d" | "3d" }

function readParams(): Params {
  const q = new URLSearchParams(window.location.search)
  const theme = q.get("theme")
  const view = q.get("view")
  return {
    embed: q.get("embed") === "1",
    theme: theme === "dark" || theme === "light" ? theme : null,
    view: view === "2d" ? "2d" : "3d",
  }
}

function useContributions() {
  const [state, setState] = useState<{ done: boolean; data?: ContributionDay[] }>({ done: false })
  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`${import.meta.env.BASE_URL}contributions.json`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: unknown) => setState({ done: true, data: Array.isArray(d) ? (d as ContributionDay[]) : undefined }))
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) {
          console.warn("contributions.json unavailable, showing sample data", e)
          setState({ done: true })
        }
      })
    return () => ctrl.abort()
  }, [])
  return state
}

function latestDate(data?: ContributionDay[]): string | undefined {
  if (!data?.length) return undefined
  return data.reduce((m, d) => (d.date > m ? d.date : m), data[0].date)
}

export default function App() {
  const params = useMemo(() => readParams(), [])
  const { done, data } = useContributions()

  useEffect(() => {
    if (params.theme) {
      document.documentElement.classList.toggle("dark", params.theme === "dark")
      return
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => document.documentElement.classList.toggle("dark", mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [params.theme])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      document.documentElement.dataset.ready = "1"
    }, READY_DELAY)
    return () => clearTimeout(t)
  }, [done])

  const skyline = done ? (
    <ContributionSkyline
      data={data}
      endDate={latestDate(data)}
      defaultView={params.view}
      duration={DURATION}
      {...(params.embed ? { footer: null } : {})}
    />
  ) : (
    <div className="h-[420px] w-full animate-pulse rounded-xl border border-border bg-muted/40" aria-hidden="true" />
  )

  if (params.embed) {
    return (
      <main className="min-h-screen bg-background">
        <div style={{ width: 980 }}>{skyline}</div>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[980px] items-baseline justify-between px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Jakub Karwacki</h1>
        <a
          href="https://github.com/JakubKarwacki"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          github.com/JakubKarwacki
        </a>
      </header>
      <main className="mx-auto w-full max-w-[980px] flex-1 px-4 pb-12">{skyline}</main>
    </div>
  )
}
