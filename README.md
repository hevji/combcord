# CombCord

**Version 0.1.1-BETA**

A local-first Discord profile customization plugin for [Vencord](https://vencord.dev).

All customization happens **inside Discord** — no external website, no JSON copy/paste, no separate app. Everything is configured through Vencord's native settings UI.

---

## ✨ Features

### 🎭 Identity Customization
- **Username Override** — Change your `@handle` locally
- **Display Name Override** — Change your profile display name locally
- **Custom Member Since** — Override your "Member Since" date (format: `YYYY-MM-DD`)
- **Original Username Badge** — Show a badge with your real Discord username

### 🏷️ Mock Discord Badges
Visual replicas of official Discord badges (**85 badges** from [dev-hoehle/discord-badges](https://github.com/dev-hoehle/discord-badges)). Shown only on **your own profile** in this client. No real badges granted.

| Category | Badges |
|----------|--------|
| **Special** | Discord Staff, Partnered Server Owner, Bug Hunter, Golden Bug Hunter, Early Verified Bot Developer, Active Developer, Early Supporter, Certified Moderator, Discord Nitro, Nitro Classic, Nitro Basic, Orbs Apprentice, Originally Known As |
| **HypeSquad** | Bravery, Brilliance, Balance, Events |
| **Server Boosting** | 1, 2, 3, 6, 9, 12, 15, 18, 24 months |
| **Gifting** | Gift Subscriptions |
| **Account Age** | 1, 2, 3, 4, 5+ years |
| **Streaming** | Streaming |
| **Game Time** | Game Time |
| **Game Variety** | Game Variety |
| **Application** | Application |
| **Mock** | Owner (Mock), Originally Known As |

- **Disclaimer Toggle** — Optionally show "visual replica, not official" in tooltips
- **Multiple Selection** — Pick any combination of badges
- **Searchable Picker** — Filter by name/group, selected badges outlined

### 🏷️ Custom Server Tags
- Set custom tags that appear next to your name in specific servers
- Per-server (by Guild ID) — only visible to you in this client
- Add/remove tags via the built-in editor

### 🎨 Profile Appearance
- **Accent Colors** — Solid or multi-stop gradients (8 directions)
- **Avatar Frames** — None, Glow, Solid Ring, Gradient Ring, Custom SVG
- **Decorations** — Border, Corner Accents, Side Bars, Full Frame, Background Patterns
- **Backgrounds** — Solid, Gradient, Pattern, Image (with blur/opacity)
- **Color Pickers** — Native color inputs for all color options
- **Effects** — Reduce Motion, Enable Glow

---

## 📦 Installation

### Prerequisites
- **Node.js 22+**
- **pnpm 11+** (`npm install -g pnpm@11.9.0`)
- **Git**

### Quick Install
```cmd
# Clone this repo
git clone https://github.com/yourusername/combcord.git
cd combcord

# One command: setup + build + inject + start Discord
combcord.bat
```

### Commands

Everything is driven by `combcord.bat`:

| Command | What it does |
| --- | --- |
| `combcord.bat` | Build + start Discord (no patch) |
| `combcord.bat build` | Sync plugin source and build Vencord |
| `combcord.bat inject` | Close Discord, start Discord (loads from `dist\`) |
| `combcord.bat patch` | Close Discord, **patch app.asar**, start Discord *(first install / Discord update only)* |
| `combcord.bat setup` | Clone/update the Vencord fork and install dependencies |
| `combcord.bat watch` | Rebuild automatically on file changes |
| `combcord.bat start` | Start Discord only |
| `combcord.bat status` | Show fork path, version, build and Discord state |

### Where the Vencord fork lives

Inside this project:

```
combcord\
└── vencord-fork\
```

CombCord is copied to `vencord-fork\src\plugins\combcord` and built into
`vencord-fork\dist`.

To use a different location, set `COMBCORD_VENCORD_DIR` before running
`combcord.bat`.

### What `combcord.bat inject` does (daily use — no logout)

1. **Closes Discord** (Stable, Canary, PTB, Development) and verifies it is closed
2. **Starts Discord** — loads plugin from `vencord-fork\dist\` (no app.asar modification)

### What `combcord.bat patch` does (first install / Discord update only)

1. **Closes Discord** and verifies it is closed
2. **Patches `app.asar`** using `node scripts/runInstaller.mjs -- -repair -branch stable`
3. **Starts Discord** afterwards

> ⚠️ `patch` replaces `app.asar` — Discord will log you out. Use only when needed.

### After First Install / Patch
1. Open Discord
2. **Settings → Vencord → Plugins**
3. Enable **CombCord**
4. Click the **gear icon** next to CombCord to open settings

---

## ⚙️ Configuration

All settings live in **Discord → Settings → Vencord → Plugins → CombCord**:

```
CombCord Settings
├── Identity
│   ├── Enable Identity Overrides
│   ├── Username Override
│   ├── Display Name Override
│   ├── Custom Member Since (YYYY-MM-DD)
│   └── Show Original Username Badge
├── Mock Discord Badges
│   ├── Enable Mock Badges
│   ├── Show "Visual Replica" Disclaimer
│   └── Badge Picker (85 badges, searchable, selected ones outlined)
├── Custom Server Tags
│   ├── Enable Custom Server Tags
│   └── Server Tags Editor (+ Add / Remove)
└── Profile Appearance
    ├── Accent Colors (Solid/Gradient + Color Pickers)
    ├── Avatar Frames (Glow/Ring/Gradient/Custom SVG)
    ├── Decorations (Border/Corners/Sides/Frame/Patterns)
    ├── Backgrounds (Solid/Gradient/Pattern/Image)
    └── Effects (Reduce Motion / Enable Glow)
```

Changes apply **instantly** — open your profile to preview.

---

## 🔧 Development

```bash
# Run tests
pnpm test

# Lint plugin code
pnpm run lint

# One-command rebuild + inject + start
.\combcord.bat

# Or watch while developing (terminal 1), then patch (terminal 2)
.\combcord.bat watch
.\combcord.bat inject
```

### Project Structure
```
combcord/
├── vencord-plugin/
│   ├── combcord/           # Plugin source
│   │   ├── index.tsx       # Main plugin entry
│   │   ├── config.ts       # Pure config/helpers (testable)
│   │   ├── settings.tsx    # Vencord settings UI
│   │   ├── badges.tsx      # Mock badge registration
│   │   ├── usernames.ts    # Username/display name patches
│   │   ├── css.ts          # Profile appearance CSS
│   │   ├── tagger.ts       # Profile tagging + Member Since override
│   │   ├── mockBadges.ts   # 85 badge SVGs
│   │   └── state.ts        # Reload bridge
│   ├── install.ps1         # Fork setup / plugin sync (used by combcord.bat)
│   ├── THIRD_PARTY_NOTICES.md
│   └── README.md
├── vencord-fork/           # Vencord checkout the plugin is built into
├── combcord.bat            # The only batch file: build/inject/setup/status
├── package.json            # Root scripts (test, lint)
├── vitest.config.ts        # Test config
└── README.md               # This file
```

---

## 📋 Version History

| Version | Date | Changes |
|---------|------|---------|
| **0.1.1-BETA** | 2026-10-27 | Fixed color picker UI (aligned, responsive, no lag); removed black background from badges; separated `inject` (no logout) from `patch` (first install); 85 badges from dev-hoehle/discord-badges |
| **0.1.0** | 2026-10-27 | Moved Vencord fork into project; fixed React error #130; color pickers with swatch + hex; native OS color picker; 85 badges; robust Discord close logic |
| **0.0.9** | 2026-10-26 | Color picker component; hidden duplicate hex fields; reactive AppearanceEditor |
| **0.0.8** | 2026-10-26 | Server tag inline editor; Original Username badge rework; badge picker search + outline |
| **0.0.1** | 2026-10-26 | Initial release: Identity, Mock Badges, Server Tags, Member Since, Original Username Badge, Nitro Classic/Basic, Profile Appearance (colors, frames, decorations, backgrounds), Color Pickers, Auto-sync on build |

---

## ⚠️ Limitations & Disclaimers

- **Client-side only** — Nothing sent to Discord servers
- **Your profile only** — Other users see real Discord data
- **Discord updates may break patches** — Rebuild with `run.bat` after Discord updates
- **Requires Vencord** — Not compatible with BetterDiscord, etc.
- **Visual replicas only** — Mock badges grant no real entitlements
- **Not affiliated** with Discord or Vencord. Client mods violate Discord ToS.

---

## 📄 Licenses

| Component | License |
|-----------|---------|
| CombCord Plugin | **GPL-3.0-or-later** (matches Vencord) |
| Mock Badge SVGs | **MIT** — from [merlinfuchs/discord-badges](https://github.com/merlinfuchs/discord-badges) |
| Vencord | **GPL-3.0-or-later** |

See [`vencord-plugin/THIRD_PARTY_NOTICES.md`](vencord-plugin/THIRD_PARTY_NOTICES.md) for details.

---

## 🙏 Credits

- **Vencord** — Injection, patching, plugin API
- **merlinfuchs/discord-badges** — Official Discord badge SVGs (MIT)
- **Discord** — The platform we're customizing