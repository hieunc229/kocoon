import { Express } from "express";
export default function registerHandlers(options: {
    app: Express;
    debug?: boolean;
    publicPath?: string;
    server?: boolean | {
        route: string;
        dirPath: string;
    };
    react: boolean | {
        route: string;
        dirPath: string;
    };
}): Promise<void>;
