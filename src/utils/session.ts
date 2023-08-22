export function getServerSession(req: ExtendedRequest) {
  return {
    user: req.user,
  };
}
