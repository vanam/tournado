import { createElement } from 'react';
import '../src/index.css';
import { StoryProviders } from './providers';
import { resetStoryDatabase } from './database';

/** @type {import('@storybook/react-vite').Preview} */
const preview = {
  initialGlobals: { theme: 'dark', language: 'en' },
  globalTypes: {
    theme: {
      description: 'Application theme',
      toolbar: {
        icon: 'circlehollow',
        items: ['dark', 'light'],
        dynamicTitle: true,
      },
    },
    language: {
      description: 'Application language',
      toolbar: {
        icon: 'globe',
        items: ['en', 'cs', 'de', 'es'],
        dynamicTitle: true,
      },
    },
  },
  loaders: [
    async (context) => ({
      db: await resetStoryDatabase(context.parameters.empty === true),
    }),
  ],
  decorators: [
    (Story, context) =>
      createElement(StoryProviders, {
        db: context.loaded.db,
        tournament: context.parameters.tournament,
        route: context.parameters.route,
        routeState: context.parameters.routeState,
        theme: context.globals.theme,
        language: context.globals.language,
        children: createElement(Story),
      }),
  ],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    // Iframes isolate portals, providers and memory databases between documentation examples.
    docs: { story: { inline: false, iframeHeight: '600px' } },
    options: {
      storySort: {
        order: [
          'UI',
          'Common',
          'Players',
          'Tournament',
          'Formats',
          'Groups',
          'Dialogs',
          'Shell',
          'Pages',
        ],
      },
    },
  },
};
export default preview;
