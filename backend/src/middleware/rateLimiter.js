const rateLimit = require("express-rate-limit");

/**
 * Two separate limiters because uploads and queries have very different
 * costs. Uploading a document can trigger MANY embedding calls (one per
 * chunk) -- a single abusive upload could burn through a large chunk of
 * your Voyage quota. Querying is cheaper (one embedding + one LLM call),
 * so it gets a looser limit.
 *
 * Both are keyed by IP address automatically (express-rate-limit's
 * default) -- each visitor gets their own independent quota.
 */

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 uploads per IP per window
  message: { error: "Too many uploads from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 questions per IP per window
  message: { error: "Too many questions from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { uploadLimiter, queryLimiter };