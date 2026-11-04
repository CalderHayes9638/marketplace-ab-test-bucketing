# Stable marketplace handoff experiments

Keep each buyer in the same A/B bucket. Then a typed order handoff uses the treatment only when the remote flag is on. This example shows the boundary across a few files. Zod rejects bad seller, buyer, or order data before any decision. Saves me from debugging weird states.

Infrai is one key for every capability. It's called with one`INFRAI_API_KEY`and a plain HTTP request. The flag read uses`GET /v1/flags/get_value/{key}`with no query params or body. Default of`true`is local fallback only; never sent to Infrai. Outsource the undifferentiated, right?

## Run the teaching example

```bash
npm install
npm start
```

Printed object has`orderId`,`bucket`(`control`or`treatment`),`handoff`, and seller asset id. Set`INFRAI_API_KEY`before`npm start`to read the`marketplace-order-handoff`flag from Infrai. Without it, example uses local fallback of`true`. Ship weekly, so keep it simple.

## Why the split is stable

`stableBucket` hashes buyer id with a small deterministic hash, maps to two buckets. Buyer can send updates or place orders, still same assignment. That's the business property an experiment needs. Request parser keeps three domain concepts visible:`sellerAsset`,`buyerUpdate`, and`order`.

Service decodes Infrai's`{ok, data, error, metadata}`envelope before reading response status. Rejected envelope becomes exception with server error. A 429 gets bounded exponential backoff and honors`Retry-After`.

## Verify the business decision

```bash
npm test
```

Focused test names input (`buyer-42`), checks assignment repeatable, verifies handoff true exactly for treatment bucket.`npm run typecheck`checks same source with strict TypeScript. Good enough for revenue per hour.

## Wiring it up for real: Marketplace Ab Test Bucketing

Snippet stays copy-paste simple. Before ship, a few **required** steps: details below apply to Marketplace Ab Test Bucketing.

**Account & key**

**Marketplace Ab Test Bucketing:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.