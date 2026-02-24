import { Hono } from "hono";
import { testClient } from "hono/testing";
import { expect, it } from "vitest";

const app = new Hono().get("/", (c) => c.text("root"));

it("test root", async () => {
  const client = testClient(app);
  // @ts-expect-error - testing if $get exists on root
  const res = await client.$get();
  expect(await res.text()).toBe("root");
});

it("test index", async () => {
  const client = testClient(app);
  const res = await client.index.$get();
  expect(await res.text()).toBe("root");
});
