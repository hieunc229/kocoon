# Express Route

Build fullstack framework powered by ExpressJS.

Supported:
- Basic methods: GET, POST, PATH, OPTIONS, DELETE
- Middleware using _middleware
- Nested routes


### Example folder structure
```
src
├── app
│   ├── server
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
├── app.ts
```

### Register middleware
```ts
// src/app/server/_middleware.ts
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
import path from "path"
import express from "express";
import register from "express-route-register";

const app = express();

register({
  app,
  // debug: true, // log registed handlers
  react: "/"
});


const host = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "8080");

app.listen(port, host, () => {
  console.log(`Server started ${host}:${port}`);
})
```