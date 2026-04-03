import { HTTP_STATUS } from '@flightprestige/shared'

export class ApiResponse<T = unknown> {
  readonly success: boolean
  readonly statusCode: number
  readonly message: string | undefined
  readonly data: T | undefined
  readonly error: string | undefined

  private constructor(params: {
    success: boolean
    statusCode: number
    message?: string
    data?: T
    error?: string
  }) {
    this.success = params.success
    this.statusCode = params.statusCode
    this.message = params.message
    this.data = params.data
    this.error = params.error
  }

  static ok<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse({ success: true, statusCode: HTTP_STATUS.OK, data, message })
  }

  static created<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse({ success: true, statusCode: HTTP_STATUS.CREATED, data, message })
  }

  static noContent(): ApiResponse<never> {
    return new ApiResponse({ success: true, statusCode: HTTP_STATUS.NO_CONTENT })
  }

  static badRequest(error: string): ApiResponse<never> {
    return new ApiResponse({ success: false, statusCode: HTTP_STATUS.BAD_REQUEST, error })
  }

  static unauthorized(error = 'Unauthorized'): ApiResponse<never> {
    return new ApiResponse({ success: false, statusCode: HTTP_STATUS.UNAUTHORIZED, error })
  }

  static notFound(error = 'Not found'): ApiResponse<never> {
    return new ApiResponse({ success: false, statusCode: HTTP_STATUS.NOT_FOUND, error })
  }

  static conflict(error: string): ApiResponse<never> {
    return new ApiResponse({ success: false, statusCode: HTTP_STATUS.CONFLICT, error })
  }

  static internal(error = 'Internal server error'): ApiResponse<never> {
    return new ApiResponse({ success: false, statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, error })
  }

  send(res: import('express').Response): void {
    if (this.statusCode === HTTP_STATUS.NO_CONTENT) {
      res.status(this.statusCode).end()
      return
    }
    res.status(this.statusCode).json({
      success: this.success,
      ...(this.message !== undefined && { message: this.message }),
      ...(this.data !== undefined && { data: this.data }),
      ...(this.error !== undefined && { error: this.error }),
    })
  }
}
