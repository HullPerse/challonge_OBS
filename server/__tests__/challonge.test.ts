import { expect, test } from "bun:test";

import ChallongeService from "../services/challonge.service";

const target = "https://challonge.com/test/module";

const proxyRequest = (): Request =>
  new Request(`http://127.0.0.1/api/challonge?url=${encodeURIComponent(target)}`);

const upstreamResponse = (body: string, status: number): Response => {
  const response = new Response(body, {
    status,
    headers: { "content-type": "text/html" },
  });

  Object.defineProperty(response, "url", { value: target });
  return response;
};

test("retries a transient upstream failure and returns the page", async () => {
  let calls = 0;
  const service = new ChallongeService(() => {
    calls += 1;

    if (calls < 3) return Promise.resolve(upstreamResponse("busy", 503));
    return Promise.resolve(upstreamResponse("<html>ok</html>", 200));
  });

  const response = await service.proxy(proxyRequest());

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("<html>ok</html>");
  expect(calls).toBe(3);
});

test("does not retry a client error", async () => {
  let calls = 0;
  const service = new ChallongeService(() => {
    calls += 1;
    return Promise.resolve(upstreamResponse("missing", 404));
  });

  const response = await service.proxy(proxyRequest());

  expect(response.status).toBe(404);
  expect(calls).toBe(1);
});
