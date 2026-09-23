import { mergeTests, expect } from '@playwright/test';
import { test as authFixture } from './auth-fixture';
import { test as axeFixture } from './fixtures/axe-fixture';

export const test = mergeTests(authFixture, axeFixture);

export { expect };
