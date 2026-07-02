// ABOUTME: Vitest configuration for EstimateRoom unit tests.
// ABOUTME: Runs co-located *.spec.ts across shared, server, and app, plus tests/unit.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'shared/**/*.spec.ts',
      'server/**/*.spec.ts',
      'app/**/*.spec.ts',
      'tests/unit/**/*.spec.ts',
    ],
  },
})
