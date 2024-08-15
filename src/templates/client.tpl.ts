export default `import { createElement } from "react";

import ClientEntry from "persei/components/ClientEntry";
import ErrorBoundary from "persei/components/ErrorBoundary";

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
    
    const ClientComponent = (
      <ClientEntry
        wrapper={__wrapper}
        routes={routes}
        settings={settings}
        routeProps={routeProps}
        session={session}
        data={data}
      />
    );

    {{render}}
    {{pwaEnabled}}
  }
}
`