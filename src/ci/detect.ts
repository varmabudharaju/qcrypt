export type CIProvider = 'github' | 'gitlab' | 'generic';

export function detectProvider(): CIProvider {
  if (process.env.GITHUB_ACTIONS === 'true') return 'github';
  if (process.env.GITLAB_CI === 'true') return 'gitlab';
  return 'generic';
}
