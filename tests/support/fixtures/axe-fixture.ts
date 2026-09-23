import AxeBuilder from '@axe-core/playwright';
import { test as base } from '@playwright/test';
import type { Result } from 'axe-core';

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export function formatViolations(violations: Result[]): string {
  if (violations.length === 0) return 'No accessibility violations';

  return violations
    .map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target.map((target) => JSON.stringify(target)))
        .map((target) => `  - ${target}`)
        .join('\n');
      return `${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}\n${targets}`;
    })
    .join('\n\n');
}

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(WCAG_TAGS));
  },
});
