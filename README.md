# Rumbo

Rumbo allows you to build fullstack app with Express and React in NodeJS, inspired by NextJS.

This library will automatically resolve paths for your apps, so you don't have to register paths with Express on the server, or with React Router for the client.

Have a look at [Rumbo Typescript Template](https://github.com/hieunc229/rumbo/tree/template-typescript) for an example to use Rambo with Typescript

Supported:
- Basic methods: GET, POST, PATH, OPTIONS, DELETE
- Middleware using _middleware
- Nested routes


### Example folder structure
```
src
├── apps
│   ├── api
│   │   ├── _middleware.ts
│   │   ├── index.ts // or get.ts
│   │   │── post.ts
│   │   │── users
│   │       ├── index.ts
│   ├── client
│   │   ├── _layout.ts
│   │   ├── index.ts
│   │   │── users
│   │       ├── index.ts
├── dev.ts
├── index.ts
├── rumboConfigs.ts
```

### Rumbo configs

```ts
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
      excludePaths: ["includes"]
    },
  },
  // must specify for generating files in runtime
  staticRoutes: null
};

export default rumboConfigs;

```

### Register middleware
```ts
// src/app/api/_middleware.ts
import { Request, Response, NextFunction } from "express";

export default function(req: Request, res: Response, next: NextFunction) {
  console.log("/admin/_middleware");
  next()
}
```

### Register GET

```ts
// src/app/server/index.ts
import { Request, Response } from "express";

export default function(req: Request, res: Response) {

  res.json({
    message: "ok"
  })
}
```

### Register nested route

```ts
// src/app/server/users/index.ts
import { Request, Response } from "express";

export default function(req: Request, res: Response) {
  res.json({
    message: "ok"
  })
}
```

### Register routes

```ts
// app.ts
import express from "express";
import rumbo from "rumbo";

import configs from "./rumboConfigs";

const app = express();
rumbo(app, configs);
```