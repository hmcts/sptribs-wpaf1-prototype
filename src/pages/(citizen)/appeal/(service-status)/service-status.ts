import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./service-status.i18n.js";

/**
 * Whether the appellant is still serving — WPAF1 question 1.4.
 *
 * Only somebody still serving has a proposed discharge date, so answering "Left service"
 * clears one already given. The hub stops offering that task at the same moment, and an
 * answer nobody can see or change must not still be on the appeal when it reaches CCD.
 */
const BACK = "/appeal/appellant-contact-details";
const NEXT = "/appeal/task-list";
const DISCHARGE_DATE = "/appeal/discharge-date";

const schema = z.object({
  serviceStatus: z.enum(["stillServing", "leftService"], { message: "serviceStatusRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).appellant;
  render(
    res,
    {
      serviceStatus: section.serviceStatus ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(res, req.body, errors);
  }

  const stillServing = parsed.data.serviceStatus === "stillServing";
  await updateDraft(req, "appellant", {
    ...parsed.data,
    proposedDischargeDate: stillServing ? draftFrom(req).appellant.proposedDischargeDate : undefined
  });
  res.redirect(302, stillServing ? DISCHARGE_DATE : NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("service-status", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
