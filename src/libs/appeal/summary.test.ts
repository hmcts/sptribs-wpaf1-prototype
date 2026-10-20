import { describe, expect, it } from "vitest";
import { summarise } from "./summary.js";
import { type AppealDraft, emptyDraft } from "./types.js";

/**
 * Check-your-answers is where a citizen decides whether what they are about to send is
 * right, so the rule these tests hold is: they must see back exactly what they said, in
 * the words they chose it by. A row showing a stored code, or an answer silently missing,
 * is a citizen signing a declaration about something they cannot read.
 */

const rows = (draft: AppealDraft) => summarise(draft).flatMap((section) => section.rows);
const find = (draft: AppealDraft, key: string) => rows(draft).find((row) => row.key === key);

function appealDraft(): AppealDraft {
  const draft = emptyDraft();
  draft.appellant = {
    livesIn: "wales",
    title: "Mr",
    firstName: "Gareth",
    lastName: "Price",
    dateOfBirth: { day: "7", month: "3", year: "1972" },
    nationalInsuranceNumber: "QQ123456C",
    address: { addressLine1: "12 Fern Road", townOrCity: "Cardiff", postcode: "CF10 1AA" },
    serviceStatus: "leftService"
  };
  draft.decision = { scheme: "warPension", decisionLetterDate: { day: "1", month: "2", year: "2026" }, appealAbout: ["awardLevel"] };
  draft.declaration = { capacity: "self" };
  return draft;
}

describe("summarise", () => {
  it("should show a radio answer as the words the citizen chose, not the stored code", () => {
    expect(find(appealDraft(), "Where the appellant lives")?.value).toBe("Wales");
    expect(find(appealDraft(), "Service status")?.value).toBe("Left service");
    expect(find(appealDraft(), "Who is appealing")?.value).toBe("I am the appellant");
  });

  it("should show a code with no label as the code, rather than as blank", () => {
    // A missing label is a bug. Rendering it as an empty row hides the bug and tells the
    // citizen they answered nothing; rendering the code is ugly and visible, which is what
    // is wanted.
    const draft = appealDraft();
    draft.appellant.livesIn = "isleOfMan" as never;

    expect(find(draft, "Where the appellant lives")?.value).toBe("isleOfMan");
  });

  it("should show a date as a person would write it", () => {
    expect(find(appealDraft(), "Date of birth")?.value).toBe("7 March 1972");
    expect(find(appealDraft(), "Date on the decision letter")?.value).toBe("1 February 2026");
  });

  it("should show an address as separate lines, skipping the ones left blank", () => {
    expect(find(appealDraft(), "Address")?.value).toBe("12 Fern Road\nCardiff\nCF10 1AA");
  });

  it("should say 'Not answered' rather than leave a gap", () => {
    expect(find(emptyDraft(), "Name")?.value).toBe("Not answered");
  });

  it("should join a multi-select answer one option per line", () => {
    const draft = appealDraft();
    draft.decision.appealAbout = ["awardStartDate", "label"];

    expect(find(draft, "What you are appealing about")?.value).toBe("The date an award starts\nThe label — the medical name given for a claimed condition");
  });

  it("should give every row a change link that says what it changes", () => {
    // "Change" on its own is meaningless to anybody using a screen reader to move between
    // links, which is why the Design System asks for the visually hidden suffix.
    for (const row of rows(appealDraft())) {
      expect(row.href, `${row.key} has no change link`).toMatch(/^\/appeal\/[a-z-]+$/);
      expect(row.changes, `${row.key}'s change link does not say what it changes`).toBeTruthy();
    }
  });

  it("should let the gate's answers be changed, not only read", () => {
    // Where they live, which scheme and the decision date are asked before the hub, so
    // without a change link here the only way to correct a mistyped date is to start again.
    expect(find(appealDraft(), "Where the appellant lives")?.href).toBe("/appeal/where-do-you-live");
    expect(find(appealDraft(), "The scheme the decision was made under")?.href).toBe("/appeal/which-scheme");
    expect(find(appealDraft(), "Date on the decision letter")?.href).toBe("/appeal/decision-date");
  });

  it("should not show rows for questions this appeal never reaches", () => {
    // Somebody who has left the service has no proposed discharge date, so the row must
    // not appear at all — showing it as "Not answered" would read as an omission.
    const keys = rows(appealDraft()).map((row) => row.key);

    expect(keys).not.toContain("Proposed discharge date");
  });

  it("should reveal the follow-up rows only once the answer that leads to them is given", () => {
    const draft = appealDraft();
    expect(rows(draft).map((row) => row.key)).not.toContain("Their name");

    draft.representative = { hasRepresentative: "Yes", firstName: "Ada", lastName: "Nwosu" };
    expect(find(draft, "Their name")?.value).toBe("Ada Nwosu");
  });

  it("should not ask a War Pensions appellant about an AFCS reconsideration", () => {
    // Section 6 is AFCS only. A War Pensions appellant never sees the question, so a row
    // for it would be a question they are being marked down for not answering.
    expect(rows(appealDraft()).map((row) => row.key)).not.toContain("Asked for a reconsideration");

    const afcs = appealDraft();
    afcs.decision.scheme = "afcs";
    afcs.reconsideration = { askedForReconsideration: "No" };
    expect(find(afcs, "Asked for a reconsideration")?.value).toBe("No");
  });

  it("should ask about a late appeal only when the decision date says it is late", () => {
    expect(rows(appealDraft()).map((row) => row.key)).not.toContain("Why the appeal is late");

    const late = appealDraft();
    late.decision.decisionLetterDate = { day: "1", month: "1", year: "2010" };
    late.timeliness = { lateAppealExplanation: "I was in hospital." };

    expect(find(late, "Why the appeal is late")?.value).toBe("I was in hospital.");
  });

  it("should list the documents being sent, and say when no evidence was added", () => {
    const draft = appealDraft();
    draft.documentsChecklist = { decisionLetter: true, evidenceList: true };

    expect(find(draft, "Documents you are sending")?.value).toBe("A copy of the decision letter\nA list of the additional evidence being sent");
    expect(find(draft, "Supporting evidence")?.value).toBe("None added");
  });

  it("should list the evidence that was added", () => {
    const draft = appealDraft();
    draft.supportingEvidence = [{ evidenceDescription: "A consultant's report" }, { evidenceDescription: "My service record" }];

    expect(find(draft, "Supporting evidence")?.value).toBe("A consultant's report\nMy service record");
  });

  it("should keep a section down to only the rows that apply", () => {
    // "The appellant's representative" always has the first question, but with no
    // representative the eight rows that follow it do not apply — so the section survives
    // with one row rather than nine.
    const draft = appealDraft();
    draft.representative = { hasRepresentative: "No" };
    const section = summarise(draft).find((candidate) => candidate.title === "The appellant's representative");

    expect(section?.rows.map((row) => row.key)).toEqual(["There is a representative"]);
  });
});
