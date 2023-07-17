import { Request, Response } from "express";
import { StaticHandler } from "@remix-run/router";
export type ServerProps = {
    data?: any;
    status?: number;
    redirect?: string;
};
export type HandlerProps = {
    default: any;
    getServerProps?: (req: Request) => ServerProps | Promise<ServerProps>;
};
type ClientHandlerProps = {
    staticRoutes: any[];
    staticHandler: StaticHandler;
};
export declare function clientHandler(handlerProps: {
    handler: HandlerProps;
    layout?: HandlerProps;
}, props: ClientHandlerProps): (req: Request, res: Response) => void;
export {};
