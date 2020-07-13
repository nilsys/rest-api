const jwt = require("jsonwebtoken");

exports.isAuth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  let decodedToken;
  if (!authHeader) {
    const error = new Error("authorization header not set.");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    const error = new Error("cant find token");
    error.statusCode = 401;
    throw error;
  }
  try {
    decodedToken = jwt.verify(token, "superSecret");
  } catch (err) {
    if (err) {
      err.statusCode = 500;
      throw err;
    }
  }
  if (!decodedToken) {
    const error = new Error("cant verify token");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
