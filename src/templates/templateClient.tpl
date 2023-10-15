import { createElement, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { AppContainer } from 'react-hot-loader';
import { render } from "@hot-loader/react-dom";

import ClientEntry from "rumbo/components/ClientEntry";
import ErrorBoundary from "rumbo/components/ErrorBoundary";
import { register } from "rumbo/serviceWorkerRegistration";


{{imports}}

// @ts-ignore
const __wrapper = typeof __container !== "undefined" ? __container : null;

if (typeof document !== "undefined") {
  const root = document.querySelector("#root");
  if (root) {
    const {data={},settings={},globalData={}, session={},routeProps={}} = JSON.parse(document.querySelector("#ssr-data")?.innerHTML || "{}");
    const routes = [{{routes}}];

    globalData &&
      Object.entries(globalData).forEach(([k, v]) => (window[k] = v));
    
    // @ts-ignore
    if (NODE_ENV === "development" || renderStrategy === "render") {
      render(<StrictMode>
        <AppContainer>
          <ClientEntry
            wrapper={__wrapper}
            routes={routes}
            settings={settings}
            routeProps={routeProps}
            session={session}
            data={data}
          />
        </AppContainer>
      </StrictMode>, root);
    } else {
      hydrateRoot(
        root,
        <StrictMode>
          <ClientEntry
            wrapper={__wrapper}
            routes={routes}
            settings={settings}
            routeProps={routeProps}
            session={session}
            data={data}
          />
        </StrictMode>
      );
    }

    if (module['hot']) {
      module['hot'].accept()
    }
  }
}

if (pwaEnabled) {
  register()
}