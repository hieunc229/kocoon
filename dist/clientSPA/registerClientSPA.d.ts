import { Express } from "express";
type Props = {
    location: string;
    publicPath?: string;
    distDir: string;
    route: string;
    app: Express;
    debug?: boolean;
};
export default function registerClientSPA(props: Props): Promise<any>;
export {};
