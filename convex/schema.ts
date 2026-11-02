import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  categoryValidator,
  methodValidator,
  verdictValidator,
} from "./validators";

export default defineSchema({
  pistes: defineTable({
    name: v.string(),
    category: categoryValidator,
    keywords: v.array(v.string()),
    city: v.string(),
    maxAskingPrice: v.number(),
    minNetMargin: v.number(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  listings: defineTable({
    pisteId: v.id("pistes"),
    pisteName: v.string(),
    title: v.string(),
    description: v.string(),
    askingPrice: v.number(),
    shippingPaid: v.number(),
    url: v.string(),
    city: v.string(),
    verdict: verdictValidator,
    estimatedResale: v.number(),
    fees: v.number(),
    netMargin: v.number(),
    confidence: v.number(),
    belongs: v.boolean(),
    reason: v.string(),
    method: methodValidator,
    signals: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_verdict_margin", ["verdict", "netMargin"])
    .index("by_verdict_created", ["verdict", "createdAt"])
    .index("by_piste", ["pisteId", "createdAt"]),
});
