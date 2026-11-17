import { describe, expect, it } from 'vitest';

import { maskDocument, tenantAccess } from './domain';

describe('tenants', () => {
  it('enmascara el documento en listas', () => {
    expect(maskDocument('CC', '1020304050')).toBe('CC •••• 4050');
    expect(maskDocument('PPT', '55 88 12')).toBe('PPT •••• 8812');
  });

  it('deriva el estado de acceso del inquilino', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const pending = (expires: string) => [{ tenant_id: 't1', status: 'pending' as const, expires_at: expires }];
    expect(tenantAccess({ id: 't1', profile_id: 'u1' }, [], now)).toBe('linked');
    expect(tenantAccess({ id: 't1', profile_id: null }, [], now)).toBe('none');
    expect(tenantAccess({ id: 't1', profile_id: null }, pending('2026-11-20T00:00:00Z'), now)).toBe('invited');
    expect(tenantAccess({ id: 't1', profile_id: null }, pending('2026-11-10T00:00:00Z'), now)).toBe('expired');
  });
});
