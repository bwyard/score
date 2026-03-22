 
// electron-forge types resolve after `pnpm install`

import { VitePlugin }             from '@electron-forge/plugin-vite'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'

// ForgeConfig type lives in @electron-forge/shared-types (transitive dep).
// Using inferred type avoids a direct dep on the shared-types package.
const config = {
  packagerConfig: {
    asar: true,
    name: 'Score Studio',
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: {} },
    { name: '@electron-forge/maker-zip',      platforms: ['darwin', 'linux'] },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        { entry: 'src/main/main.ts',    config: 'vite.main.config.ts',    target: 'main'    },
        { entry: 'src/main/preload.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [
        { name: 'main_window', config: 'vite.renderer.config.ts' },
      ],
    }),
  ],
}

export default config
