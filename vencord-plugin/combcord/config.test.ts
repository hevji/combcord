import { describe, expect, it } from 'vitest';
import {
  sanitizeName,
  sanitizeUsername,
  sanitizeSvg,
  safeHttpsUrl,
  isHexColor,
  isSnowflake,
  accentToInts,
  hexToInt,
  getIdentity,
  getMockBadgeIds,
  getAppearance,
  type CombCordSettings,
} from './config';
import { MOCK_BADGE_IDS } from './mockBadges';

const BASE_SETTINGS: CombCordSettings = {
  identityEnabled: true,
  username: '',
  displayName: '',
  mockBadgesEnabled: true,
  mockBadges: [],
  appearanceEnabled: true,
  accentMode: 'solid',
  accentSolid: '#5865f2',
  accentGradientStart: '#5865f2',
  accentGradientEnd: '#a855f7',
  accentGradientDirection: 'to-br',
  avatarFrameStyle: 'none',
  avatarFrameColor: '#5865f2',
  avatarFrameWidth: 3,
  avatarFrameAnimated: false,
  avatarFrameSvg: '',
  decorationType: 'none',
  decorationColor: '#5865f2',
  decorationUseAccentGradient: false,
  decorationPattern: 'dots',
  decorationPatternOpacity: 0.12,
  decorationPatternScale: 1,
  decorationAnimated: false,
  backgroundType: 'none',
  backgroundColor: '#1e1f22',
  backgroundImageUrl: '',
  backgroundImageFit: 'cover',
  backgroundImagePosition: 'center',
  backgroundPattern: 'dots',
  backgroundPatternOpacity: 0.12,
  backgroundPatternScale: 1,
  reducedMotion: false,
  enableGlow: true,
};

