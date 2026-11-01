// @ts-check
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
/** @satisfies {import('@storybook/react-vite').Meta<typeof LanguageSwitcher>} */
const meta = {
  title: 'Shell/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/LanguageSwitcher.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole('combobox'));
    await userEvent.click(
      body.getByRole('option', { name: 'CS', exact: true }),
    );
    await waitFor(() =>
      expect(canvasElement.ownerDocument.documentElement).toHaveAttribute(
        'lang',
        'cs',
      ),
    );
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Czech = { globals: { language: 'cs' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const German = { globals: { language: 'de' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Spanish = { globals: { language: 'es' } };
