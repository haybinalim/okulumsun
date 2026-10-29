import { describe, it, expect } from 'vitest';
import { kirmiziTara } from '../../scripts/denetim/kirmiziYok';

describe('kırmızı yok denetimi', () => {
  it('tuzak #DC2626 yakalanır', () => {
    expect(kirmiziTara('src/ui/x.tsx', "const c = '#DC2626';")).toHaveLength(1);
    expect(kirmiziTara('src/design/y.ts', 'color: red')).toHaveLength(1);
  });
  it('istisnalar çalışır', () => {
    expect(kirmiziTara('src/dev/BoardHarness.tsx', "'#DC2626'")).toHaveLength(0);
    expect(kirmiziTara('public/images/banknotlar/a.svg', 'red')).toHaveLength(0);
  });
  it('temiz kod geçer', () => {
    expect(kirmiziTara('src/ui/x.tsx', "const c = '#7C3AED';")).toHaveLength(0);
  });
});
