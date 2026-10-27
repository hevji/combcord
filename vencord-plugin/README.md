# CombCord for Vencord

**Version 0.0.1**

A [Vencord](https://vencord.dev) **userplugin** that applies local profile
customizations inside the Discord desktop app.

Vencord owns the injection, ASAR patching and Discord-update compatibility.
This folder only contains plugin code — there is no separate injector to
maintain.

> **Not affiliated with Discord or Vencord.** Client mods are against Discord's
> Terms of Service. Use at your own risk, on an account you can afford to lose.

---

## What it does

| Feature | In Discord | Notes |
| --- | --- | --- |
| Custom username | ✅ | Your actual @handle (local only) |
| Custom display name | ✅ | Profile display name (local only) |
| Custom Member Since | ✅ | Override "Member Since" date (YYYY-MM-DD) |
| Original Username Badge | ✅ | Shows your real Discord username as a badge |
| Mock Discord badges | ✅ | 23+ visual replicas (Staff, Bug Hunter, HypeSquad, Nitro, Boosting, etc.) — only on your profile |
| Custom Server Tags | ✅ | Per-server tags next to your name (client-side) |
| Accent colors / gradients | ✅ | Applied through Discord's native profile theme colors |
| Avatar frames | ✅ | Glow, solid ring, gradient ring, custom SVG |
| Profile decorations | ⚠️ | Border, side bars, corner accents, background patterns — CSS approximations |
| Profile backgrounds | ✅ | Solid, gradient, pattern, or image with blur/opacity |

All changes are **local to your client**. Nothing is sent to Discord servers.

---

## Installation

### Prerequisites

- Node.js 22+
- pnpm 11+ (`npm install -g pnpm@11.9.0`)
- Git

### Automated (recommended)

From the **repository root**:

```cmd
run.bat
```

This single command:
1. Closes Discord (all variants)
2. Syncs plugin source to Vencord
3. Builds Vencord with the plugin
4. Injects into Discord Stable

### Manual (PowerShell)

```powershell
# From repository root
.\vencord-plugin\install.ps1
# Then
cd %LOCALAPPDATA%\combcord\vencord
pnpm run build
node scripts/runInstaller.mjs -- -install -branch stable
```

---

## Usage

1. Open Discord → **User Settings** → **Vencord** → **Plugins**
2. Enable **CombCord**
3. Click the **CombCord** plugin settings (gear icon)
4. Customize:
   - **Identity** — @username, display name, Member Since, Original Username badge
   - **Mock Discord Badges** — 23+ badge replicas with disclaimer toggle
   - **Custom Server Tags** — per-server tags (Guild ID + tag)
   - **Profile Appearance** — colors, frames, decorations, backgrounds
5. Open your own profile to preview

---

## Mock Badges (23+)

| Category | Badges |
| --- | --- |
| **Special** | Staff, Partnered Server Owner, Bug Hunter, Golden Bug Hunter, Early Verified Bot Developer, Active Developer, Early Supporter, Certified Moderator, Discord Nitro, **Nitro Classic**, **Nitro Basic** |
| **HypeSquad** | Bravery, Brilliance, Balance, Events |
| **Server Boosting** | 1, 2, 3, 6, 9, 12, 15, 18, 24 months |
| **Mock** | Owner (cosmetic), **Original Username** |

- **Visual replicas only** — no real badges/privileges granted
- **Disclaimer toggle** — optionally show "visual replica, not official" in tooltips
- Artwork from MIT-licensed [merlinfuchs/discord-badges](https://github.com/merlinfuchs/discord-badges)

---

## Configuration

All settings in **Discord → Settings → Vencord → Plugins → CombCord**:

```
Identity
├── Enable Identity Overrides
├── Username Override
├── Display Name Override
├── Custom Member Since (YYYY-MM-DD)
└── Show Original Username Badge

Mock Discord Badges
├── Enable Mock Badges
├── Show "Visual Replica" Disclaimer
└── Badge Picker (23+ badges)

Custom Server Tags
├── Enable Custom Server Tags
└── Server Tags Editor

Profile Appearance
├── Accent Colors (Solid/Gradient + Color Pickers)
├── Avatar Frames (Glow/Ring/Gradient/Custom SVG)
├── Decorations (Border/Corners/Sides/Frame/Patterns)
├── Backgrounds (Solid/Gradient/Pattern/Image)
└── Effects (Reduce Motion / Enable Glow)
```

Changes apply instantly. Settings persist in Vencord's `settings.json`.

---

## Development

```bash
# From repository root
npm test      # Run config tests
npm run lint  # Lint plugin code
.\run.bat     # Full rebuild + inject
```

---

## Limitations

- Only **your own profile** customized
- Changes are **client-side only**
- Discord updates may break patches — rebuild with `run.bat`
- Requires Vencord (not BetterDiscord compatible)
- Mock badges are visual replicas only

---

## License

| Component | License |
| --- | --- |
| CombCord Plugin | GPL-3.0-or-later |
| Mock Badge SVGs | MIT (see `THIRD_PARTY_NOTICES.md`) |
| Vencord | GPL-3.0-or-later |