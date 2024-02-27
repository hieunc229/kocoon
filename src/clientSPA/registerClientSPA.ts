import chalk from "chalk";
import bundleClientSPA from "./bundler";
import { clientSPAHandler } from "./handler";

export default async function registerClientSPA(
  props: RumboRegisterClientSPAProps
): Promise<any> {

  const { debug = false, route } = props;
  // debug && console.log(chalk.green(`[Client SPA]`, route));
  const stats = await bundleClientSPA(props);
  clientSPAHandler(props, stats);

  // createClientSSRRequest(
  //   { handler },
  //   {
  //     staticRoutes,
  //     staticHandler,
  //     AppComponent,
  //     route,
  //     clientUseRouter: true,
  //     routes: { [route]: { handler, handlerName: route, handlerPath: route }},
  //   }
  // )

  // debug && console.log(chalk.gray(`-`, route));
}
