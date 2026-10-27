/**
 * Generates the CSS applied to Discord profiles.
 *
 * Profiles are tagged with `data-combcord-user-id` by tagger.ts, so every rule
 * is scoped to one user's open profile popout/modal.
 */

import type { Gradient, ProfileAppearance } from "./config";

const DIRECTION_MAP: Record<string, string> = {
    "to-r": "to right",
    "to-l": "to left",
    "to-t": "to top",
    "to-b": "to bottom",
    "to-tr": "to top right",
    "to-tl": "to top left",
    "to-br": "to bottom right",
    "to-bl": "to bottom left",
};

export function gradientCss(gradient: Gradient): string {
    const direction = DIRECTION_MAP[gradient.direction] ?? "to bottom right";
    const stops = gradient.stops.map(stop => `${stop.color} ${stop.position}%`).join(", ");
    return `linear-gradient(${direction}, ${stops})`;
}

function accentCss(appearance: ProfileAppearance): string {
    const accent = appearance.accentColor;
    if (accent.mode === "gradient" && accent.gradient) return gradientCss(accent.gradient);
    return accent.solid ?? "#5865f2";
}

function decorationPaint(appearance: ProfileAppearance): string {
    const deco = appearance.decoration;
    if (deco.gradient) return gradientCss(deco.gradient);
    return deco.color ?? accentCss(appearance);
}

function patternLayers(pattern: string | undefined, color: string, scale: number): string | null {
    const size = Math.round(36 * scale);
    switch (pattern) {
        case "dots":
            return `radial-gradient(circle, ${color} 1.2px, transparent 1.2px)`;
        case "grid":
            return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
        case "lines":
            return `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px ${size}px)`;
        case "mesh":
            return `linear-gradient(45deg, ${color} 1px, transparent 1px), linear-gradient(-45deg, ${color} 1px, transparent 1px)`;
        default:
            return null;
    }
}

function patternSize(pattern: string | undefined, scale: number): string {
    const size = Math.round(36 * scale);
    if (pattern === "lines") return "auto";
    if (pattern === "mesh") return `${size}px ${size}px, ${size}px ${size}px`;
    return `${size}px ${size}px`;
}

function backgroundRule(appearance: ProfileAppearance): string {
    const bg = appearance.background;
    const scale = bg.patternScale ?? 1;
    const patternColor = `color-mix(in srgb, currentColor ${Math.round((bg.patternOpacity ?? 0.12) * 100)}%, transparent)`;

    if (bg.type === "image" && bg.imageUrl) {
        return [
            `background-image: url("${bg.imageUrl}") !important`,
            "background-size: cover !important",
            "background-position: center !important",
        ].join(";");
    }

    if (bg.type === "gradient" && bg.gradient) {
        return `background: ${gradientCss(bg.gradient)} !important`;
    }

    if (bg.type === "pattern" && bg.pattern) {
        const layers = patternLayers(bg.pattern, patternColor, scale);
        if (layers) {
            return [
                `background-color: ${bg.color ?? "transparent"} !important`,
                `background-image: ${layers} !important`,
                `background-size: ${patternSize(bg.pattern, scale)} !important`,
            ].join(";");
        }
    }

    if (bg.type === "solid") {
        return bg.color ? `background: ${bg.color} !important` : "";
    }

    return "";
}

