import type { Request, Response } from "express";
import { draftFrom, replaceSection } from "#appeal";
import { requireRole } from "#oidc";
import { cy, en } from "./documents-checklist.i18n.js";

/**
 * The documents checklist from WPAF1 question 1.1.
 *
 * Not part of the case data. It exists so the appeal arrives with what the tribunal
 * needs; what actually arrives is recorded by the tribunal, not asserted here.
 *
 * Only the decision letter is enforced, and it is normally already ticked: the gate asks
 * for it before the hub, because an appeal without the decision it is against cannot be
 * registered. The list of additional evidence is conditional on there being any.
 */
const BACK = "/appeal/task-list";
const NEXT = "/appeal/supporting-evidence";

const getHandler = (req: Request, res: Response) => {
  const checklist = draftFrom(req).documentsChecklist;
  render(res, ticked(checklist), {});
};

const postHandler = async (req: Request, res: Response) => {
  const selected = toArray(req.body.documents);

  if (!selected.includes("decisionLetter")) {
    return render(res, selected, { documents: "documentsDecisionLetterRequired" });
  }

  await replaceSection(req, "documentsChecklist", {
    decisionLetter: selected.includes("decisionLetter"),
    evidenceList: selected.includes("evidenceList")
  });
  res.redirect(302, NEXT);
};

/** One ticked checkbox posts a string; several post an array. Normalise before reading. */
const toArray = (value: unknown): string[] => (value === undefined ? [] : Array.isArray(value) ? value.map(String) : [String(value)]);

const ticked = (checklist: { decisionLetter?: boolean; evidenceList?: boolean }): string[] =>
  Object.entries(checklist)
    .filter(([, on]) => on)
    .map(([key]) => key);

function render(res: Response, documents: string[], errors: Record<string, string>): void {
  res.render("documents-checklist", { en, cy, values: { documents }, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
