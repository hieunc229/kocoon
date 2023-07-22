export declare function generateApp(props: {
    publicPath: string;
    componentPath?: string;
    templatePath?: string;
}): {
    appClassPath: string;
    htmlTemplate: string;
};
export declare function getAppComponent(props: {
    rootDir: string;
    publicPath: string;
    templatePath?: string;
}): any;
