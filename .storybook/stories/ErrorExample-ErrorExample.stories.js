// @ts-check
import { ErrorExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ErrorExample>} */
const meta = {
  title: 'Shell/ErrorBoundary',
  component: ErrorExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ErrorBoundary.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Healthy = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Failed = { args: { fails: true } };
