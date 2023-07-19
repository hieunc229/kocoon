import { Component } from "react";
export type AppContextProps = {
    serverData: any | null;
    router: any | null;
};
export declare const AppContext: import("react").Context<AppContextProps>;
type Props = {
    children: any;
    router?: any;
    serverData: any;
};
export declare class AppContextProvider extends Component<Props> {
    state: AppContextProps;
    constructor(props: Props);
    private updateContext;
    render(): import("react/jsx-runtime").JSX.Element;
}
export declare function useServerData(): any;
export declare function useAppContext(): AppContextProps;
export {};
