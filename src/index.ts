import express from "express";

import configs from "./rumboConfigs";
import rumbo from "rumbo";

const app = express();
rumbo(app, configs);
