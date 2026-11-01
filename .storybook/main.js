import { fileURLToPath } from 'node:url';

/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: ['./stories/**/*.stories.js'],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: fileURLToPath(
          new URL('./vite.config.js', import.meta.url),
        ),
      },
    },
  },
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  typescript: { reactDocgen: 'react-docgen-typescript', reactDocgenTypescriptOptions: { tsconfigPath: fileURLToPath(new URL('../tsconfig.storybook.json', import.meta.url)) } },
  viteFinal: async (config) => ({ ...config, build: { ...config.build, chunkSizeWarningLimit: 1600 } }),
  core: { disableTelemetry: true },
};
export default config;
