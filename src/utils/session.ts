import { ExtendedRequest } from "../extended-types";

export function getServerSession(req: ExtendedRequest) {
  return {
    user: req.user,
  };
}
