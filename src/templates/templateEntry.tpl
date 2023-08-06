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

  return (
    {{content}}
  );
}