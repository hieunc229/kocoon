import webpack from "webpack";
export type WebpackMode = "none" | "development" | "production";
type Props = {
    mode?: WebpackMode;
    publicPath: string;
    entry: string[];
    route: string;
};
export declare function getWebpackReactConfigs(props: Props): webpack.Configuration;
export {};
