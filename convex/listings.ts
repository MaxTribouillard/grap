import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  listingDoc,
  methodValidator,
  verdictValidator,
} from "./validators";

export const listKept = query({
  args: {},
  returns: v.array(listingDoc),
  handler: async (ctx) => {
    return await ctx.db
      .query("listings")
      .withIndex("by_verdict_margin", (q) => q.eq("verdict", "kept"))
      .order("desc")
      .take(40);
  },
});

export const listDiscarded = query({
  args: {},
  returns: v.array(listingDoc),
  handler: async (ctx) => {
    return await ctx.db
      .query("listings")
      .withIndex("by_verdict_created", (q) => q.eq("verdict", "discarded"))
      .order("desc")
      .take(20);
  },
});

export const save = internalMutation({
  args: {
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
  },
  returns: v.id("listings"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("listings", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("listings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete("listings", args.id);
    return null;
  },
});
