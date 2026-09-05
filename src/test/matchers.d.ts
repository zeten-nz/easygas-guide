// Makes the @testing-library/jest-dom matchers (toBeInTheDocument, etc.) visible
// to TypeScript in *.test.tsx files. They are registered at runtime by
// src/test/setup.ts (vitest setupFiles); this only surfaces their types.
import '@testing-library/jest-dom/vitest';
