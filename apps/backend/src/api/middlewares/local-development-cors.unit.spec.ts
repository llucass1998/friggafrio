import { allowLocalDevelopmentCors } from "./local-development-cors"

const makeResponse = () => {
  const headers = new Map<string, string>()
  const response = {
    statusCode: 200,
    ended: false,
    setHeader: (name: string, value: string) => headers.set(name, value),
    status: (code: number) => {
      response.statusCode = code
      return response
    },
    end: () => {
      response.ended = true
      return response
    },
    headers,
  }
  return response
}

describe("local development CORS", () => {
  it("allows local origin on the local backend host", () => {
    const response = makeResponse()
    const next = jest.fn()

    allowLocalDevelopmentCors(
      {
        method: "GET",
        headers: { origin: "http://localhost:5173", host: "localhost:9000" },
      } as never,
      response as never,
      next,
    )

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173")
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true")
    expect(next).toHaveBeenCalledTimes(1)
  })

  it("answers local preflight without reaching the route", () => {
    const response = makeResponse()
    const next = jest.fn()

    allowLocalDevelopmentCors(
      {
        method: "OPTIONS",
        headers: { origin: "http://localhost:5173", host: "127.0.0.1:9000" },
      } as never,
      response as never,
      next,
    )

    expect(response.statusCode).toBe(204)
    expect(response.ended).toBe(true)
    expect(next).not.toHaveBeenCalled()
  })

  it("does not add local CORS to public hosts or untrusted origins", () => {
    const publicResponse = makeResponse()
    const publicNext = jest.fn()
    allowLocalDevelopmentCors(
      {
        method: "GET",
        headers: { origin: "http://localhost:5173", host: "friggafrio.istigestao.com.br" },
      } as never,
      publicResponse as never,
      publicNext,
    )

    const attackerResponse = makeResponse()
    const attackerNext = jest.fn()
    allowLocalDevelopmentCors(
      {
        method: "GET",
        headers: { origin: "https://attacker.example", host: "localhost:9000" },
      } as never,
      attackerResponse as never,
      attackerNext,
    )

    expect(publicResponse.headers.has("Access-Control-Allow-Origin")).toBe(false)
    expect(attackerResponse.headers.has("Access-Control-Allow-Origin")).toBe(false)
    expect(publicNext).toHaveBeenCalledTimes(1)
    expect(attackerNext).toHaveBeenCalledTimes(1)
  })
})
