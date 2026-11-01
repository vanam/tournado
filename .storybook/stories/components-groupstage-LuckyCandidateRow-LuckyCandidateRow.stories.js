// @ts-check
import { createElement } from 'react';
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { LuckyCandidateRow } from '../../src/components/groupstage/LuckyCandidateRow';
/** @satisfies {import('@storybook/react-vite').Meta<typeof LuckyCandidateRow>} */
const meta = {
  title: 'Groups/LuckyCandidateRow',
  component: LuckyCandidateRow,
  tags: ['autodocs'],
  args: {
    player: fixtures.lucky,
    index: 0,
    groupLabel: 'A',
    isLucky: true,
    showBalls: true,
    isExpanded: true,
    onToggle: fn(),
  },
  parameters: { sourceFiles: ['components/groupstage/LuckyCandidateRow.tsx'] },
  render: (args) =>
    createElement(
      'table',
      {},
      createElement('tbody', {}, createElement(LuckyCandidateRow, args)),
    ),
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Expanded = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Collapsed = { args: { isExpanded: false } };
