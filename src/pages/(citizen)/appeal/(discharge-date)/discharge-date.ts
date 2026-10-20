import type { Request, Response } from "express";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { parseDayMonthYear } from "#zod-validation";
import { cy, en } from "./discharge-date.i18n.js";

/**
 * The appellant's proposed discharge date — WPAF1 question 1.4, "if known".
 *
 * An empty `required` key is what makes all three parts blank acceptable: a date that is
 * not known is not a date left out by mistake. A part-typed date is still rejected,
 * because that is a mistake.
 */
const BACK = "/appeal/service-status";
const NEXT = "/appeal/task-list";

/** The three parts as typed, kept as strings so a half-finished date survives a save. */
function dateParts(body: Record<string, unknown>, prefix: string) {
  return {
    day: String(body[`${prefix}-day`] ?? "").trim(),
    month: String(body[`${prefix}-month`] ?? "").trim(),
    year: String(body[`${prefix}-year`] ?? "").trim()
  };
}

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).appellant;
  render(
    res,
    {
      "proposedDischargeDate-day": section.proposedDischargeDate?.day ?? "",
      "proposedDischargeDate-month": section.proposedDischargeDate?.month ?? "",
      "proposedDischargeDate-year": section.proposedDischargeDate?.year ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const errors: Record<string, string> = {};
  const proposedDischargeDate = parseDayMonthYear(req.body, "proposedDischargeDate", { required: "", invalid: "proposedDischargeDateInvalid" });
  if (proposedDischargeDate.error) {
    errors.proposedDischargeDate = proposedDischargeDate.error;
  }

  if (Object.keys(errors).length > 0) {
    return render(res, req.body, errors);
  }

  await updateDraft(req, "appellant", {
    proposedDischargeDate: dateParts(req.body, "proposedDischargeDate")
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("discharge-date", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
