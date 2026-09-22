import { mergeTests, expect } from '@playwright/test';
import { test as authFixture } from './auth-fixture';

export const test = mergeTests(authFixture);

export { expect };
