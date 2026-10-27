/**
 * Native Vencord settings UI for CombCord.
 *
 * All customization happens inside Discord — no external website needed.
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { Button, Forms, React, showToast, Switch } from "@webpack/common";

import { MOCK_BADGES, MockBadgeGroup, badgeDataUrl, type MockBadge } from "./mockBadges";
import { type CombCordSettings } from "./config";
import { requestReload } from "./state";
import { VERSION } from "./version";

const GROUPS: MockBadgeGroup[] = [
    "Special",
    "HypeSquad",
    "Nitro",
    "Server Boosting",
    "Gifting",
    "Account Age",
    "Streaming",
    "Game Time",
    "Game Variety",
    "Application",
    "Mock",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <Forms.FormTitle tag="h5" style={{ marginBottom: 8 }}>{children}</Forms.FormTitle>;
}

function FormHint({ children }: { children: React.ReactNode }) {
    return <Forms.FormText style={{ color: "var(--text-muted)", marginBottom: 12, fontSize: 13 }}>{children}</Forms.FormText>;
}

function VersionInfo() {
    return <Forms.FormText style={{ color: "var(--text-muted)", marginBottom: 12, fontSize: 13 }}>CombCord v{VERSION}</Forms.FormText>;
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const HEX6_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Colour swatch + editable hex field. The swatch opens the OS colour picker,
 * and the text field lets you paste/read an exact hex value.
 * Rendered inline (no FormItem wrapper) for compact layout.
 */
function ColorField({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
    const [text, setText] = React.useState(value);

    React.useEffect(() => {
        setText(value);
    }, [value]);

    const emit = (next: string) => {
        setText(next);
        if (HEX_COLOR_RE.test(next)) onChange(next.toLowerCase());
    };

    const colorValue = HEX6_COLOR_RE.test(text) ? text : (HEX6_COLOR_RE.test(value) ? value : "#5865f2");

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Forms.FormTitle tag="h6" style={{ marginBottom: 0, minWidth: 100, fontWeight: 500 }}>{title}</Forms.FormTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                    type="color"
                    value={colorValue}
                    onChange={e => emit(e.target.value)}
                    title="Pick a colour"
                    style={{ width: 36, height: 28, border: "none", borderRadius: 4, cursor: "pointer", padding: 0, background: "transparent" }}
                />
                <input
                    type="text"
                    value={text}
                    spellCheck={false}
                    onChange={e => emit(e.currentTarget.value)}
                    onBlur={() => {
                        if (!HEX_COLOR_RE.test(text)) setText(value);
                    }}
                    placeholder="#5865f2"
                    style={{
                        width: 96,
                        padding: "6px 8px",
                        borderRadius: 4,
                        border: "1px solid var(--background-modifier-accent)",
                        background: "var(--input-background, var(--background-secondary))",
                        color: "var(--text-normal)",
                        fontFamily: "monospace",
                        fontSize: 12,
                    }}
                />
            </div>
        </div>
    );
}

