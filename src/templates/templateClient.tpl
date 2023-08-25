import { createElement, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { AppContainer } from 'react-hot-loader';

import ClientEntry from "rumbo/components/ClientEntry";
import ErrorBoundary from "rumbo/components/ErrorBoundary"


{{imports}}

const __context = null;

if (typeof document !== "undefined") {
  const root = document.querySelector("#root");
  if (root) {
    const {data={},settings={},globalData={}, session={},routeProps={}} = JSON.parse(document.querySelector("#ssr-data")?.innerHTML || "{}");
    const routes = [{{routes}}];

    globalData &&
      Object.entries(globalData).forEach(([k, v]) => (window[k] = v));
      
    hydrateRoot(
      root,
      <StrictMode>
        <AppContainer>
          <ClientEntry
            context={__context}
            routes={routes}
            settings={settings}
            routeProps={routeProps}
            session={session}
            data={data}
          />
        </AppContainer>
      </StrictMode>
    );

    if (module.hot) {
      module.hot.accept()
    }
  }
}
