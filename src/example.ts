import { assignOrder } from "./marketplace_ab_test.js";

const result = await assignOrder({
  sellerAsset: { sellerId: "seller-17", assetId: "listing-204", title: "Handmade mug" },
  buyerUpdate: { buyerId: "buyer-42", message: "Please ship after 3pm" },
  order: { orderId: "order-9001", totalCents: 2800 }
});
console.log(result);
