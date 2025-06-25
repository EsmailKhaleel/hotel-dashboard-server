// Error response
exports.errorResponse = (res, message = 'An error occurred', statusCode = 400) => {
  return res.status(statusCode).json({
    status: false,
    message
  });
};
