import { assertEquals } from "@std/assert";
import app from "./main.ts";

Deno.test("GET / returns HTML", async () => {
  const res = await app.request("http://localhost/");
  assertEquals(res.status, 200);
});

Deno.test("GET /help returns 404", async () => {
  const res = await app.request("http://localhost/help");
  assertEquals(res.status, 404);
});
