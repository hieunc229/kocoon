import { createElement, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { AppContainer } from 'react-hot-loader';
import { render } from "@hot-loader/react-dom";

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
    
    if (NODE_ENV === "production") {
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
    } else {
      render(<StrictMode>
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
      </StrictMode>, root)
    }

    if (module.hot) {
      module.hot.accept()
    }
  }
}
