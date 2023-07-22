import { HandlerProps } from "./handler";

export type ClientRouteProps = {
  handler: HandlerProps;
  handlerName: string;
  handlerPath: string;
  layout?: HandlerProps;
  layoutName?: string;
  layoutPath?: string;
};

export type ClientRoutes = { [path: string]: ClientRouteProps };


export type PathProps = {
  handlePath: string;
  filePath: string;
};

export function sortPath(a: PathProps, b: PathProps) {
  return a.handlePath.localeCompare(b.handlePath);
}

export function getRegisterPath(options: {
  filePath: string;
  routePath: string;
}) {
  const { filePath, routePath } = options;
  let [name = ""] = routePath.split(".");
  const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    filePath,
  };
}
