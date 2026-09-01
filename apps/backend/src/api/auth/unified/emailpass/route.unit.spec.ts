import { POST } from "./route";

const makeRequest = (
  body: Record<string, unknown>,
  auth: Record<string, unknown>,
) => {
  const session: Record<string, unknown> = {
    save: (callback: (error?: Error) => void) => callback(),
  };
  return {
    body,
    headers: {},
    query: {},
    protocol: "http",
    url: "http://localhost/auth/unified/emailpass",
    session,
    scope: { resolve: () => auth },
  } as never;
};

const makeResponse = () => {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.payload = payload;
      return response;
    },
  };
  return response;
};

describe("unified emailpass login", () => {
  it("rejects actor hints from the browser", async () => {
    const auth = { listProviderIdentities: jest.fn() };
    const request = makeRequest(
      { email: "customer@example.com", password: "secret", actor: "user" },
      auth,
    );
    await expect(POST(request, makeResponse() as never)).rejects.toMatchObject({
      type: "unauthorized",
    });
    expect(auth.listProviderIdentities).not.toHaveBeenCalled();
  });

  it("creates a customer session without returning actor information", async () => {
    const identity = {
      id: "auth_1",
      app_metadata: { customer_id: "cus_1" },
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: "customer@example.com",
          user_metadata: {},
        },
      ],
    };
    const auth = {
      listProviderIdentities: jest
        .fn()
        .mockResolvedValue([
          {
            provider: "emailpass",
            entity_id: "customer@example.com",
            auth_identity: identity,
          },
        ]),
      authenticate: jest
        .fn()
        .mockResolvedValue({ success: true, authIdentity: identity }),
    };
    const request = makeRequest(
      { email: " Customer@Example.com ", password: "secret" },
      auth,
    ) as any;
    const response = makeResponse();

    await POST(request, response as never);

    expect(auth.authenticate).toHaveBeenCalledWith(
      "emailpass",
      expect.objectContaining({ actor_type: "customer" }),
    );
    expect(request.session.auth_context).toMatchObject({
      actor_id: "cus_1",
      actor_type: "customer",
    });
    expect(response.payload).toEqual({ authenticated: true });
    expect(response.payload).not.toHaveProperty("actor_type");
  });

  it("resolves a Medusa user as an admin session server-side", async () => {
    const identity = {
      id: "auth_user_1",
      app_metadata: { user_id: "user_1" },
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: "admin@example.com",
          user_metadata: {},
        },
      ],
    };
    const auth = {
      listProviderIdentities: jest
        .fn()
        .mockResolvedValue([
          {
            provider: "emailpass",
            entity_id: "admin@example.com",
            auth_identity: identity,
          },
        ]),
      authenticate: jest
        .fn()
        .mockResolvedValue({ success: true, authIdentity: identity }),
    };
    const request = makeRequest(
      { email: "admin@example.com", password: "secret" },
      auth,
    ) as any;
    const response = makeResponse();

    await POST(request, response as never);

    expect(auth.authenticate).toHaveBeenCalledWith(
      "emailpass",
      expect.objectContaining({ actor_type: "user" }),
    );
    expect(request.session.auth_context).toMatchObject({
      actor_id: "user_1",
      actor_type: "user",
    });
    expect(response.payload).toEqual({ authenticated: true });
  });

  it("rotates an existing session before establishing an authenticated actor", async () => {
    const identity = {
      id: "auth_user_2",
      app_metadata: { user_id: "user_2" },
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: "admin2@example.com",
          user_metadata: {},
        },
      ],
    };
    const regenerate = jest.fn((callback: (error?: Error | null) => void) =>
      callback(),
    );
    const auth = {
      listProviderIdentities: jest
        .fn()
        .mockResolvedValue([
          {
            provider: "emailpass",
            entity_id: "admin2@example.com",
            auth_identity: identity,
          },
        ]),
      authenticate: jest
        .fn()
        .mockResolvedValue({ success: true, authIdentity: identity }),
    };
    const request = makeRequest(
      { email: "admin2@example.com", password: "secret" },
      auth,
    ) as any;
    request.session.regenerate = regenerate;

    await POST(request, makeResponse() as never);

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(request.session.auth_context).toMatchObject({
      actor_id: "user_2",
      actor_type: "user",
    });
  });
});
