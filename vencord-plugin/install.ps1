param(
    [string]$VencordPath = "",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$pluginSource = Join-Path $PSScriptRoot "combcord"

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Fail($message) {
    Write-Host ""
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

function Require-Command($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Fail "Missing '$name'. $hint"
    }
}

Write-Host ""
Write-Host "CombCord - Vencord userplugin installer" -ForegroundColor Magenta

if (-not (Test-Path $pluginSource)) {
    Fail "Plugin source not found at $pluginSource"
}

Require-Command git "Install Git from https://git-scm.com/download/win"
Require-Command node "Install Node.js 22 or newer from https://nodejs.org"
Require-Command npm "npm should ship with Node.js"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Step "pnpm not found. Installing pnpm 11.9.0 globally via npm"
    & npm install -g pnpm@11.9.0
    if ($LASTEXITCODE -ne 0) {
        Fail "Could not install pnpm. Run 'npm install -g pnpm@11.9.0' manually and re-run this script."
    }
}

$nodeMajor = [int]((& node --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) {
    Fail "Vencord requires Node.js 22 or newer. Found $(& node --version)."
}

if (-not $VencordPath) {
    $VencordPath = Join-Path (Split-Path $PSScriptRoot -Parent) "vencord-fork"
}

Write-Step "Using Vencord at: $VencordPath"

if (-not (Test-Path $VencordPath)) {
    Write-Step "Cloning Vencord (shallow)"
    $parent = Split-Path $VencordPath -Parent
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force $parent | Out-Null
    }
    & git clone --depth 1 https://github.com/Vendicated/Vencord.git $VencordPath
    if ($LASTEXITCODE -ne 0) { Fail "git clone failed." }
} else {
    $pkg = Join-Path $VencordPath "package.json"
    if (-not (Test-Path $pkg)) {
        Fail "'$VencordPath' exists but does not look like a Vencord checkout (missing package.json). Pass -VencordPath explicitly."
    }
    Write-Host "Reusing existing Vencord checkout."
}

$pluginsDir = Join-Path $VencordPath "src\plugins"
$target = Join-Path $pluginsDir "combcord"

Write-Step "Copying plugin into $target"
if (-not (Test-Path $pluginsDir)) {
    New-Item -ItemType Directory -Force $pluginsDir | Out-Null
}

if (Test-Path $target) {
    Remove-Item -Recurse -Force $target
}
New-Item -ItemType Directory -Force $target | Out-Null
Copy-Item -Recurse -Force (Join-Path $pluginSource "*") $target

# These files belong to the CombCord repo only; Vencord bundles the plugin
# from index.tsx and would otherwise try to treat this folder as a package.
Remove-Item (Join-Path $target "package.json") -ErrorAction SilentlyContinue
Remove-Item (Join-Path $target "config.test.ts") -ErrorAction SilentlyContinue

Write-Step "Installing Vencord dependencies"
Push-Location $VencordPath
try {
    if (-not (Test-Path (Join-Path $VencordPath "node_modules"))) {
        # Approve esbuild postinstall script (required by pnpm 9+)
        & pnpm approve-builds esbuild
        & pnpm install --frozen-lockfile
        if ($LASTEXITCODE -ne 0) { Fail "pnpm install failed." }
    } else {
        Write-Host "node_modules already present, skipping install."
    }

    if (-not $SkipBuild) {
        Write-Step "Building Vencord with the CombCord plugin"
        & pnpm build
        if ($LASTEXITCODE -ne 0) { Fail "Vencord build failed. Check the output above." }
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run: .\combcord.bat"
Write-Host "     (builds, closes Discord, injects, then starts Discord)"
Write-Host "  2. Open Settings -> Vencord -> Plugins and enable 'CombCord'."
Write-Host "  3. Open Settings -> Vencord -> Plugins -> CombCord to customize your profile."
Write-Host ""
Write-Host "Vesktop users: use Vencord's 'Build standalone' output instead of injecting Discord." -ForegroundColor DarkGray