import { useRouteError } from "react-router-dom";

export default function ErrorBoundary() {
  let error = useRouteError();
  // Uncaught ReferenceError: path is not defined
  return <div>Error: {error?.toString()}</div>;
}
