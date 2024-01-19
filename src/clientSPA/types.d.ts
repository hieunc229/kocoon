type RumboBundleClientSPAProps = {
  location: string;
  publicPath?: string;
  distDir: string;
  route: string;
  debug?: boolean;
  rootDir: string;
  app: Express;
  staticImports: null | {
    [subRoute: string]: RumboStaticRoute;
  };
  webpackConfigs?: webpack.Configuration;
};

type RumboRegisterClientSPAProps = RumboBundleClientSPAProps & {
  app: Express;
  excludePaths: string[];
  clientUseRouter?: boolean;
};