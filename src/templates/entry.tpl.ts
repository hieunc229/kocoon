export default `import {AppContextProvider} from "rumbo/components/context";
import Helmet from "react-helmet";

type AppProps = { 
  globalData: any, 
  data: any; 
  children: any,
  session: any,
  routeProps: any,
  settings: { clientUseRouter?: boolean } 
}

export default function App(props: AppProps) {
  const { data, settings, children, globalData, session, routeProps } = props;
  const helmet = Helmet.renderStatic();

  return (<AppContextProvider serverData={data} session={session}>
    {{content}}
  </AppContextProvider>);
}`