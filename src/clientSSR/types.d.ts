type ServerProps = {
  data?: any;
  props?: any;
  globalData?: any;
  status?: number;
  redirect?: string;
};

type ClientRouteProps = {
  handler: HandlerProps;
  handlerName: string;
  handlerPath: string;
  handlerProps?: any,
  layout?: HandlerProps;
  layoutName?: string;
  layoutPath?: string;
};

type ClientRoutes = { [path: string]: ClientRouteProps };