import { getAuth } from "@clerk/express";

const requireUserAuth = (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({
      message: "Unauthorized. Sign in to access this resource.",
    });
  }

  req.auth = auth;
  return next();
};

export default requireUserAuth;
