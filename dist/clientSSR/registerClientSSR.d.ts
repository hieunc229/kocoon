import "ignore-styles";
import { Express } from "express";
type Props = {
    location: string;
    publicPath: string;
    rootDir: string;
    distDir: string;
    route: string;
    app: Express;
    debug?: boolean;
};
export default function registerClientSSR(props: Props): Promise<void>;
export {};
