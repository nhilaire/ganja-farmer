import { en } from '../i18n/en';
import { pad } from '../i18n/format';
import { JAH_QUOTES } from '../i18n/quotes';

describe('English formatting', () => {
  it('zero-pads counters like the source HUD', () => {
    expect(pad(1500, 7)).toBe('0001500');
    expect(pad(3, 2)).toBe('03');
    expect(pad(12345678, 7)).toBe('12345678');
  });

  it('formats the HUD and transition strings from the PRD copy', () => {
    expect(en.hud.score(0)).toBe('Score: 0000000');
    expect(en.hud.level(1)).toBe('Level: 01');
    expect(en.hud.plants(26, 26)).toBe('Plants: 26/26');
    expect(en.game.combo(3)).toBe('x3 COMBO!');
    expect(en.game.multiplier(2)).toBe('x2.0');
    expect(en.transition.newWeapon('Machine Gun')).toBe('New Weapon: Machine Gun!');
  });

  it('keeps the 34 quotes of the source', () => {
    expect(JAH_QUOTES).toHaveLength(34);
  });
});
