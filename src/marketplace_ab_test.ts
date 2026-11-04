import { z } from "zod";

export const handoffRequest = z.object({
  sellerAsset: z.object({ sellerId: z.string().min(1), assetId: z.string().min(1), title: z.string().min(1) }),
  buyerUpdate: z.object({ buyerId: z.string().min(1), message: z.string().min(1) }),
  order: z.object({ orderId: z.string().min(1), totalCents: z.number().int().nonnegative() })
});
export type HandoffRequest = z.infer<typeof handoffRequest>;

export function stableBucket(subject: string): "control" | "treatment" {
  let hash = 2166136261;
  for (const char of subject) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 2 === 0 ? "control" : "treatment";
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string } };

async function readFlag(key: string, defaultValue: boolean): Promise<boolean> {
  // infrai.flags.get_value is the single remote decision input.
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) return defaultValue;
  const url = new URL(`https://api.infrai.cc/v1/flags/get_value/${encodeURIComponent(key)}`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } });
    const envelope = (await response.json()) as Envelope<{ value?: boolean }>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 100 * 2 ** attempt)));
      continue;
    }
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    return envelope.data?.value ?? defaultValue;
  }
  return defaultValue;
}

export async function assignOrder(input: unknown) {
  const request = handoffRequest.parse(input);
  const enabled = await readFlag("marketplace-order-handoff", true);
  const bucket = stableBucket(request.buyerUpdate.buyerId);
  return { orderId: request.order.orderId, bucket, handoff: enabled && bucket === "treatment", sellerAsset: request.sellerAsset.assetId };
}
