# AetherPulse — Desktop App (Electron)

This package wraps the AetherPulse web app in an Electron shell, producing a
native desktop app for Windows (.exe), macOS (.dmg), and Linux (.AppImage).

## Building the EXE

### Requirements
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Windows: no extra deps for building a Windows installer
- macOS: Xcode CLI tools for macOS build
- Linux: `dpkg`, `fakeroot` for .deb; `AppImageTool` for .AppImage

### Steps

1. **Clone the repo and install deps**
   ```bash
   git clone <your-repo-url>
   cd <repo>
   pnpm install
   ```

2. **Set environment variables for the web build**
   Create `artifacts/aetherpulse/.env.production`:
   ```
   VITE_API_URL=http://your-server.com
   ```
   (If you run your own server. For local-only builds, the app uses relative URLs.)

3. **Build the Windows installer**
   ```bash
   cd artifacts/electron
   pnpm run package:win
   ```
   The installer will be at `artifacts/electron/release/AetherPulse Setup 1.0.0.exe`

4. **Build macOS DMG**
   ```bash
   pnpm run package:mac
   ```

5. **Build Linux AppImage + .deb**
   ```bash
   pnpm run package:linux
   ```

6. **Build all platforms at once** (requires all toolchains)
   ```bash
   pnpm run package:all
   ```

## Development

To run the Electron app in development mode (connects to the running Vite dev server):
```bash
# In terminal 1: start the web server
pnpm --filter @workspace/aetherpulse run dev

# In terminal 2: start Electron
cd artifacts/electron
pnpm install
AETHERPULSE_PORT=26020 pnpm run dev
```

## Notes

- The Electron app loads the pre-built web app from `../aetherpulse/dist/public`
  in production, so the web build must run before packaging.
- WebRTC peer-to-peer connections work natively in Electron (uses Chromium).
- Screen sharing works without additional permissions on Windows/Linux.
  On macOS, the user must grant "Screen Recording" permission in System Preferences.
- The app uses a dark titlebar on macOS (hiddenInset) and a native frame on Windows.

## Adding an app icon

Place the following icon files in `artifacts/electron/assets/`:
- `icon.ico` — Windows (256×256 recommended)
- `icon.icns` — macOS
- `icon.png` — Linux (512×512)

You can generate all formats from a single PNG using a tool like
[electron-icon-maker](https://github.com/jaretburkett/electron-icon-maker).
