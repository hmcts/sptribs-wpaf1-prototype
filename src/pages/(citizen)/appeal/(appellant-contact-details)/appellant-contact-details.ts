import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./appellant-contact-details.i18n.js";

/**
 * How to contact the appellant — WPAF1 question 1.3.
 *
 * Each of the three is optional on its own and at least one is required between them, so
 * the "required" message belongs to the question rather than to a field. Zod cannot
 * express that as a field-level rule, which is why the check is a separate step keyed to
 * the fieldset.
 */
const BACK = "/appeal/appellant-address";
const NEXT = "/appeal/service-status";

/** Deliberately loose: GOV.UK guidance is to check for an @ and not to reject unusual but valid addresses. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const schema = z.object({
  phoneNumber: z.string().trim().max(30, "phoneNumberTooLong").optional().default(""),
  mobileNumber: z.string().trim().max(30, "mobileNumberTooLong").optional().default(""),
  emailAddress: z
    .string()
    .trim()
    .max(255, "emailAddressTooLong")
    .optional()
    .default("")
    .refine((value) => value === "" || EMAIL.test(value), { message: "emailAddressInvalid" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).appellant;
  render(
    res,
    {
      phoneNumber: section.phoneNumber ?? "",
      mobileNumber: section.mobileNumber ?? "",
      emailAddress: section.emailAddress ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  if (parsed.success && !parsed.data.phoneNumber && !parsed.data.mobileNumber && !parsed.data.emailAddress) {
    errors.contactDetails = "contactDetailsRequired";
  }

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(res, req.body, errors);
  }

  await updateDraft(req, "appellant", {
    ...parsed.data
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("appellant-contact-details", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
