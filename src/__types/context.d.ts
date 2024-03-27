declare global {
  type RumboAppContextProps = {
    serverData: any | null;
    router: any | null;
    session: any | null;
    fetchServerData: (path: string) => void
  };
}

export {}