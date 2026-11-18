import { readFile, writeFile } from "node:fs/promises"

export const LOGIN = "JakubKarwacki"

export type ContributionDay = { date: string; count: number }

type GraphQLResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: number
          weeks?: { contributionDays?: { date?: string; contributionCount?: number }[] }[]
        }
      }
    } | null
  }
  errors?: { message: string }[]
}

export const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`

/** GraphQL calendar → flat, date-sorted `[{ date, count }]`. Throws when the shape is not a calendar. */
export function toContributions(res: GraphQLResponse): ContributionDay[] {
  if (res.errors?.length) throw new Error(res.errors.map((e) => e.message).join("; "))
  const weeks = res.data?.user?.contributionsCollection?.contributionCalendar?.weeks
  if (!Array.isArray(weeks)) throw new Error("Unexpected GraphQL response: no contribution calendar")
  const out: ContributionDay[] = []
  for (const w of weeks) {
    for (const d of w.contributionDays ?? []) {
      if (typeof d.date === "string" && typeof d.contributionCount === "number") {
        out.push({ date: d.date, count: d.contributionCount })
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

async function main() {
  const out = new URL("../public/contributions.json", import.meta.url)
  const meta = new URL("../public/contributions.meta.json", import.meta.url)
  const token = process.env.GITHUB_TOKEN
  try {
    if (!token) throw new Error("GITHUB_TOKEN is not set")
    const r = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "fetch-contributions" },
      body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
    })
    if (!r.ok) throw new Error(`GitHub API responded ${r.status}`)
    const days = toContributions((await r.json()) as GraphQLResponse)
    if (!days.length) throw new Error("Empty contribution calendar")
    await writeFile(out, JSON.stringify(days) + "\n")
    await writeFile(meta, JSON.stringify({ generatedAt: new Date().toISOString(), days: days.length }) + "\n")
    console.log(`Wrote ${days.length} days to public/contributions.json`)
  } catch (e) {
    const had = await readFile(out).then(() => true, () => false)
    console.warn(`::warning::fetch-contributions failed (${e instanceof Error ? e.message : String(e)}); ${had ? "keeping existing file" : "no existing file"}`)
  }
}

if (import.meta.main) await main()
