import fetch from "node-fetch";

type Variables = { [key: string]: any };

interface GraphQLError {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
}

interface GraphQLResponse {
  data?: any;
  errors?: GraphQLError[];
  extensions?: any;
  status: number;
  [key: string]: any;
}

interface GraphQLRequestContext {
  query: string;
  variables?: Variables;
}

class ClientError extends Error {
  response: GraphQLResponse;
  request: GraphQLRequestContext;

  constructor(response: GraphQLResponse, request: GraphQLRequestContext) {
    const message = `${ClientError.extractMessage(response)}: ${JSON.stringify({
      response,
      request
    })}`;

    super(message);

    this.response = response;
    this.request = request;

    // this is needed as Safari doesn't support .captureStackTrace
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ClientError);
    }
  }

  private static extractMessage(response: GraphQLResponse): string {
    try {
      return response.errors![0].message;
    } catch (e) {
      return `GraphQL Error (Code: ${response.status})`;
    }
  }
}

export class LinearClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async request<T extends any>(
    query: string,
    variables?: Variables
  ): Promise<T> {
    const body = JSON.stringify({
      query,
      variables: variables ? variables : undefined
    });

    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json"
      },
      body
    });

    const result = await response.json();

    if (response.ok && !result.errors && result.data) {
      return result.data;
    } else {
      const errorResult =
        typeof result === "string" ? { error: result } : result;
      throw new ClientError(
        { ...errorResult, status: response.status },
        { query, variables }
      );
    }
  }
}
