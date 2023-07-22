import { ClientRoutes, PathProps } from "./utils";
type Props = {
    entries: PathProps[];
    publicPath?: string;
    routes: ClientRoutes;
    route: string;
    distDir: string;
};
export declare function bundleClientSSR(props: Props): Promise<unknown>;
export {};
