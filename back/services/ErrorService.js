module.exports = {
  sendError(res, err) {
    const status = err.status || (err.response ? err.response.status : null) || 500;
    const message = err.response ? err.response.statusText : err.message;
    const detail = err.response
      ? err.response.data
        ? err.response.data.error
          ? err.response.data.error.message
            ? err.response.data.error.message.value
              ? err.response.data.error.message.value
              : err.response.data.error.message
            : err.response.data.error
          : err.response.data
        : err.response
      : message;

    res.status(status).send({
      message,
      status,
      detail: detail === message ? undefined : detail,
    });
  },
  getError(err) {
    let message = err.message || err;
    if (err.response) {
      if (err.response.data) {
        if (err.response.data.error) {
          message = err.response.data.error.message.value;
        }
      }
    }
    return message;
  }
};
