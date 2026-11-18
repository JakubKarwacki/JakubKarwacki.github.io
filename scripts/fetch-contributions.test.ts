import { describe, expect, it } from "vitest"
import { toContributions } from "./fetch-contributions.ts"

const wrap = (weeks: unknown) => ({ data: { user: { contributionsCollection: { contributionCalendar: { weeks } } } } })

describe("toContributions", () => {
  it("flattens weeks into sorted {date,count}", () => {
    const res = wrap([
      { contributionDays: [{ date: "2026-01-03", contributionCount: 2 }, { date: "2026-01-02", contributionCount: 0 }] },
      { contributionDays: [{ date: "2026-01-04", contributionCount: 5 }] },
    ])
    expect(toContributions(res as never)).toEqual([
      { date: "2026-01-02", count: 0 },
      { date: "2026-01-03", count: 2 },
      { date: "2026-01-04", count: 5 },
    ])
  })
  it("skips malformed days", () => {
    const res = wrap([{ contributionDays: [{ date: "2026-01-02" }, { contributionCount: 1 }] }])
    expect(toContributions(res as never)).toEqual([])
  })
  it("throws on GraphQL errors and missing calendar", () => {
    expect(() => toContributions({ errors: [{ message: "bad" }] })).toThrow("bad")
    expect(() => toContributions({ data: { user: null } })).toThrow()
  })
})
