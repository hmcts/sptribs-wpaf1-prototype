import { describe, expect, it } from "vitest";
import { appealTimeliness, needsLateExplanation, timeLimit } from "./deadline.js";
import { emptyDraft } from "./types.js";

/**
 * Rule 21's three windows, tested either side of both boundaries.
 *
 * The boundaries are the whole point of this module: a day out at 12 months sends somebody
 * to the late-appeal page who did not need to go there, and a day out at 24 months tells
 * somebody the tribunal cannot help them when it still can. Both are inclusive — the last
 * day of a window is still a day inside it.
 */

const on = (day: string, month: string, year: string) => ({ day, month, year });

function draftOn(decisionLetterDate?: { day: string; month: string; year: string }) {
  const draft = emptyDraft();
  draft.decision = { decisionLetterDate };
  return draft;
}

describe("timeLimit", () => {
  it("should say nothing until a date has been given", () => {
    expect(timeLimit(emptyDraft())).toEqual({ timeliness: "unknown" });
  });

  it("should give 12 months to appeal and 24 before the bar falls", () => {
    const limit = timeLimit(draftOn(on("1", "2", "2026")), new Date(2026, 2, 1));

    expect(limit.deadline).toBe("2027-02-01");
    expect(limit.finalDeadline).toBe("2028-02-01");
    expect(limit.timeliness).toBe("inTime");
  });

  it("should ignore a half-typed date", () => {
    expect(timeLimit(draftOn({ day: "1", month: "", year: "2026" })).deadline).toBeUndefined();
  });

  it("should clamp to the end of the month rather than overflowing into the next one", () => {
    // 29 February plus 12 months is 28 February, not 1 March. Somebody counting a year
    // from a leap day does not arrive in March.
    const limit = timeLimit(draftOn(on("29", "2", "2024")), new Date(2024, 2, 1));

    expect(limit.deadline).toBe("2025-02-28");
    expect(limit.finalDeadline).toBe("2026-02-28");
  });
});

describe("appealTimeliness", () => {
  const draft = draftOn(on("1", "2", "2026"));

  it("should be in time the day before the 12-month deadline", () => {
    expect(appealTimeliness(draft, new Date(2027, 0, 31))).toBe("inTime");
  });

  it("should still be in time on the 12-month deadline itself", () => {
    expect(appealTimeliness(draft, new Date(2027, 1, 1))).toBe("inTime");
  });

  it("should be late the day after the 12-month deadline", () => {
    expect(appealTimeliness(draft, new Date(2027, 1, 2))).toBe("late");
  });

  it("should still only be late the day before the 24-month bar", () => {
    expect(appealTimeliness(draft, new Date(2028, 0, 31))).toBe("late");
  });

  it("should still only be late on the 24-month bar itself", () => {
    // Rule 21(4) bars an appeal made *more than* 12 months after the end of the first
    // 12 months, so the last day of the second year is still inside it.
    expect(appealTimeliness(draft, new Date(2028, 1, 1))).toBe("late");
  });

  it("should be beyond the tribunal's power to extend the day after the 24-month bar", () => {
    expect(appealTimeliness(draft, new Date(2028, 1, 2))).toBe("beyondExtension");
  });

  it("should be unknown until a decision date is given", () => {
    expect(appealTimeliness(emptyDraft())).toBe("unknown");
  });
});

describe("needsLateExplanation", () => {
  const draft = draftOn(on("1", "2", "2026"));

  it("should not be asked for while the appeal is in time", () => {
    expect(needsLateExplanation(draft, new Date(2027, 1, 1))).toBe(false);
  });

  it("should be asked for once the appeal is late", () => {
    expect(needsLateExplanation(draft, new Date(2027, 1, 2))).toBe(true);
  });

  it("should still be asked for past the 24-month bar", () => {
    // Past the bar the tribunal cannot extend the limit, but it still decides whether to
    // admit the appeal, and the reasons are what it decides on. Warning without collecting
    // them would leave the citizen's only argument unsaid.
    expect(needsLateExplanation(draft, new Date(2030, 0, 1))).toBe(true);
  });
});
