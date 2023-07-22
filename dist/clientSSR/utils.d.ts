import { HandlerProps } from "./handler";
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
export type PathProps = {
    handlePath: string;
    filePath: string;
};
export declare function sortPath(a: PathProps, b: PathProps): number;
export declare function getRegisterPath(options: {
    filePath: string;
    routePath: string;
}): {
    handlePath: string;
    filePath: string;
};
