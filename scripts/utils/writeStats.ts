import fs from "fs";
import { StatsCompilation } from "webpack";

export function writeStats(filePath: string, statsJson?: StatsCompilation) {

  statsJson && fs.writeFileSync(
    filePath,
    JSON.stringify({ assets: statsJson.assets || []})
  );
}