import { describe, expect, it } from "vitest"
import { buildGrid, computeStats, dayMs, levelOf, DAY_MS } from "./contribution-skyline"

describe("dayMs", () => {
  it("parses YYYY-MM-DD as UTC midnight", () => {
    expect(dayMs("2026-01-01")).toBe(Date.UTC(2026, 0, 1))
  })
})

describe("levelOf", () => {
  it("maps counts to 0-4", () => {
    expect(levelOf(0, 10)).toBe(0)
    expect(levelOf(1, 10)).toBe(1)
    expect(levelOf(5, 10)).toBe(3)
    expect(levelOf(10, 10)).toBe(4)
    expect(levelOf(99, 10)).toBe(4)
    expect(levelOf(3, 0)).toBe(4)
  })
})

describe("buildGrid", () => {
  const end = Date.UTC(2026, 5, 15) // Monday
  const g = buildGrid([{ date: "2026-06-15", count: 4 }, { date: "2026-06-15", count: 1 }, { date: "2026-06-14", count: 0 }, { date: "bad", count: 3 }], end)
  it("ends on endMs, starts on a Sunday, covers whole weeks", () => {
    expect(g.cells.at(-1)?.date).toBe("2026-06-15")
    expect(new Date(dayMs(g.cells[0].date)).getUTCDay()).toBe(0)
    expect(g.weeks).toBe(Math.floor((g.cells.length - 1) / 7) + 1)
    expect(dayMs(g.cells.at(-1)!.date) - dayMs(g.cells[0].date)).toBeGreaterThanOrEqual(364 * DAY_MS)
  })
  it("sums repeated dates and ignores invalid ones", () => {
    expect(g.cells.at(-1)?.count).toBe(5)
    expect(g.max).toBe(5)
  })
})

describe("computeStats", () => {
  it("computes total, busiest and streaks", () => {
    const g = buildGrid(
      [{ date: "2026-06-11", count: 1 }, { date: "2026-06-12", count: 2 }, { date: "2026-06-14", count: 7 }, { date: "2026-06-15", count: 1 }],
      Date.UTC(2026, 5, 15),
    )
    const s = computeStats(g.cells)
    expect(s.total).toBe(11)
    expect(s.busiest).toEqual({ count: 7, date: "2026-06-14" })
    expect(s.longest).toEqual({ days: 2, start: "2026-06-11", end: "2026-06-12" })
    expect(s.current).toEqual({ days: 2, start: "2026-06-14", end: "2026-06-15" })
  })
  it("handles empty input", () => {
    expect(computeStats([]).total).toBe(0)
  })
})
