import { Express } from "express";
export default function registerHandlers(options: {
    dirPath: string;
    routePath: string;
    app: Express;
    debug?: boolean;
}): Promise<void>;