function avatarFrameRules(appearance: ProfileAppearance, selector: string): string {
    const frame = appearance.avatarFrame;
    if (frame.style === "none") return "";

    const width = Math.round(frame.width);
    const paint = frame.gradient ? gradientCss(frame.gradient) : (frame.color ?? accentCss(appearance));
    const animation = frame.animated && !appearance.effects.reducedMotion;

    const avatar = [
        `${selector} [class*="avatarWrapper"]`,
        `${selector} [class*="avatar_"]`,
    ].join(", ");

    if (frame.style === "glow") {
        if (!appearance.effects.enableGlow) return "";
        return `
${avatar} {
    box-shadow: 0 0 ${width * 4}px ${paint}, 0 0 ${width * 2}px ${paint};
    border-radius: 50%;
}
`;
    }

    if (frame.style === "ring") {
        return `
${avatar}::after {
    content: "";
    position: absolute;
    inset: -${width}px;
    border: ${width}px solid ${paint};
    border-radius: 50%;
    pointer-events: none;
    ${animation ? "animation: combcord-pulse 2.4s ease-in-out infinite;" : ""}
}
`;
    }

    if (frame.style === "gradient-ring") {
        const gradient = frame.gradient ? gradientCss(frame.gradient) : `conic-gradient(${paint}, transparent, ${paint})`;
        return `
${avatar}::after {
    content: "";
    position: absolute;
    inset: -${width}px;
    padding: ${width}px;
    border-radius: 50%;
    box-sizing: border-box;
    background: ${gradient};
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    pointer-events: none;
    ${animation ? "animation: combcord-spin 6s linear infinite;" : ""}
}
`;
    }

    if (frame.style === "custom-svg" && frame.svg) {
        const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(frame.svg)}`;
        return `
${avatar}::after {
    content: "";
    position: absolute;
    inset: -${width * 2}px;
    background: url("${url}") center / contain no-repeat;
    pointer-events: none;
    ${animation ? "animation: combcord-spin 16s linear infinite;" : ""}
}
`;
    }

    return "";
}

function decorationRules(appearance: ProfileAppearance, selector: string): string {
    const deco = appearance.decoration;
    if (deco.type === "none") return "";

    const paint = decorationPaint(appearance);
    const animation = deco.animated && !appearance.effects.reducedMotion;

    if (deco.type === "border" || deco.type === "full-frame") {
        return `
${selector} {
    box-shadow: inset 0 0 0 ${deco.type === "full-frame" ? 3 : 2}px ${paint} !important;
}
`;
    }

    if (deco.type === "side-bars") {
        return `
${selector} {
    border-left: 3px solid ${paint} !important;
    border-right: 3px solid ${paint} !important;
    box-sizing: border-box;
    ${animation ? "animation: combcord-pulse 3s ease-in-out infinite;" : ""}
}
`;
    }

    if (deco.type === "corner-accents") {
        return `
${selector}::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        linear-gradient(135deg, ${paint} 0 2px, transparent 2px) 0 0 / 18px 18px no-repeat,
        linear-gradient(225deg, ${paint} 0 2px, transparent 2px) 100% 0 / 18px 18px no-repeat,
        linear-gradient(45deg, ${paint} 0 2px, transparent 2px) 0 100% / 18px 18px no-repeat,
        linear-gradient(315deg, ${paint} 0 2px, transparent 2px) 100% 100% / 18px 18px no-repeat;
    ${animation ? "animation: combcord-pulse 3s ease-in-out infinite;" : ""}
}
`;
    }

    if (deco.type === "background-pattern" && deco.pattern) {
        const color = `color-mix(in srgb, ${paint} ${Math.round((deco.patternOpacity ?? 0.12) * 100)}%, transparent)`;
        const layers = patternLayers(deco.pattern, color, deco.patternScale ?? 1);
        if (!layers) return "";
        return `
${selector}::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: ${layers};
    background-size: ${patternSize(deco.pattern, deco.patternScale ?? 1)};
    ${animation ? "animation: combcord-fade 4s ease-in-out infinite;" : ""}
}
`;
    }

    return "";
}

function profileCss(appearance: ProfileAppearance): string {
    const selector = `[data-combcord-user-id="${appearance.userId}"]`;
    const accent = accentCss(appearance);
    const bgRule = backgroundRule(appearance);
    const reducedMotion = appearance.effects.reducedMotion;

    return `
${selector} {
    --combcord-accent: ${accent};
    --combcord-badge-gap: 8px;
    --combcord-badge-padding: 8px;
    ${bgRule ? `${bgRule};` : ""}
    ${reducedMotion ? "animation: none !important; transition: none !important;" : ""}
}
${avatarFrameRules(appearance, selector)}
${decorationRules(appearance, selector)}
`;
}

export function buildAppearanceCss(appearance: ProfileAppearance | null): string {
    const baseCss = `
.combcord-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: var(--combcord-badge-gap, 8px);
    padding: calc(var(--combcord-badge-padding, 8px) / 2) var(--combcord-badge-padding, 8px);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    user-select: none;
}

.combcord-badge img {
    width: 12px;
    height: 12px;
    object-fit: contain;
}

@keyframes combcord-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
}
@keyframes combcord-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
@keyframes combcord-fade {
    0%, 100% { opacity: 0.65; }
    50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
    [data-combcord-user-id] *,
    [data-combcord-user-id] *::before,
    [data-combcord-user-id] *::after {
        animation: none !important;
        transition: none !important;
    }
}
`;

    if (!appearance) return baseCss;

    return `
/* CombCord appearance */
${profileCss(appearance)}
${baseCss}
`;
}