import type { GemPin } from '../../types';

export function isAdminCreatedPearl(gem: Pick<GemPin, 'sourceType'>) {
  return gem.sourceType === 'manual';
}
