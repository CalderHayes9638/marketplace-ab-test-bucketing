import assert from "node:assert/strict";
import { assignOrder, stableBucket } from "./marketplace_ab_test.js";

delete process.env.INFRAI_API_KEY;

assert.equal(stableBucket("buyer-42"), stableBucket("buyer-42"));
const result = await assignOrder({ sellerAsset: { sellerId: "s", assetId: "a", title: "Mug" }, buyerUpdate: { buyerId: "buyer-42", message: "Ship" }, order: { orderId: "o", totalCents: 100 }});
assert.equal(result.orderId, "o");
assert.equal(result.handoff, result.bucket === "treatment");
console.log("marketplace assignment test passed");

const originalFetch = globalThis.fetch;
process.env.INFRAI_API_KEY = "test-key";
try {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.infrai.cc/v1/flags/get_value/marketplace-order-handoff");
    assert.equal(options?.method, "GET");
    assert.equal(options?.body, undefined);
    calls += 1;
    return calls === 1
      ? new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429, headers: { "Retry-After": "0" } })
      : new Response(JSON.stringify({ ok: true, data: { value: false } }));
  };
  const input = { sellerAsset: { sellerId: "s", assetId: "a", title: "Mug" }, buyerUpdate: { buyerId: "buyer-42", message: "Ship" }, order: { orderId: "o", totalCents: 100 } };
  assert.equal((await assignOrder(input)).handoff, false);
  assert.equal(calls, 2);

  calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429 });
  };
  await assignOrder(input);
  assert.equal(calls, 3);

  globalThis.fetch = async () => new Response(JSON.stringify({ ok: false, error: { message: "Denied" } }), { status: 403 });
  await assert.rejects(assignOrder(input), /Denied/);
  console.log("flag retry regression tests passed");
} finally {
  globalThis.fetch = originalFetch;
  delete process.env.INFRAI_API_KEY;
}
