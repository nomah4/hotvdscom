import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BuildStamp } from './BuildStamp';
import { renderWithProviders } from '../../test/renderWithProviders';

/**
 * `__BUILD_SHA__` only exists because vite.config.ts substitutes it. Drop that
 * define and this component throws a ReferenceError in the browser — on every
 * page, since both footers render it. Asserting the shape (not a specific SHA,
 * which changes every commit) is what catches a define that silently stopped
 * resolving.
 */
describe('BuildStamp', () => {
  it('renders the short commit SHA baked in at build time', () => {
    renderWithProviders(<BuildStamp />);

    expect(screen.getByText(/^build [0-9a-f]{7}$/)).toBeInTheDocument();
  });
});
