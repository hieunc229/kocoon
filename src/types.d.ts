type HandlerProps = {
    default: any;
    layoutProps?: { [name: string]: any };
    getServerProps?: (req: ExpressReq) => ServerProps | Promise<ServerProps>;
  };
  