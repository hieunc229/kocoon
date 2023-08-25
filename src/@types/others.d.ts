/// <reference path="express" />

type ExtendedRequest<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> = Record<string, any>
> = Express.Request<P, ResBody, ReqBody, ReqQuery> & {
  user: any;
};

type HandlerProps = {
  default: any;
  layoutProps?: { [name: string]: any };
  getServerProps?: (req: Request) => ServerProps | Promise<ServerProps>;
};

type ResolveImportProps = {
  filePath: string;
  handlePath: string;
};

type ResolveImportServerProps = ResolveImportProps & {
  method: string;
};
