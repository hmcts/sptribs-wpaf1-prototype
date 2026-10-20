import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, replaceSection, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./uksf.i18n.js";

/**
 * Whether the appellant has served with UK Special Forces.
 *
 * "Yes" leads to the Disclosure Cell confirmation, which the hub then requires. "No"
 * replaces the section, so a confirmation given before the answer changed cannot be left
 * standing on an appeal that does not need one.
 */
const BACK = "/appeal/task-list";
const NEXT = "/appeal/task-list";
const DISCLOSURE = "/appeal/uksf-disclosure";

const schema = z.object({
  servedWithUksf: z.enum(["Yes", "No"], { message: "servedWithUksfRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).uksf;
  render(
    res,
    {
      servedWithUksf: section.servedWithUksf ?? ""
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

  if (parsed.data.servedWithUksf === "No") {
    await replaceSection(req, "uksf", { servedWithUksf: "No" });
    return res.redirect(302, NEXT);
  }

  await updateDraft(req, "uksf", {
    ...parsed.data
  });
  res.redirect(302, DISCLOSURE);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("uksf", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
