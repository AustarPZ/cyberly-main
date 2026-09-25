import { act, fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import DashboardWellnessTip from './DashboardWellnessTip';

async function setup(tips) {
  const i18n = createInstance();
  await i18n.init({ lng: 'en', fallbackLng: false, resources: { en: { translation: { dashboard: { tips, astra: { wellnessTip: 'Wellness Tip', anotherTip: 'Another tip' } } } } } });
  return render(<I18nextProvider i18n={i18n}><DashboardWellnessTip /></I18nextProvider>);
}
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
test('fresh entry chooses a tip; elapsed time and ordinary rerenders never rotate it', async () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  const first = await setup({ phishing: 'Pause', password: 'Protect' });
  expect(screen.getByText('Pause')).toBeVisible();
  jest.useFakeTimers();
  act(() => jest.advanceTimersByTime(3600000));
  expect(screen.getByText('Pause')).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name:/Another tip/}));
  expect(screen.getByText('Protect')).toBeVisible();
  first.unmount(); random.mockReturnValue(0.99);
  await setup({ phishing: 'Pause', password: 'Protect' });
  expect(screen.getByText('Protect')).toBeVisible();
});
test('one eligible tip has no meaningless change control', async () => {
  await setup({ phishing: 'Pause' });
  expect(screen.getByText('Pause')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
test('no eligible tips omits the panel', async () => {
  const {container} = await setup({});
  expect(container).toBeEmptyDOMElement();
});
