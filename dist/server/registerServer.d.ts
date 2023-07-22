import { Express } from "express";
export default function registerServer(options: {
    app: Express;
    debug?: boolean;
    route: string;
    location: string;
}): Promise<void>;
