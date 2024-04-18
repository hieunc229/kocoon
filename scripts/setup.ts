import { mkdirSync, existsSync } from "fs";
import { buildDir, bundleDir } from "./configs";
import path from "path";

function setupBuild() {
  for (const dir of [bundleDir, buildDir, path.join(buildDir, "__rumbo")]) {
    if (!existsSync(dir)) {
      mkdirSync(dir);
    }
  }
}

setupBuild();
