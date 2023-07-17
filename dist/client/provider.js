"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useParams = exports.useAppContext = exports.useServerData = exports.AppContextProvider = exports.AppContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const defaultContextValues = {
    serverData: null,
    router: null,
};
exports.AppContext = (0, react_1.createContext)(defaultContextValues);
class AppContextProvider extends react_1.Component {
    constructor(props) {
        super(props);
        this.updateContext = (changes) => {
            this.setState(changes);
        };
        this.state = defaultContextValues;
    }
    render() {
        const ctxValues = Object.assign(Object.assign({}, this.state), { router: this.props.router, serverData: this.props.serverData, updateContext: this.updateContext });
        return ((0, jsx_runtime_1.jsx)(exports.AppContext.Provider, { value: ctxValues, children: this.props.children }));
    }
}
exports.AppContextProvider = AppContextProvider;
function useServerData() {
    const ctx = (0, react_1.useContext)(exports.AppContext);
    return ctx.serverData;
}
exports.useServerData = useServerData;
function useAppContext() {
    return (0, react_1.useContext)(exports.AppContext);
}
exports.useAppContext = useAppContext;
function useParams() {
    const { router } = (0, react_1.useContext)(exports.AppContext);
    if (router) {
        return null;
    }
    return null;
}
exports.useParams = useParams;
