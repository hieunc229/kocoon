type BundleClientSSRProps = GenerateEntryProps & {
  publicPath?: string;
  distDir: string;
  debug: boolean;
  rootDir: string;
  app?: any;
  webpackConfigs?: webpack.Configuration;
  pwaEnabled?: boolean
};

type GenerateEntryProps = {
  routes: ClientRoutes;
  route: string;
  appProps: RumboProps;
  entries: ResolveImportProps[];
  pwaEnabled?: boolean;
}

type ServerProps = {
  data?: any;
  props?: any;
  json?: any,
  globalData?: any;
  status?: number;
  redirect?: string;
  next?: boolean,
  document?: {
    headers?: {[name:string]: string | number},
    content: string
  }
};

type ClientRouteProps = {
  handler: HandlerProps;
  handlerName: string;
  handlerPath: string;
  handlerProps?: any;
  layout?: HandlerProps;
  layoutName?: string;
  layoutPath?: string;
};

type ClientRoutes = { [path: string]: ClientRouteProps };
