import path from "path";
import { RumboProps } from "rumbo";

const rumboConfigs: RumboProps = {
  debug: true,
  rootDir: __dirname,
  listen: {
    port: parseInt(process.env.PORT || "3000"),
    host: process.env.HOST || "localhost"
  },
  routes: {
    "/": {
      type: "client-ssr",
      location: path.join(__dirname, "routes/client"),
    },
    "/api": {
      type: "server",
      location: path.join(__dirname, "routes/api"),
    },
  },
  staticRoutes: null
};

export default rumboConfigs;
