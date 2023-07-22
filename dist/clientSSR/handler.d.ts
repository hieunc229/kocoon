import { Request as ExpressReq, Response } from "express";
import { StaticHandler } from "@remix-run/router";
export type ServerProps = {
    data?: any;
    status?: number;
    redirect?: string;
};
export type HandlerProps = {
    default: any;
    getServerProps?: (req: ExpressReq) => ServerProps | Promise<ServerProps>;
};
type ClientHandlerProps = {
    staticRoutes: any[];
    staticHandler: StaticHandler;
    AppComponent: any;
    route: string;
};
export declare function clientHandler(handlerProps: {
    handler: HandlerProps;
    layout?: HandlerProps;
}, props: ClientHandlerProps): (req: ExpressReq, res: Response) => void;
export {};
