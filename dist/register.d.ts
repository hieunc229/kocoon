import { Express } from "express";
export type RumboAppType = "server" | "client-ssr" | "client-spa" | "static";
export type RumboAppProps = {
    location: string;
    type: RumboAppType;
};
export type RumboAppConfigs = RumboAppProps & {
    route: string;
};
export type RumboProps = {
    app: Express;
    debug?: boolean;
    publicDir?: string;
    distDir?: string;
    rootDir?: string;
    routes: {
        [route: string]: RumboAppProps;
    };
    listen?: boolean | {
        host?: string;
        port?: number;
    };
};
export default function Rumbo(options: RumboProps): Promise<void>;
