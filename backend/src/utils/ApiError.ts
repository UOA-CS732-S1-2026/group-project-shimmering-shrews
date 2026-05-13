// Custom error class for API responses.
// Extends Error to include HTTP status codes for proper error handling.
export class ApiError extends Error {
    statusCode: number;
  
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  }