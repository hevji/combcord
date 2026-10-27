/**
 * Pure settings, validation and appearance helpers for CombCord.
 *
 * This module intentionally has no Vencord imports so it can be tested in a
 * plain Node environment. Everything here is local-only: no values are sent
 * to Discord.
 */

export const MAX_NAME_LENGTH = 32;
export const MAX_MOCK_BADGES = 20;
export const MAX_SVG_BYTES = 10 * 1024;
export const MAX_IMAGE_URL_LENGTH = 2048;

import { MOCK_BADGE_IDS } from "./mockBadges";

const SNOWFLAKE_RE = /^\d{17,20}$/;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const GRADIENT_DIRECTIONS = new Set([
    "to-r", "to-l", "to-t", "to-b",
    "to-tr", "to-tl", "to-br", "to-bl",
]);

const FRAME_STYLES = new Set(["none", "glow", "ring", "gradient-ring", "custom-svg"]);
const DECORATION_TYPES = new Set(["none", "border", "corner-accents", "side-bars", "full-frame", "background-pattern"]);
const BACKGROUND_TYPES = new Set(["none", "solid", "gradient", "pattern", "image"]);
const PATTERNS = new Set(["dots", "grid", "lines", "mesh"]);
const IMAGE_FITS = new Set(["cover", "contain", "fill"]);
const IMAGE_POSITIONS = new Set(["center", "top", "bottom", "left", "right"]);

export type GradientDirection =
    | "to-r" | "to-l" | "to-t" | "to-b"
    | "to-tr" | "to-tl" | "to-br" | "to-bl";

export type AvatarFrameStyle = "none" | "glow" | "ring" | "gradient-ring" | "custom-svg";
export type DecorationType = "none" | "border" | "corner-accents" | "side-bars" | "full-frame" | "background-pattern";
export type BackgroundType = "none" | "solid" | "gradient" | "pattern" | "image";
export type Pattern = "dots" | "grid" | "lines" | "mesh";
export type ImageFit = "cover" | "contain" | "fill";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";

export interface GradientStop {
    color: string;
    position: number;
}

export interface Gradient {
    direction: GradientDirection;
    stops: GradientStop[];
}

export interface AccentColor {
    mode: "solid" | "gradient";
    solid?: string;
    gradient?: Gradient;
}

export interface AvatarFrame {
    style: AvatarFrameStyle;
    color?: string;
    gradient?: Gradient;
    svg?: string;
    width: number;
    animated: boolean;
}

export interface ProfileDecoration {
    type: DecorationType;
    color?: string;
    gradient?: Gradient;
    pattern?: Pattern;
    patternOpacity?: number;
    patternScale?: number;
    animated?: boolean;
}

export interface ProfileBackground {
    type: BackgroundType;
    color?: string;
    gradient?: Gradient;
    pattern?: Pattern;
    patternOpacity?: number;
    patternScale?: number;
    imageUrl?: string;
    imageFit?: ImageFit;
    imagePosition?: ImagePosition;
}

export interface ProfileAppearance {
    userId: string;
    accentColor: AccentColor;
    avatarFrame: AvatarFrame;
    decoration: ProfileDecoration;
    background: ProfileBackground;
    effects: {
        reducedMotion: boolean;
        enableGlow: boolean;
    };
}

export interface IdentitySettings {
    identityEnabled: boolean;
    username: string;
    displayName: string;
    memberSince: string;           // Custom "Member Since" date (YYYY-MM-DD)
    originalUsernameBadge: boolean; // Show badge with original username
    originalUsername: string;      // The original username to display on badge
}

export interface MockBadgeSettings {
    mockBadgesEnabled: boolean;
    mockBadges: string[];
    mockBadgesShowDisclaimer: boolean;
}

export interface ServerTagSettings {
    serverTagEnabled: boolean;
    serverTags: Record<string, string>; // guildId -> custom tag
}

export interface AppearanceSettings {
    appearanceEnabled: boolean;
    accentMode: "solid" | "gradient";
    accentSolid: string;
    accentGradientStart: string;
    accentGradientEnd: string;
    accentGradientDirection: GradientDirection;
    avatarFrameStyle: AvatarFrameStyle;
    avatarFrameColor: string;
    avatarFrameWidth: number;
    avatarFrameAnimated: boolean;
    avatarFrameSvg: string;
    decorationType: DecorationType;
    decorationColor: string;
    decorationUseAccentGradient: boolean;
    decorationPattern: Pattern;
    decorationPatternOpacity: number;
    decorationPatternScale: number;
    decorationAnimated: boolean;
    backgroundType: BackgroundType;
    backgroundColor: string;
    backgroundImageUrl: string;
    backgroundImageFit: ImageFit;
    backgroundImagePosition: ImagePosition;
    backgroundPattern: Pattern;
    backgroundPatternOpacity: number;
    backgroundPatternScale: number;
    reducedMotion: boolean;
    enableGlow: boolean;
}

