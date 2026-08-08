import styled from 'styled-components';

const Stamp = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  opacity: 0.75;
  white-space: nowrap;
`;

/**
 * Names the commit the running bundle came from, so "which build is live?" is
 * answerable from a browser instead of by SSHing to the host. Deliberately not
 * translated — a SHA reads the same in every language.
 */
export function BuildStamp() {
  return <Stamp>build {__BUILD_SHA__}</Stamp>;
}
