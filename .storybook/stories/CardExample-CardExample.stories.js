// @ts-check
import { CardExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof CardExample>} */
const meta = {
  title: 'UI/Card',
  component: CardExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Card.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