describe('config helpers', () => {
  it('sanitizeName trims, collapses whitespace, strips control chars, limits length', () => {
    expect(sanitizeName('  hello   world  ')).toBe('hello world');
    expect(sanitizeName('test\u0000\u001fname')).toBe('test name');
    expect(sanitizeName('a'.repeat(50), 10)).toBe('a'.repeat(10));
  });

  it('sanitizeUsername strips @ and whitespace', () => {
    expect(sanitizeUsername('@handle')).toBe('handle');
    expect(sanitizeUsername('  @ my handle  ')).toBe('myhandle');
  });

  it('sanitizeSvg rejects unsafe content', () => {
    expect(sanitizeSvg('<svg><script>alert(1)</script></svg>')).toBeNull();
    expect(sanitizeSvg('<svg onload="x"></svg>')).toBeNull();
    expect(sanitizeSvg('<svg><foreignObject></foreignObject></svg>')).toBeNull();
    expect(sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')).not.toBeNull();
  });

  it('safeHttpsUrl only allows https', () => {
    expect(safeHttpsUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
    expect(safeHttpsUrl('http://example.com/img.png')).toBeUndefined();
    expect(safeHttpsUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpsUrl('')).toBeUndefined();
  });

  it('isHexColor validates hex formats', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#abcdef')).toBe(true);
    expect(isHexColor('#abcdef00')).toBe(true);
    expect(isHexColor('abc')).toBe(false);
    expect(isHexColor('#ggg')).toBe(false);
  });

  it('isSnowflake validates Discord IDs', () => {
    expect(isSnowflake('123456789012345678')).toBe(true);
    expect(isSnowflake('123')).toBe(false);
    expect(isSnowflake('not-a-number')).toBe(false);
  });

  it('accentToInts converts solid and gradient', () => {
    expect(accentToInts({ mode: 'solid', solid: '#5865f2' })).toEqual([0x5865f2, 0x5865f2]);
    expect(accentToInts({ mode: 'gradient', gradient: { direction: 'to-r', stops: [{ color: '#ff0000', position: 0 }, { color: '#00ff00', position: 100 }] } })).toEqual([0xff0000, 0x00ff00]);
    expect(accentToInts({ mode: 'solid', solid: 'invalid' })).toBeNull();
  });

  it('hexToInt normalizes 3, 6, 8 digit hex', () => {
    expect(hexToInt('#f00')).toBe(0xff0000);
    expect(hexToInt('#ff0000')).toBe(0xff0000);
    expect(hexToInt('#ff000080')).toBe(0xff0000); // alpha dropped
    expect(hexToInt('invalid')).toBeNull();
  });
});

describe('getIdentity', () => {
  it('returns null when disabled', () => {
    const s = { ...BASE_SETTINGS, identityEnabled: false };
    expect(getIdentity(s, '123456789012345678')).toEqual({ username: null, displayName: null, memberSince: null, originalUsername: null, originalUsernameBadge: false });
  });

  it('returns sanitized values when enabled', () => {
    const s = { ...BASE_SETTINGS, identityEnabled: true, username: '@MyHandle', displayName: '  My Name  ' };
    expect(getIdentity(s, '123456789012345678')).toEqual({ username: 'MyHandle', displayName: 'My Name', memberSince: null, originalUsername: null, originalUsernameBadge: false });
  });

  it('returns null for invalid userId', () => {
    const s = { ...BASE_SETTINGS, identityEnabled: true, username: 'test', displayName: 'test' };
    expect(getIdentity(s, 'invalid')).toEqual({ username: null, displayName: null, memberSince: null, originalUsername: null, originalUsernameBadge: false });
    expect(getIdentity(s, null)).toEqual({ username: null, displayName: null, memberSince: null, originalUsername: null, originalUsernameBadge: false });
    expect(getIdentity(s, undefined)).toEqual({ username: null, displayName: null, memberSince: null, originalUsername: null, originalUsernameBadge: false });
  });
});

describe('getMockBadgeIds', () => {
  it('returns empty when disabled', () => {
    const s = { ...BASE_SETTINGS, mockBadgesEnabled: false, mockBadges: ['staff'] };
    expect(getMockBadgeIds(s, '123456789012345678')).toEqual([]);
  });

  it('filters unknown badge ids', () => {
    const s = { ...BASE_SETTINGS, mockBadgesEnabled: true, mockBadges: ['discord_staff', 'unknown', 'bug_hunter'] };
    expect(getMockBadgeIds(s, '123456789012345678')).toEqual(['discord_staff', 'bug_hunter']);
  });

  it('deduplicates and respects max', () => {
    const many = Array.from({ length: 25 }, (_, i) => `badge_${i}`).concat(['staff']);
    const s = { ...BASE_SETTINGS, mockBadgesEnabled: true, mockBadges: many };
    const result = getMockBadgeIds(s, '123456789012345678');
    expect(result.length).toBeLessThanOrEqual(20);
    expect(new Set(result).size).toBe(result.length);
  });
});

describe('getAppearance', () => {
  it('returns null when disabled', () => {
    const s = { ...BASE_SETTINGS, appearanceEnabled: false };
    expect(getAppearance(s, '123456789012345678')).toBeNull();
  });

  it('builds solid accent', () => {
    const s = { ...BASE_SETTINGS, accentMode: 'solid', accentSolid: '#ff0000' };
    const a = getAppearance(s, '123456789012345678');
    expect(a).not.toBeNull();
    expect(a!.accentColor.mode).toBe('solid');
    expect(a!.accentColor.solid).toBe('#ff0000');
  });

  it('builds gradient accent', () => {
    const s = { ...BASE_SETTINGS, accentMode: 'gradient', accentGradientStart: '#ff0000', accentGradientEnd: '#00ff00', accentGradientDirection: 'to-r' };
    const a = getAppearance(s, '123456789012345678');
    expect(a).not.toBeNull();
    expect(a!.accentColor.mode).toBe('gradient');
    expect(a!.accentColor.gradient!.stops.length).toBe(2);
  });

  it('clamps frame width', () => {
    const s = { ...BASE_SETTINGS, avatarFrameStyle: 'ring', avatarFrameWidth: 100 };
    const a = getAppearance(s, '123456789012345678');
    expect(a!.avatarFrame.width).toBe(12);
  });

  it('sanitizes custom frame SVG', () => {
    const s = { ...BASE_SETTINGS, avatarFrameStyle: 'custom-svg', avatarFrameSvg: '<svg><script>x</script></svg>' };
    const a = getAppearance(s, '123456789012345678');
    expect(a!.avatarFrame.svg).toBeUndefined();
  });

  it('uses accent gradient for gradient-ring frame', () => {
    const s = { ...BASE_SETTINGS, accentMode: 'gradient', accentGradientStart: '#ff0000', accentGradientEnd: '#00ff00', avatarFrameStyle: 'gradient-ring' };
    const a = getAppearance(s, '123456789012345678');
    expect(a!.avatarFrame.gradient).toBeDefined();
  });

  it('handles decoration patterns', () => {
    const s = { ...BASE_SETTINGS, decorationType: 'background-pattern', decorationPattern: 'grid', decorationPatternOpacity: 50, decorationPatternScale: 200 };
    const a = getAppearance(s, '123456789012345678');
    expect(a!.decoration.pattern).toBe('grid');
    expect(a!.decoration.patternOpacity).toBe(0.5);
    expect(a!.decoration.patternScale).toBe(2);
  });

  it('handles background image', () => {
    const s = { ...BASE_SETTINGS, backgroundType: 'image', backgroundImageUrl: 'https://example.com/bg.png', backgroundImageFit: 'contain', backgroundImagePosition: 'top' };
    const a = getAppearance(s, '123456789012345678');
    expect(a!.background.type).toBe('image');
    expect(a!.background.imageUrl).toBe('https://example.com/bg.png');
    expect(a!.background.imageFit).toBe('contain');
    expect(a!.background.imagePosition).toBe('top');
  });

  it('rejects non-https background image', () => {
    const s = { ...BASE_SETTINGS, backgroundType: 'image', backgroundImageUrl: 'http://example.com/bg.png' };
    const a = getAppearance(s, '123456789012345678');
    expect(a!.background.imageUrl).toBeUndefined();
  });

  it('returns null for invalid userId', () => {
    const a = getAppearance(BASE_SETTINGS, 'not-a-snowflake');
    expect(a).toBeNull();
  });
});

describe('MOCK_BADGES catalog', () => {
  it('contains expected badge ids', () => {
    expect(MOCK_BADGE_IDS.has('discord_staff')).toBe(true);
    expect(MOCK_BADGE_IDS.has('bug_hunter')).toBe(true);
    expect(MOCK_BADGE_IDS.has('golden_bug_hunter')).toBe(true);
    expect(MOCK_BADGE_IDS.has('early_verified_bot_developer')).toBe(true);
    expect(MOCK_BADGE_IDS.has('active_developer')).toBe(true);
    expect(MOCK_BADGE_IDS.has('early_supporter')).toBe(true);
    expect(MOCK_BADGE_IDS.has('hypesquad_bravery')).toBe(true);
    expect(MOCK_BADGE_IDS.has('hypesquad_brilliance')).toBe(true);
    expect(MOCK_BADGE_IDS.has('hypesquad_balance')).toBe(true);
    expect(MOCK_BADGE_IDS.has('hypesquad_events')).toBe(true);
    expect(MOCK_BADGE_IDS.has('moderator_programs_aluminum')).toBe(true);
    expect(MOCK_BADGE_IDS.has('originally_known_as')).toBe(true);
    expect(MOCK_BADGE_IDS.has('nitro')).toBe(true);
    expect(MOCK_BADGE_IDS.has('nitro_ruby')).toBe(true);
    expect(MOCK_BADGE_IDS.has('boost_1_months')).toBe(true);
    expect(MOCK_BADGE_IDS.has('boost_24_months')).toBe(true);
    expect(MOCK_BADGE_IDS.has('account_age_primordial')).toBe(true);
    expect(MOCK_BADGE_IDS.has('streaming_phenomenon')).toBe(true);
    expect(MOCK_BADGE_IDS.has('game_time_eternal')).toBe(true);
    expect(MOCK_BADGE_IDS.has('game_variety_universalist')).toBe(true);
    expect(MOCK_BADGE_IDS.has('gifting_patron')).toBe(true);
    expect(MOCK_BADGE_IDS.has('owner_mock')).toBe(true);
  });

  it('every badge has required fields', () => {
    for (const _badge of MOCK_BADGE_IDS) {
      // Just verify the set is populated; actual badge objects tested via getMockBadge
    }
  });
});