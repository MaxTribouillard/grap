import { v } from "convex/values";

export const categoryValidator = v.union(
  v.literal("pc-gamer"),
  v.literal("velo-course"),
  v.literal("autre"),
);

export const verdictValidator = v.union(
  v.literal("kept"),
  v.literal("discarded"),
);

export const methodValidator = v.union(
  v.literal("bareme"),
  v.literal("modele"),
);

export const pisteDoc = v.object({
  _id: v.id("pistes"),
  _creationTime: v.number(),
  name: v.string(),
  category: categoryValidator,
  keywords: v.array(v.string()),
  city: v.string(),
  maxAskingPrice: v.number(),
  minNetMargin: v.number(),
  createdAt: v.number(),
});

export const listingDoc = v.object({
  _id: v.id("listings"),
  _creationTime: v.number(),
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
});
