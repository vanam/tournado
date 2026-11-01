// @ts-check
import { createElement } from 'react';
import * as fixtures from '../fixtures';
import { PlayerEntryItem } from '../../src/components/groupstage/PlayerEntryItem';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerEntryItem>} */
const meta = {
  title: 'Groups/PlayerEntry',
  component: PlayerEntryItem,
  tags: ['autodocs'],
  args: { player: fixtures.qualifier, groupLabel: 'A', tagType: 'qualifier' },
  parameters: { sourceFiles: ['components/groupstage/PlayerEntryItem.tsx'] },
  render: (args) =>
    createElement('ul', {}, createElement(PlayerEntryItem, args)),
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Qualifier = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Lucky = { args: { player: fixtures.lucky, tagType: 'lucky' } };
