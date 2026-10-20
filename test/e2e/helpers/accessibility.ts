import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * Assert a page has no WCAG 2.2 AA violations axe can detect.
 *
 * Point 5 of the Service Standard is that everyone can use the service, and an automated
 * check is the cheap half of meeting it: it catches the regressions — a missing label, a
 * fieldset without a legend, a colour pair that fails contrast — that creep in when
 * somebody hand-edits a template. It does not replace an audit or testing with assistive
 * technology, and it is not claimed to.
 *
 * Tags are named explicitly rather than left to axe's defaults, so upgrading axe changes
 * what is reported only when this line changes.
 *
 * `disableRules` is for a rule axe reports against **govuk-frontend's own** markup or
 * scripting, where the fix is not this service's to make. Each use has to name the component
 * and say why at the call site. It is never for a violation in a template in this repo: the
 * point of the check is that those get fixed, not listed.
 */
export async function expectNoAccessibilityViolations(page: Page, context: string, disableRules: string[] = []): Promise<void> {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const results = await (disableRules.length > 0 ? builder.disableRules(disableRules) : builder).analyze();

  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes.map((node) => `      ${node.target.join(" ")} — ${node.html.slice(0, 160)}`).join("\n")}`
  );

  expect(summary, `${context} has accessibility violations`).toEqual([]);
}
