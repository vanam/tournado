// @ts-check
import { FieldExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof FieldExample>} */
const meta = {
  title: 'UI/Fields',
  component: FieldExample,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: [
      'components/ui/Label.tsx',
      'components/ui/FieldGroupLabel.tsx',
    ],
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
