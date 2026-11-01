// @ts-check
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { DataPage } from '../../src/pages/DataPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof DataPage>} */
const meta = {
  title: 'Pages/Data',
  component: DataPage,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['pages/DataPage.tsx'], ...{ route: '/data' } },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: {}, parameters: { empty: true } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const InvalidImport = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[type=file]');
    if (!(input instanceof HTMLInputElement))
      throw new Error('Missing file input');
    await userEvent.upload(
      input,
      new File(['{"version":4}'], 'broken.json', { type: 'application/json' }),
    );
    await waitFor(() =>
      expect(within(canvasElement).getByText(/invalid/i)).toBeVisible(),
    );
  },
};
