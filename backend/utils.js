const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

module.exports = { wrap, fail };
