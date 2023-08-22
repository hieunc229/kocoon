type Props = {
  routes: {
    [route: string]: {
      location: string;
      type: string;
    };
  };
  buildDir: string;
};

type ImportProps = {
  className: string;
  classPath: string;
  method: string;
};

type StaticRouteProps = {
  __rumboClientSSR?: any;
};
