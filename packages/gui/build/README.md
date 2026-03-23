# App Icons

Place app icons here before packaging:

| File | Size | Platform |
|------|------|----------|
| `icon.ico` | 256×256 (multi-res ICO) | Windows |
| `icon.icns` | 512×512 (ICNS) | macOS |
| `icon.png` | 512×512 PNG | Linux |

Icons are referenced in `electron-builder.yml`. Without icons, electron-builder
uses the default Electron icon for tester builds.

To generate all formats from a single 1024×1024 PNG source:
```
npx electron-icon-builder --input=icon-1024.png --output=./
```
