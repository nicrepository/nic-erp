const SESSION_EXPIRED_EVENT = "nhub:session-expired"
const ACCESS_DENIED_EVENT = "nhub:access-denied"

const AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
])

let installed = false
let lastSessionEventAt = 0
let lastAccessDeniedEventAt = 0

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | JsonBody
  auth?: boolean
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function getPath(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return new URL(input, window.location.origin).pathname
  }

  if (input instanceof URL) {
    return input.pathname
  }

  return new URL(input.url, window.location.origin).pathname
}

function dispatchThrottledEvent(eventName: string, lastEventAt: number) {
  const now = Date.now()
  if (now - lastEventAt < 1500) return lastEventAt

  window.dispatchEvent(new CustomEvent(eventName))
  return now
}

function isApplicationRequest(input: RequestInfo | URL) {
  const url = typeof input === "string"
    ? new URL(input, window.location.origin)
    : input instanceof URL
      ? input
      : new URL(input.url, window.location.origin)

  return url.origin === window.location.origin
}

export function installApiSessionInterceptor() {
  if (installed || typeof window === "undefined") return

  installed = true
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)

    if (!isApplicationRequest(input)) {
      return response
    }

    const path = getPath(input)

    if (response.status === 401 && !AUTH_PATHS.has(path)) {
      localStorage.removeItem("token")
      localStorage.removeItem("mustChangePassword")
      lastSessionEventAt = dispatchThrottledEvent(SESSION_EXPIRED_EVENT, lastSessionEventAt)
    }

    if (response.status === 403) {
      lastAccessDeniedEventAt = dispatchThrottledEvent(ACCESS_DENIED_EVENT, lastAccessDeniedEventAt)
    }

    return response
  }
}

function isBodyInit(body: ApiFetchOptions["body"]): body is BodyInit {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    body instanceof ReadableStream
  )
}

async function parseResponse(response: Response) {
  if (response.status === 204) return null

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

function getErrorMessage(body: unknown, fallback: string) {
  if (!body) return fallback
  if (typeof body === "string") return body
  if (typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message
  }
  return fallback
}

export async function apiFetch<T = unknown>(input: RequestInfo | URL, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...init } = options
  const requestHeaders = new Headers(headers)

  if (auth) {
    const token = localStorage.getItem("token")
    if (token && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${token}`)
    }
  }

  let requestBody = body
  if (body !== undefined && !isBodyInit(body) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(input, {
    ...init,
    headers: requestHeaders,
    body: requestBody as BodyInit | undefined,
  })

  const responseBody = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getErrorMessage(responseBody, "Não foi possível concluir a requisição."),
      responseBody,
    )
  }

  return responseBody as T
}

export { ACCESS_DENIED_EVENT, SESSION_EXPIRED_EVENT }
