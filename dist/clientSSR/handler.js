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
        const { handler } = options.handlerProps;
        const { staticHandler, AppComponent, route } = options.props;
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
        const fetchRequest = createFetchRequest(req);
        const context = yield staticHandler.query(fetchRequest);
        const router = (0, server_2.createStaticRouter)(staticHandler.dataRoutes, context);
        const { pipe } = (0, server_1.renderToPipeableStream)((0, jsx_runtime_1.jsx)(AppComponent, { data: serverData, children: (0, jsx_runtime_1.jsx)(server_2.StaticRouterProvider, { context: context, router: router }) }), {
            bootstrapScripts: [`${route.replace("/", "_")}.js`],
            onShellReady() {
                res.setHeader("content-type", "text/html");
                pipe(res);
            },
            onError(err, info) {
                console.log("Failed to render", { err, info });
                res.status(500).send(err);
            },
        });
    });
}
function createFetchRequest(req) {
    let origin = `${req.protocol}://${req.get("host")}`;
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
