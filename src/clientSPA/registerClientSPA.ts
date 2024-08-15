import fs from "fs";
import bundleClientSPA from "./bundler";

import { StatsCompilation } from "webpack";
import { clientSPAHandler } from "./handler";
import { formatClassName } from "../utils/text";

export default async function registerClientSPA(
  props: RumboRegisterClientSPAProps
): Promise<StatsCompilation | undefined> {
  const { route } = props;
  
  let statsJson: StatsCompilation | undefined;
  if (process.env.NODE_ENV !== "production") {
    const stats = await bundleClientSPA(props);
    statsJson = stats?.toJson();
  } else {
    const dataStr = fs.readFileSync(`./__persei/${formatClassName(route)}.stats.json`, {
      encoding: "utf-8",
    });
    statsJson = JSON.parse(dataStr);
  }
  clientSPAHandler(props, statsJson);
  return statsJson;
}
