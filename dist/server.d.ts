import { Express } from "express";
export default function registerServerHandlers(options: {
    app: Express;
    debug?: boolean;
    route: string;
    dirPath: string;
}): Promise<void>;