export type CombCordSettings = IdentitySettings & MockBadgeSettings & AppearanceSettings & ServerTagSettings;

export interface IdentityValues {
    username: string | null;
    displayName: string | null;
    memberSince: string | null;
    originalUsername: string | null;
    originalUsernameBadge: boolean;
}

export function getIdentity(settings: CombCordSettings, userId: string | null | undefined): IdentityValues {
    if (!settings.identityEnabled || !isSnowflake(userId)) {
        return { username: null, displayName: null, memberSince: null, originalUsername: null, originalUsernameBadge: false };
    }

    return {
        username: sanitizeUsername(settings.username) || null,
        displayName: sanitizeName(settings.displayName) || null,
        memberSince: sanitizeName(settings.memberSince) || null,
        originalUsername: sanitizeName(settings.originalUsername) || null,
        originalUsernameBadge: settings.originalUsernameBadge === true,
    };
}

export function getServerTag(settings: CombCordSettings, guildId: string | null | undefined): string | null {
    if (!settings.serverTagEnabled || !guildId) return null;
    return settings.serverTags?.[guildId] ?? null;
}

export function isSnowflake(value: unknown): value is string {
    return typeof value === "string" && SNOWFLAKE_RE.test(value);
}

export function isHexColor(value: unknown): value is string {
    return typeof value === "string" && HEX_RE.test(value);
}

/**
 * Keeps names to the same limits Discord uses for display names, strips
 * control characters and collapses whitespace. This only affects local
 * rendering.
 */
