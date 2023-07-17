"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientHandler = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const server_1 = require("react-dom/server");
const provider_1 = require("./provider");
const server_2 = require("react-router-dom/server");
function clientHandler(handlerProps, props) {
    return function (req, res) {
        handleRequest({
            handlerProps,
            props,
        }, req, res);
    };
}
exports.clientHandler = clientHandler;
function isPromise(p) {
    if (typeof p === "object" && typeof p.then === "function") {
        return true;
    }
    return false;
}
function handleRequest(options, req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let serverData = null;
        const { props } = options;
        const { handler } = options.handlerProps;
        if (handler.getServerProps) {
            const fn = handler.getServerProps(req);
            const { redirect, status, data: propsData, } = (isPromise(fn) ? yield fn : fn);
            if (status) {
                res.status(status);
            }
            if (redirect) {
                res.redirect(redirect);
                return;
            }
            serverData = propsData;
        }
        const statichandler = props.staticHandler;
        const fetchRequest = createFetchRequest(req);
        const context = yield statichandler.query(fetchRequest);
        const router = (0, server_2.createStaticRouter)(statichandler.dataRoutes, context);
        const { pipe } = (0, server_1.renderToPipeableStream)((0, jsx_runtime_1.jsx)(App, { data: serverData, children: (0, jsx_runtime_1.jsx)(server_2.StaticRouterProvider, { context: context, router: router }) }), {
            bootstrapScripts: ["/bundle.js"],
            onShellReady() {
                res.setHeader("content-type", "text/html");
                pipe(res);
            },
        });
    });
}
function App(props) {
    const { data, children } = props;
    return ((0, jsx_runtime_1.jsxs)("html", { children: [(0, jsx_runtime_1.jsxs)("head", { children: [(0, jsx_runtime_1.jsx)("meta", { charSet: "utf-8" }), (0, jsx_runtime_1.jsx)("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }), (0, jsx_runtime_1.jsx)("link", { rel: "stylesheet", href: "/styles.css" }), (0, jsx_runtime_1.jsx)("title", { children: "Fullstack React with Fresh" })] }), (0, jsx_runtime_1.jsxs)("body", { children: [(0, jsx_runtime_1.jsx)(provider_1.AppContextProvider, { serverData: data, children: children }), (0, jsx_runtime_1.jsx)("div", { id: "ssr-data", style: { display: "none" }, children: JSON.stringify(data) })] })] }));
}
function createFetchRequest(req) {
    let origin = `${req.protocol}://${req.get("host")}`;
    // Note: This had to take originalUrl into account for presumably vite's proxying
    let url = new URL(req.originalUrl || req.url, origin);
    let controller = new AbortController();
    req.on("close", () => controller.abort());
    let headers = new Headers();
    for (let [key, values] of Object.entries(req.headers)) {
        if (values) {
            if (Array.isArray(values)) {
                for (let value of values) {
                    headers.append(key, value);
                }
            }
            else {
                headers.set(key, values);
            }
        }
    }
    let init = {
        method: req.method,
        headers,
        signal: controller.signal,
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = req.body;
    }
    return new Request(url.href, init);
}
