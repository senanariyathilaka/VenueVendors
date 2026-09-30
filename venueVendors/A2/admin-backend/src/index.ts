import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createHandler } from "graphql-http/lib/use/express";
import { ruruHTML } from "ruru/server";
import { AdminDataSource } from "./data-source";
import { schema, rootValue } from "./schema";
import { readBearerToken } from "./auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

function getAuthorizationHeader(req: unknown): string | undefined {
  const requestWithHeaders = req as {
    headers?: {
      authorization?: unknown;
      Authorization?: unknown;
      get?: unknown;
    };
  };

  const headers = requestWithHeaders.headers;

  if (!headers) {
    return undefined;
  }

  if (typeof headers.get === "function") {
    const value =
      headers.get("authorization") || headers.get("Authorization");

    return typeof value === "string" ? value : undefined;
  }

  const authorization = headers.authorization ?? headers.Authorization;

  if (Array.isArray(authorization)) {
    return typeof authorization[0] === "string" ? authorization[0] : undefined;
  }

  return typeof authorization === "string" ? authorization : undefined;
}

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send(`
    <h1>Venue Vendors Admin GraphQL Backend</h1>
    <p>The admin GraphQL backend is running.</p>
    <p>Open <a href="/graphql">/graphql</a> to use the GraphQL sandbox.</p>
  `);
});

app.get("/graphql", (_req, res) => {
  res.type("html");
  res.end(
    ruruHTML({
      endpoint: "/graphql",
    })
  );
});

app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue,
    context: (req) => {
      const authorizationHeader = getAuthorizationHeader(req);

      return {
        token: readBearerToken(authorizationHeader),
      };
    },
  })
);

AdminDataSource.initialize()
  .then(() => {
    console.log("Admin data source has been initialized!");

    app.listen(PORT, () => {
      console.log(`Admin GraphQL server is running on port ${PORT}`);
      console.log(`GraphQL sandbox: http://localhost:${PORT}/graphql`);
    });
  })
  .catch((error) => {
    console.log("Error during admin data source initialization:", error);
  });