export function sanitizeName(value: unknown, max = MAX_NAME_LENGTH): string {
    if (typeof value !== "string") return "";
    // eslint-disable-next-line no-control-regex
    return value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

/**
 * Usernames are handles, not display names. Strip a leading @ and any
 * whitespace so the value reads like a real handle.
 */
export function sanitizeUsername(value: unknown): string {
    return sanitizeName(value).replace(/^@+/, "").replace(/\s+/g, "");
}

/**
 * Removes anything executable from an SVG string. The result is rendered via
 * an <img> data URL, which already isolates scripts; this is defence in depth.
 */
export function sanitizeSvg(input: string): string | null {
    if (typeof input !== "string" || input.length > MAX_SVG_BYTES) return null;
    if (!/^\s*<svg[\s>]/i.test(input)) return null;
    if (/<\s*(script|foreignObject|iframe|style|object|embed)\b/i.test(input)) return null;
    if (/\bon[a-z]+\s*=/i.test(input)) return null;
    if (/javascript\s*:/i.test(input)) return null;
    if (/(?:href|xlink:href)\s*=\s*["']?\s*(?:data|https?):/i.test(input)) return null;
    return input.trim();
}

export function safeHttpsUrl(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const raw = value.trim();
    if (!raw || raw.length > MAX_IMAGE_URL_LENGTH) return undefined;
    try {
        const url = new URL(raw);
        if (url.protocol !== "https:") return undefined;
        return url.toString();
    } catch {
        return undefined;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function numberOr(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function validColor(value: unknown, fallback?: string): string | undefined {
    return isHexColor(value) ? value : fallback;
}

function validDirection(value: unknown): GradientDirection {
    return typeof value === "string" && GRADIENT_DIRECTIONS.has(value as GradientDirection)
        ? value as GradientDirection
        : "to-br";
}

function accentGradient(settings: AppearanceSettings): Gradient {
    return {
        direction: validDirection(settings.accentGradientDirection),
        stops: [
            { color: validColor(settings.accentGradientStart, "#5865f2")!, position: 0 },
            { color: validColor(settings.accentGradientEnd, "#a855f7")!, position: 100 },
        ],
    };
}

function appearanceAccent(settings: AppearanceSettings): AccentColor {
    if (settings.accentMode === "gradient") {
        return { mode: "gradient", gradient: accentGradient(settings) };
    }
    return { mode: "solid", solid: validColor(settings.accentSolid, "#5865f2")! };
}

export function getMockBadgeIds(settings: CombCordSettings, userId: string | null | undefined): string[] {
    if (!settings.mockBadgesEnabled || !isSnowflake(userId)) return [];
    const selected = Array.isArray(settings.mockBadges) ? settings.mockBadges : [];
    const ids = selected
        .filter((id): id is string => typeof id === "string")
        .filter((id) => MOCK_BADGE_IDS.has(id))
        .filter((id, index, all) => all.indexOf(id) === index);

    // The "Show Original Username Badge" toggle is a shortcut for the
    // "Originally Known As" badge, so keep them in sync.
    if (settings.originalUsernameBadge && !ids.includes("originally_known_as")) {
        ids.push("originally_known_as");
    }

    return ids.slice(0, MAX_MOCK_BADGES);
}

export function getAppearance(settings: CombCordSettings, userId: string | null | undefined): ProfileAppearance | null {
    if (!settings.appearanceEnabled || !isSnowflake(userId)) return null;

    const accent = appearanceAccent(settings);
    const decorationType = DECORATION_TYPES.has(settings.decorationType) ? settings.decorationType : "none";
    const decorationPattern = PATTERNS.has(settings.decorationPattern) ? settings.decorationPattern : "dots";
    const frameStyle = FRAME_STYLES.has(settings.avatarFrameStyle) ? settings.avatarFrameStyle : "none";
    const backgroundType = BACKGROUND_TYPES.has(settings.backgroundType) ? settings.backgroundType : "none";
    const backgroundPattern = PATTERNS.has(settings.backgroundPattern) ? settings.backgroundPattern : "dots";
    const imageFit = IMAGE_FITS.has(settings.backgroundImageFit) ? settings.backgroundImageFit : "cover";
    const imagePosition = IMAGE_POSITIONS.has(settings.backgroundImagePosition) ? settings.backgroundImagePosition : "center";

    return {
        userId,
        accentColor: accent,
        avatarFrame: {
            style: frameStyle,
            color: validColor(settings.avatarFrameColor),
            gradient: frameStyle === "gradient-ring" && accent.gradient ? accent.gradient : undefined,
            svg: frameStyle === "custom-svg" ? sanitizeSvg(settings.avatarFrameSvg) ?? undefined : undefined,
            width: clamp(numberOr(settings.avatarFrameWidth, 3), 1, 12),
            animated: settings.avatarFrameAnimated === true,
        },
        decoration: {
            type: decorationType,
            color: validColor(settings.decorationColor),
            gradient: settings.decorationUseAccentGradient && accent.gradient ? accent.gradient : undefined,
            pattern: decorationPattern,
            patternOpacity: clamp(numberOr(settings.decorationPatternOpacity, 12) / 100, 0, 1),
            patternScale: clamp(numberOr(settings.decorationPatternScale, 100) / 100, 0.25, 3),
            animated: settings.decorationAnimated === true,
        },
        background: {
            type: backgroundType,
            color: validColor(settings.backgroundColor),
            gradient: backgroundType === "gradient" && accent.gradient ? accent.gradient : undefined,
            pattern: backgroundPattern,
            patternOpacity: clamp(numberOr(settings.backgroundPatternOpacity, 12) / 100, 0, 1),
            patternScale: clamp(numberOr(settings.backgroundPatternScale, 100) / 100, 0.25, 3),
            imageUrl: backgroundType === "image" ? safeHttpsUrl(settings.backgroundImageUrl) : undefined,
            imageFit,
            imagePosition,
        },
        effects: {
            reducedMotion: settings.reducedMotion === true,
            enableGlow: settings.enableGlow !== false,
        },
    };
}

/** Returns [primary, accent] ints for Discord's native profile theme colors. */
export function accentToInts(accent: AccentColor): [number, number] | null {
    if (accent.mode === "gradient" && accent.gradient?.stops.length) {
        const stops = accent.gradient.stops;
        const first = hexToInt(stops[0].color);
        const last = hexToInt(stops[stops.length - 1].color);
        if (first == null || last == null) return null;
        return [first, last];
    }
    if (accent.solid) {
        const color = hexToInt(accent.solid);
        if (color != null) return [color, color];
    }
    return null;
}

export function hexToInt(hex: string): number | null {
    if (!HEX_RE.test(hex)) return null;
    let normalized = hex.slice(1);
    if (normalized.length === 3) normalized = normalized.split("").map(c => c + c).join("");
    if (normalized.length === 8) normalized = normalized.slice(0, 6);
    const value = Number.parseInt(normalized, 16);
    return Number.isNaN(value) ? null : value;
}
