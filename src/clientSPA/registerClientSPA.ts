import bundleClientSPA from "./bundler";
import { clientSPAHandler } from "./handler";

export default async function registerClientSPA(
  props: RumboRegisterClientSPAProps
): Promise<any> {

  const { debug = false, route } = props;
  const stats = await bundleClientSPA(props);
  clientSPAHandler(props, stats);
}
