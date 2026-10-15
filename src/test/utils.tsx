import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { I18nProvider, type Lang } from "@/i18n";

export function renderWithProviders(
  ui: ReactElement,
  {
    lang = "en",
    route = "/",
  }: {
    lang?: Lang;
    route?: string | { pathname: string; state?: unknown };
  } = {},
) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider initial={lang}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}
