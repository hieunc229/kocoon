type ExtendedRequest = Express.Request & {
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
