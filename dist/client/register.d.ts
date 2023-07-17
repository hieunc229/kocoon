import { Express } from "express";
import { HandlerProps } from "./handler";
export type PathProps = {
    handlePath: string;
    filePath: string;
};
export default function registerClient(options: {
    app: Express;
    debug?: boolean;
    route: string;
    dirPath: string;
    publicPath?: string;
}): Promise<void>;
export type ClientRouteProps = {
    handler: HandlerProps;
    handlerName: string;
    handlerPath: string;
    layout?: HandlerProps;
    layoutName?: string;
    layoutPath?: string;
};
export type ClientRoutes = {
    [path: string]: ClientRouteProps;
};
