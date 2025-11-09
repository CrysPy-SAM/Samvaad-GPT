export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export class ApiResponse {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, message = "Error", statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  static created(res, data, message = "Created successfully") {
    return this.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}
