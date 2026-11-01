// @ts-check
import { ParticipantInputExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ParticipantInputExample>} */
const meta = {
  title: 'Players/ParticipantInput',
  component: ParticipantInputExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/common/ParticipantPlayerInput.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Singles = { args: { teamSize: 1 } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Incomplete = { args: { incomplete: true } };
