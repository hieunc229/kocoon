export default `import {AppContextProvider} from "rumbo/components/context";
import Helmet from "react-helmet";

type AppProps = { 
  globalData: any, 
  data: any; 
  children: any,
  session: any,
  routeProps: any,
  settings: { clientUseRouter?: boolean, assets?: string[] } 
}

export default function AppEntry(props: AppProps) {
  const { assets = [], ...settings } = props.settings;
  const { data, children, globalData, session, routeProps } = props;
  const helmet = Helmet.renderStatic();
  const titleHelmet = helmet.title.toComponent();
  let titleComponent: any = titleHelmet;
  while (Array.isArray(titleComponent)) {
    titleComponent = titleComponent.pop()
  }

  return (<AppContextProvider serverData={data} session={session}>
    {{content}}
  </AppContextProvider>);
}`