function MockBadgePicker() {
    const { mockBadges } = settings.use(["mockBadges", "mockBadgesEnabled"]);
    const [query, setQuery] = React.useState("");

    const selectedIds = Array.isArray(mockBadges) ? mockBadges : [];
    const search = query.trim().toLowerCase();

    const toggle = (id: string) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id];
        settings.store.mockBadges = next;
        requestReload();
    };

    const clearAll = () => {
        settings.store.mockBadges = [];
        requestReload();
        showToast({ text: "All mock badges cleared", variant: "success" });
    };

    const matches = (badge: MockBadge) =>
        !search || badge.label.toLowerCase().includes(search) || badge.group.toLowerCase().includes(search);

    return (
        <section style={{ marginBottom: 16 }}>
            <Forms.FormTitle tag="h5" style={{ marginBottom: 8 }}>Mock Discord Badges</Forms.FormTitle>
            <FormHint>
                These are visual replicas of official Discord badges. They are shown only on
                <strong>your own profile</strong> in this client and do not grant any real badges,
                achievements, or privileges.
            </FormHint>

            <input
                type="text"
                value={query}
                placeholder="Search badges…"
                onChange={e => setQuery(e.currentTarget.value)}
                style={{
                    width: "100%",
                    maxWidth: 320,
                    marginBottom: 16,
                    padding: "8px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--background-modifier-accent)",
                    background: "var(--input-background, var(--background-secondary))",
                    color: "var(--text-normal)",
                    outline: "none",
                }}
            />

            {GROUPS.map(group => {
                const badges = MOCK_BADGES.filter(b => b.group === group && matches(b));
                if (!badges.length) return null;

                return (
                    <div key={group} style={{ marginBottom: 16 }}>
                        <Forms.FormText style={{ fontWeight: 600, marginBottom: 8, color: "var(--text-normal)" }}>
                            {group}
                        </Forms.FormText>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                            {badges.map((badge: MockBadge) => {
                                const selected = selectedIds.includes(badge.id);
                                return (
                                    <label
                                        key={badge.id}
                                        title={badge.description}
                                        onClick={() => toggle(badge.id)}
                                        style={{
                                            position: "relative",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 6,
                                            width: 120,
                                            padding: 10,
                                            borderRadius: 8,
                                            border: selected
                                                ? "2px solid var(--brand-500, var(--accent-color))"
                                                : "2px solid var(--background-modifier-accent)",
                                            background: selected
                                                ? "var(--background-modifier-selected)"
                                                : "transparent",
                                            boxShadow: selected
                                                ? "0 0 0 2px var(--brand-500, var(--accent-color)) inset"
                                                : "none",
                                            cursor: "pointer",
                                            transition: "border-color 0.15s ease, background 0.15s ease",
                                        }}
                                    >
                                        {selected && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    top: -7,
                                                    right: -7,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: "50%",
                                                    background: "var(--brand-500, var(--accent-color))",
                                                    color: "#fff",
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    lineHeight: "20px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                ✓
                                            </span>
                                        )}
                                        <img
                                            src={badgeDataUrl(badge.svg)}
                                            alt={badge.label}
                                            style={{ width: 32, height: 32, opacity: selected ? 1 : 0.75 }}
                                        />
                                        <span style={{ fontSize: 11, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                                            {badge.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button
                    size={Button.Sizes.SMALL}
                    onClick={clearAll}
                    color={Button.Colors.RED}
                    disabled={!selectedIds.length}
                >
                    Clear All
                </Button>
                <Forms.FormText style={{ alignSelf: "center", color: "var(--text-muted)", fontSize: 12 }}>
                    {selectedIds.length} badge(s) selected
                </Forms.FormText>
            </div>
        </section>
    );
}

function AppearanceEditor() {
    const s = settings.store as unknown as CombCordSettings;

    return (
        <section style={{ marginBottom: 16 }}>
            <Forms.FormTitle tag="h5" style={{ marginBottom: 8 }}>Profile Appearance</Forms.FormTitle>
            <Forms.FormText style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: 13 }}>
                These changes apply to your own profile in this client. Most options require the
                profile to be open (popout or modal) to take effect.
            </Forms.FormText>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Accent */}
                <div>
                    <Forms.FormTitle tag="h5" style={{ marginBottom: 12 }}>Accent Color</Forms.FormTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Mode</Forms.FormTitle>
                            <select
                                value={s.accentMode}
                                onChange={e => { settings.store.accentMode = e.target.value as "solid" | "gradient"; requestReload(); }}
                                style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                            >
                                <option value="solid">Solid</option>
                                <option value="gradient">Gradient</option>
                            </select>
                        </div>

                        {s.accentMode === "solid" && (
                            <ColorField
                                title="Color"
                                value={s.accentSolid}
                                onChange={v => { settings.store.accentSolid = v; requestReload(); }}
                            />
                        )}

                        {s.accentMode === "gradient" && (
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                <ColorField
                                    title="Start"
                                    value={s.accentGradientStart}
                                    onChange={v => { settings.store.accentGradientStart = v; requestReload(); }}
                                />
                                <ColorField
                                    title="End"
                                    value={s.accentGradientEnd}
                                    onChange={v => { settings.store.accentGradientEnd = v; requestReload(); }}
                                />
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Direction</Forms.FormTitle>
                                    <select
                                        value={s.accentGradientDirection}
                                        onChange={e => { settings.store.accentGradientDirection = e.target.value as any; requestReload(); }}
                                        style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                                    >
                                        <option value="to-r">→ Right</option>
                                        <option value="to-l">← Left</option>
                                        <option value="to-t">↑ Up</option>
                                        <option value="to-b">↓ Down</option>
                                        <option value="to-tr">↗ Top Right</option>
                                        <option value="to-tl">↖ Top Left</option>
                                        <option value="to-br">↘ Bottom Right</option>
                                        <option value="to-bl">↙ Bottom Left</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Avatar Frame */}
                <div>
                    <Forms.FormTitle tag="h5" style={{ marginBottom: 12 }}>Avatar Frame</Forms.FormTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Style</Forms.FormTitle>
                            <select
                                value={s.avatarFrameStyle}
                                onChange={e => { settings.store.avatarFrameStyle = e.target.value as any; requestReload(); }}
                                style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)", minWidth: 160 }}
                            >
                                <option value="none">None</option>
                                <option value="glow">Glow</option>
                                <option value="ring">Solid Ring</option>
                                <option value="gradient-ring">Gradient Ring</option>
                                <option value="custom-svg">Custom SVG</option>
                            </select>
                        </div>

                        {(s.avatarFrameStyle === "glow" || s.avatarFrameStyle === "ring") && (
                            <ColorField
                                title="Color"
                                value={s.avatarFrameColor}
                                onChange={v => { settings.store.avatarFrameColor = v; requestReload(); }}
                            />
                        )}

                        {s.avatarFrameStyle === "custom-svg" && (
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>SVG</Forms.FormTitle>
                                <textarea
                                    value={s.avatarFrameSvg}
                                    onChange={e => { settings.store.avatarFrameSvg = e.target.value; requestReload(); }}
                                    placeholder="Paste SVG here…"
                                    style={{
                                        width: 300,
                                        height: 80,
                                        padding: 8,
                                        borderRadius: 4,
                                        background: "var(--background-tertiary)",
                                        border: "1px solid var(--background-modifier-accent)",
                                        color: "var(--text-normal)",
                                        fontFamily: "monospace",
                                        fontSize: 11,
                                        resize: "vertical",
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Width</Forms.FormTitle>
                            <input
                                type="range"
                                min="1"
                                max="12"
                                value={s.avatarFrameWidth}
                                onChange={e => { settings.store.avatarFrameWidth = parseInt(e.target.value, 10); requestReload(); }}
                                style={{ width: 120 }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Animated</Forms.FormTitle>
                            <Switch
                            title="Animated"
                            value={s.avatarFrameAnimated}
                            onChange={v => { settings.store.avatarFrameAnimated = v; requestReload(); }}
                        />
                        </div>
                    </div>
                </div>

                {/* Decoration */}
                <div>
                    <Forms.FormTitle tag="h5" style={{ marginBottom: 12 }}>Profile Decoration</Forms.FormTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Type</Forms.FormTitle>
                            <select
                                value={s.decorationType}
                                onChange={e => { settings.store.decorationType = e.target.value as any; requestReload(); }}
                                style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)", minWidth: 200 }}
                            >
                                <option value="none">None</option>
                                <option value="border">Border</option>
                                <option value="corner-accents">Corner Accents</option>
                                <option value="side-bars">Side Bars</option>
                                <option value="full-frame">Full Frame</option>
                                <option value="background-pattern">Background Pattern</option>
                            </select>
                        </div>

                        {s.decorationType !== "none" && (
                            <>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 160 }}>Use Accent Gradient</Forms.FormTitle>
                                        <Switch
                                            value={s.decorationUseAccentGradient}
                                            onChange={v => { settings.store.decorationUseAccentGradient = v; requestReload(); }}
                                        />
                                    </div>
                                    {!s.decorationUseAccentGradient && (
                                        <ColorField
                                            title="Color"
                                            value={s.decorationColor}
                                            onChange={v => { settings.store.decorationColor = v; requestReload(); }}
                                        />
                                    )}
                                </div>

                                {s.decorationType === "background-pattern" && (
                                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Pattern</Forms.FormTitle>
                                            <select
                                                value={s.decorationPattern}
                                                onChange={e => { settings.store.decorationPattern = e.target.value as any; requestReload(); }}
                                                style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                                            >
                                                <option value="dots">Dots</option>
                                                <option value="grid">Grid</option>
                                                <option value="lines">Lines</option>
                                                <option value="mesh">Mesh</option>
                                            </select>
                                        </div>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 80 }}>Opacity</Forms.FormTitle>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={Math.round((s.decorationPatternOpacity ?? 0.12) * 100)}
                                                onChange={e => { settings.store.decorationPatternOpacity = parseInt(e.target.value, 10) / 100; requestReload(); }}
                                                style={{ width: 120 }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 80 }}>Scale</Forms.FormTitle>
                                            <input
                                                type="range"
                                                min="25"
                                                max="300"
                                                value={Math.round((s.decorationPatternScale ?? 1) * 100)}
                                                onChange={e => { settings.store.decorationPatternScale = parseInt(e.target.value, 10) / 100; requestReload(); }}
                                                style={{ width: 120 }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Animated</Forms.FormTitle>
                                    <Switch
                                        value={s.decorationAnimated}
                                        onChange={v => { settings.store.decorationAnimated = v; requestReload(); }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Background */}
                <div>
                    <Forms.FormTitle tag="h5" style={{ marginBottom: 12 }}>Profile Background</Forms.FormTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Type</Forms.FormTitle>
                            <select
                                value={s.backgroundType}
                                onChange={e => { settings.store.backgroundType = e.target.value as any; requestReload(); }}
                                style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)", minWidth: 200 }}
                            >
                                <option value="none">None</option>
                                <option value="solid">Solid Color</option>
                                <option value="gradient">Gradient</option>
                                <option value="pattern">Pattern</option>
                                <option value="image">Image</option>
                            </select>
                        </div>

                        {s.backgroundType !== "none" && (
                            <>
                                {s.backgroundType === "solid" && (
                                    <ColorField
                                        title="Color"
                                        value={s.backgroundColor}
                                        onChange={v => { settings.store.backgroundColor = v; requestReload(); }}
                                    />
                                )}
                                {s.backgroundType === "pattern" && (
                                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 100 }}>Pattern</Forms.FormTitle>
                                            <select
                                                value={s.backgroundPattern}
                                                onChange={e => { settings.store.backgroundPattern = e.target.value as any; requestReload(); }}
                                                style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                                            >
                                                <option value="dots">Dots</option>
                                                <option value="grid">Grid</option>
                                                <option value="lines">Lines</option>
                                                <option value="mesh">Mesh</option>
                                            </select>
                                        </div>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 80 }}>Opacity</Forms.FormTitle>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={Math.round((s.backgroundPatternOpacity ?? 0.12) * 100)}
                                                onChange={e => { settings.store.backgroundPatternOpacity = parseInt(e.target.value, 10) / 100; requestReload(); }}
                                                style={{ width: 120 }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 80 }}>Scale</Forms.FormTitle>
                                            <input
                                                type="range"
                                                min="25"
                                                max="300"
                                                value={Math.round((s.backgroundPatternScale ?? 1) * 100)}
                                                onChange={e => { settings.store.backgroundPatternScale = parseInt(e.target.value, 10) / 100; requestReload(); }}
                                                style={{ width: 120 }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {s.backgroundType === "image" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 140 }}>Image URL (HTTPS)</Forms.FormTitle>
                                            <input
                                                type="url"
                                                value={s.backgroundImageUrl}
                                                onChange={e => { settings.store.backgroundImageUrl = e.target.value; requestReload(); }}
                                                placeholder="https://example.com/image.png"
                                                style={{ width: "100%", maxWidth: 400, padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 60 }}>Fit</Forms.FormTitle>
                                                <select
                                                    value={s.backgroundImageFit}
                                                    onChange={e => { settings.store.backgroundImageFit = e.target.value as any; requestReload(); }}
                                                    style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                                                >
                                                    <option value="cover">Cover</option>
                                                    <option value="contain">Contain</option>
                                                    <option value="fill">Fill</option>
                                                </select>
                                            </div>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                <Forms.FormTitle tag="h6" style={{ marginBottom: 6, minWidth: 80 }}>Position</Forms.FormTitle>
                                                <select
                                                    value={s.backgroundImagePosition}
                                                    onChange={e => { settings.store.backgroundImagePosition = e.target.value as any; requestReload(); }}
                                                    style={{ padding: "6px 10px", borderRadius: 4, background: "var(--background-tertiary)", border: "1px solid var(--background-modifier-accent)", color: "var(--text-normal)" }}
                                                >
                                                    <option value="center">Center</option>
                                                    <option value="top">Top</option>
                                                    <option value="bottom">Bottom</option>
                                                    <option value="left">Left</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Effects */}
                <div>
                    <Forms.FormTitle tag="h5" style={{ marginBottom: 12 }}>Effects</Forms.FormTitle>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                        <Switch
                            title="Reduce Motion"
                            value={s.reducedMotion}
                            onChange={v => { settings.store.reducedMotion = v; requestReload(); }}
                        />
                        <Switch
                            title="Enable Glow"
                            value={s.enableGlow}
                            onChange={v => { settings.store.enableGlow = v; requestReload(); }}
                        />
                    </div>
                </div>

            </div>
        </section>
    );
}

function ServerTagsEditor() {
    const { serverTags } = settings.use(["serverTags", "serverTagEnabled"]);
    const [guildId, setGuildId] = React.useState("");
    const [tag, setTag] = React.useState("");
    const [error, setError] = React.useState("");

    const addTag = () => {
        const id = guildId.trim();
        const value = tag.trim();

        if (!/^\d{17,20}$/.test(id)) {
            setError("Enter a valid server ID (17-20 digits). Enable Developer Mode, then right-click a server → Copy Server ID.");
            return;
        }
        if (!value) {
            setError("Enter a tag for this server.");
            return;
        }
        if (value.length > 20) {
            setError("Tags can be at most 20 characters.");
            return;
        }

        settings.store.serverTags = { ...serverTags, [id]: value };
        setGuildId("");
        setTag("");
        setError("");
        requestReload();
    };

    const removeTag = (guildId: string) => {
        const next = { ...serverTags };
        delete next[guildId];
        settings.store.serverTags = next;
        requestReload();
    };

    const entries = Object.entries(serverTags || {});

    const inputStyle: React.CSSProperties = {
        padding: "8px 10px",
        borderRadius: 4,
        border: "1px solid var(--background-modifier-accent)",
        background: "var(--input-background, var(--background-secondary))",
        color: "var(--text-normal)",
        outline: "none",
        fontSize: 14,
    };

    return (
        <section style={{ marginBottom: 16 }}>
            <Forms.FormTitle tag="h5" style={{ marginBottom: 8 }}>Custom Server Tags</Forms.FormTitle>
            <FormHint>
                Shows a custom tag next to your name in the member list of the configured server.
                <strong>Only visible to you in this client.</strong>
            </FormHint>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <input
                    type="text"
                    value={guildId}
                    placeholder="Server ID"
                    onChange={e => { setGuildId(e.currentTarget.value); setError(""); }}
                    style={{ ...inputStyle, width: 200 }}
                />
                <input
                    type="text"
                    value={tag}
                    placeholder="Tag"
                    maxLength={20}
                    onChange={e => { setTag(e.currentTarget.value); setError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") addTag(); }}
                    style={{ ...inputStyle, width: 160 }}
                />
                <Button size={Button.Sizes.SMALL} onClick={addTag} color={Button.Colors.BRAND}>
                    + Add Server Tag
                </Button>
            </div>

            {error && (
                <Forms.FormText style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 12 }}>
                    {error}
                </Forms.FormText>
            )}

            {entries.length === 0 ? (
                <Forms.FormText style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No custom server tags configured.
                </Forms.FormText>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {entries.map(([guildId, tag]) => (
                        <div
                            key={guildId}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "8px 12px",
                                background: "var(--background-tertiary)",
                                borderRadius: 8,
                                border: "1px solid var(--background-modifier-accent)",
                            }}
                        >
                            <Forms.FormText style={{ fontWeight: 600, minWidth: 140 }}>
                                Server: {guildId}
                            </Forms.FormText>
                            <Forms.FormText style={{ flex: 1, color: "var(--text-normal)" }}>
                                Tag: {tag}
                            </Forms.FormText>
                            <Button
                                size={Button.Sizes.SMALL}
                                onClick={() => removeTag(guildId)}
                                color={Button.Colors.RED}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function ResetSection() {
    const resetAll = () => {
        // Reset each setting to its default by iterating over definitions
        const def = settings.def as Record<string, any>;
        for (const [key, setting] of Object.entries(def)) {
            if (setting.type === OptionType.COMPONENT) continue;
            if (setting.default !== undefined) {
                (settings.store as any)[key] = setting.default;
            }
        }
        requestReload();
        showToast({ text: "All CombCord settings reset to defaults", variant: "success" });
    };

    return (
        <section style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--background-modifier-accent)" }}>
            <Forms.FormTitle tag="h5" style={{ marginBottom: 8 }}>Danger Zone</Forms.FormTitle>
            <Forms.FormText style={{ marginBottom: 12, color: "var(--text-muted)" }}>
                This will reset <strong>all</strong> CombCord settings (identity, badges, appearance) to their defaults.
            </Forms.FormText>
            <Button size={Button.Sizes.SMALL} onClick={resetAll} color={Button.Colors.RED}>
                Reset All Settings
            </Button>
        </section>
    );
}

export const settings = definePluginSettings({
    // Version info
    versionInfo: {
        type: OptionType.COMPONENT,
        component: VersionInfo,
    },

    // Identity
    identityEnabled: {
        type: OptionType.BOOLEAN,
        displayName: "Enable Identity Overrides",
        description: "Apply custom username and display name to your profile in this client.",
        default: true,
        onChange: () => requestReload(),
    },
    username: {
        type: OptionType.STRING,
        displayName: "Username Override",
        description: "Local override for your actual @handle. Leave empty to keep your real username.",
        default: "",
        placeholder: "myhandle",
        onChange: () => requestReload(),
    },
    displayName: {
        type: OptionType.STRING,
        displayName: "Display Name Override",
        description: "Local override for your profile display name (separate from username). Leave empty to keep your real display name.",
        default: "",
        placeholder: "My Display Name",
        onChange: () => requestReload(),
    },
    memberSince: {
        type: OptionType.STRING,
        displayName: "Custom Member Since",
        description: "Override your profile's 'Member Since' date. Format: YYYY-MM-DD. Leave empty to keep real date.",
        default: "",
        placeholder: "2020-01-15",
        onChange: () => requestReload(),
    },
    originalUsernameBadge: {
        type: OptionType.BOOLEAN,
        displayName: "Shortcut: Originally Known As Badge",
        description: "Adds the 'Originally Known As' badge to your mock badge selection. Requires mock badges to be enabled.",
        default: false,
        onChange: () => requestReload(),
    },
    originalUsername: {
        type: OptionType.STRING,
        displayName: "Original Username",
        description: "Text shown on the 'Originally Known As' badge. Leave empty to show the badge without a name.",
        default: "",
        placeholder: "OriginalUser#1234",
        onChange: () => requestReload(),
    },

    // Mock Badges
    mockBadgesEnabled: {
        type: OptionType.BOOLEAN,
        displayName: "Enable Mock Badges",
        description: "Show selected mock Discord badges on your profile in this client.",
        default: true,
        onChange: () => requestReload(),
    },
    mockBadgesShowDisclaimer: {
        type: OptionType.BOOLEAN,
        displayName: "Show 'Visual Replica' Disclaimer",
        description: "Append '— visual replica, not official' to badge tooltips.",
        default: true,
        onChange: () => requestReload(),
    },
    mockBadges: {
        type: OptionType.CUSTOM,
        default: [],
        hidden: true,
    },
    mockBadgesEditor: {
        type: OptionType.COMPONENT,
        component: MockBadgePicker,
    },
    appearanceEditor: {
        type: OptionType.COMPONENT,
        component: AppearanceEditor,
    },

    // Appearance
    appearanceEnabled: {
        type: OptionType.BOOLEAN,
        displayName: "Enable Profile Appearance",
        description: "Apply accent colors, avatar frames, decorations and backgrounds to your profile.",
        default: true,
        onChange: () => requestReload(),
    },
    accentMode: {
        type: OptionType.SELECT,
        displayName: "Accent Mode",
        default: "gradient",
        options: [
            { label: "Solid", value: "solid" },
            { label: "Gradient", value: "gradient", default: true },
        ],
        onChange: () => requestReload(),
    },
    accentSolid: {
        type: OptionType.STRING,
        displayName: "Solid Accent Color",
        default: "#5865f2",
        hidden: true,
        onChange: () => requestReload(),
    },
    accentGradientStart: {
        type: OptionType.STRING,
        displayName: "Gradient Start",
        default: "#5865f2",
        hidden: true,
        onChange: () => requestReload(),
    },
    accentGradientEnd: {
        type: OptionType.STRING,
        displayName: "Gradient End",
        default: "#a855f7",
        hidden: true,
        onChange: () => requestReload(),
    },
    accentGradientDirection: {
        type: OptionType.SELECT,
        displayName: "Gradient Direction",
        default: "to-br",
        hidden: () => settings.store.accentMode !== "gradient",
        options: [
            { label: "→ Right", value: "to-r" },
            { label: "← Left", value: "to-l" },
            { label: "↑ Up", value: "to-t" },
            { label: "↓ Down", value: "to-b" },
            { label: "↗ Top Right", value: "to-tr" },
            { label: "↖ Top Left", value: "to-tl" },
            { label: "↘ Bottom Right", value: "to-br", default: true },
            { label: "↙ Bottom Left", value: "to-bl" },
        ],
        onChange: () => requestReload(),
    },

    avatarFrameStyle: {
        type: OptionType.SELECT,
        displayName: "Avatar Frame Style",
        default: "gradient-ring",
        options: [
            { label: "None", value: "none" },
            { label: "Glow", value: "glow" },
            { label: "Solid Ring", value: "ring" },
            { label: "Gradient Ring", value: "gradient-ring", default: true },
            { label: "Custom SVG", value: "custom-svg" },
        ],
        onChange: () => requestReload(),
    },
    avatarFrameColor: {
        type: OptionType.STRING,
        displayName: "Frame Color",
        default: "#5865f2",
        hidden: true,
        onChange: () => requestReload(),
    },
    avatarFrameWidth: {
        type: OptionType.SLIDER,
        displayName: "Frame Width",
        default: 3,
        markers: [1, 2, 3, 4, 6, 8, 10, 12],
        stickToMarkers: true,
        hidden: () => settings.store.avatarFrameStyle === "none",
        onChange: () => requestReload(),
    },
    avatarFrameAnimated: {
        type: OptionType.BOOLEAN,
        displayName: "Animated Frame",
        default: true,
        hidden: () => settings.store.avatarFrameStyle === "none",
        onChange: () => requestReload(),
    },
    avatarFrameSvg: {
        type: OptionType.STRING,
        multiline: true,
        displayName: "Custom Frame SVG",
        default: "",
        hidden: () => settings.store.avatarFrameStyle !== "custom-svg",
        onChange: () => requestReload(),
    },

    decorationType: {
        type: OptionType.SELECT,
        displayName: "Decoration Type",
        default: "corner-accents",
        options: [
            { label: "None", value: "none" },
            { label: "Border", value: "border" },
            { label: "Corner Accents", value: "corner-accents", default: true },
            { label: "Side Bars", value: "side-bars" },
            { label: "Full Frame", value: "full-frame" },
            { label: "Background Pattern", value: "background-pattern" },
        ],
        onChange: () => requestReload(),
    },
    decorationColor: {
        type: OptionType.STRING,
        displayName: "Decoration Color",
        default: "#5865f2",
        hidden: true,
        onChange: () => requestReload(),
    },
    decorationUseAccentGradient: {
        type: OptionType.BOOLEAN,
        displayName: "Use Accent Gradient",
        default: false,
        hidden: () => settings.store.decorationType === "none",
        onChange: () => requestReload(),
    },
    decorationPattern: {
        type: OptionType.SELECT,
        displayName: "Pattern",
        default: "dots",
        options: [
            { label: "Dots", value: "dots", default: true },
            { label: "Grid", value: "grid" },
            { label: "Lines", value: "lines" },
            { label: "Mesh", value: "mesh" },
        ],
        hidden: () => settings.store.decorationType !== "background-pattern",
        onChange: () => requestReload(),
    },
    decorationPatternOpacity: {
        type: OptionType.SLIDER,
        displayName: "Pattern Opacity (%)",
        default: 12,
        markers: [0, 5, 10, 15, 25, 50, 75, 100],
        stickToMarkers: false,
        hidden: () => settings.store.decorationType !== "background-pattern",
        onChange: () => requestReload(),
    },
    decorationPatternScale: {
        type: OptionType.SLIDER,
        displayName: "Pattern Scale (%)",
        default: 100,
        markers: [25, 50, 75, 100, 150, 200, 300],
        stickToMarkers: false,
        hidden: () => settings.store.decorationType !== "background-pattern",
        onChange: () => requestReload(),
    },
    decorationAnimated: {
        type: OptionType.BOOLEAN,
        displayName: "Animated Decoration",
        default: false,
        hidden: () => settings.store.decorationType === "none",
        onChange: () => requestReload(),
    },

    backgroundType: {
        type: OptionType.SELECT,
        displayName: "Background Type",
        default: "gradient",
        options: [
            { label: "None", value: "none" },
            { label: "Solid", value: "solid" },
            { label: "Gradient", value: "gradient", default: true },
            { label: "Pattern", value: "pattern" },
            { label: "Image", value: "image" },
        ],
        onChange: () => requestReload(),
    },
    backgroundColor: {
        type: OptionType.STRING,
        displayName: "Background Color",
        default: "#1e1f22",
        hidden: true,
        onChange: () => requestReload(),
    },
    backgroundImageUrl: {
        type: OptionType.STRING,
        displayName: "Background Image URL",
        default: "",
        hidden: () => settings.store.backgroundType !== "image",
        onChange: () => requestReload(),
    },
    backgroundImageFit: {
        type: OptionType.SELECT,
        displayName: "Image Fit",
        default: "cover",
        options: [
            { label: "Cover", value: "cover", default: true },
            { label: "Contain", value: "contain" },
            { label: "Fill", value: "fill" },
        ],
        hidden: () => settings.store.backgroundType !== "image",
        onChange: () => requestReload(),
    },
    backgroundImagePosition: {
        type: OptionType.SELECT,
        displayName: "Image Position",
        default: "center",
        options: [
            { label: "Center", value: "center", default: true },
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
        ],
        hidden: () => settings.store.backgroundType !== "image",
        onChange: () => requestReload(),
    },
    backgroundPattern: {
        type: OptionType.SELECT,
        displayName: "Pattern",
        default: "dots",
        options: [
            { label: "Dots", value: "dots", default: true },
            { label: "Grid", value: "grid" },
            { label: "Lines", value: "lines" },
            { label: "Mesh", value: "mesh" },
        ],
        hidden: () => settings.store.backgroundType !== "pattern",
        onChange: () => requestReload(),
    },
    backgroundPatternOpacity: {
        type: OptionType.SLIDER,
        displayName: "Pattern Opacity (%)",
        default: 12,
        markers: [0, 5, 10, 15, 25, 50, 75, 100],
        stickToMarkers: false,
        hidden: () => settings.store.backgroundType !== "pattern",
        onChange: () => requestReload(),
    },
    backgroundPatternScale: {
        type: OptionType.SLIDER,
        displayName: "Pattern Scale (%)",
        default: 100,
        markers: [25, 50, 75, 100, 150, 200, 300],
        stickToMarkers: false,
        hidden: () => settings.store.backgroundType !== "pattern",
        onChange: () => requestReload(),
    },

    reducedMotion: {
        type: OptionType.BOOLEAN,
        displayName: "Reduce Motion",
        description: "Disable animations (respects prefers-reduced-motion).",
        default: false,
        onChange: () => requestReload(),
    },
    enableGlow: {
        type: OptionType.BOOLEAN,
        displayName: "Enable Glow Effects",
        default: true,
        onChange: () => requestReload(),
    },

    // Server Tags
    serverTagEnabled: {
        type: OptionType.BOOLEAN,
        displayName: "Enable Custom Server Tags",
        description: "Show a custom tag next to your name in the member list of the configured server. Local to this client.",
        default: true,
        onChange: () => requestReload(),
    },
    serverTags: {
        type: OptionType.CUSTOM,
        default: {},
        hidden: true,
    },
    serverTagsEditor: {
        type: OptionType.COMPONENT,
        component: ServerTagsEditor,
    },

    // Reset
    resetSection: {
        type: OptionType.COMPONENT,
        component: ResetSection,
    },
}).withPrivateSettings<{ reload: () => void }>();