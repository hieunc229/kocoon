import 'dotenv/config'
import express from "express";

import configs from "./rumboConfigs";
import rumbo from "./packages/rumbo/src";

const app = express();
rumbo(app, configs);
