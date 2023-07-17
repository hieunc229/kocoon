import { ClientRoutes, PathProps } from "./register";
type Props = {
    entries: PathProps[];
    publicPath?: string;
    routes: ClientRoutes;
};
export declare function bundleClient(props: Props): Promise<void>;
export {};
