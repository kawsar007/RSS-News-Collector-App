export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

export class ApiError extends Error {
  statusCode: number;
  details: string[];

  constructor(response: ApiErrorResponse) {
    const messages = Array.isArray(response.message)
      ? response.message
      : [response.message];
    super(messages.join(", "));
    this.name = "ApiError";
    this.statusCode = response.statusCode;
    this.details = messages;
  }
}
