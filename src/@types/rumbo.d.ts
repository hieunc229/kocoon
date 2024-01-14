type RumboAppType = "server" | "client-ssr" | "client-spa" | "static";

type RumboAppProps = {
  location: string;
  type: RumboAppType;

  /**
   * Enable React Router (react-router-dom)
   * If your app is client-ssr, and already have router, set to `false`
   */
  clientUseRouter?: boolean;
  excludePaths?: string[]
};

type RumboAppConfigs = RumboAppProps & {
  route: string;
};

type RumboRouteProps = { [route: string]: RumboAppProps };

type RumboProps = {
  debug?: boolean;
  pwaEnabled?: boolean;
  publicDir?: string;
  distDir?: string;
  rootDir?: string;
  routes: RumboRouteProps;
  staticExtensions?: string;
  renderStrategy?: "auto" | "render" | "hydrate",
  statics?: { path: string, location: string }[]
  staticRoutes: null | {
    [route: string]: { [subRoute: string]: RumboStaticRoute };
  };
  listen?:
    | boolean
    | {
        host?: string;
        port?: number;
      };
};

type RumboStaticRoute<T = ResolveImportProps> = T & {
  staticImport: any;
  appComponent?: any;
};
