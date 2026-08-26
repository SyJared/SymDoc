function requireAnonId(req, res, next) {
  const ownerId = req.headers["x-anon-id"];

  if (!ownerId || typeof ownerId !== "string") {
    return res.status(400).json({ error: "Missing X-Anon-Id header" });
  }

  req.ownerId = ownerId;
  next();
}

module.exports = { requireAnonId };