import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { categoryValidator, pisteDoc } from "./validators";

const defaults = [
  {
    name: "PC gamer",
    category: "pc-gamer" as const,
    keywords: ["pc", "gamer", "rtx", "radeon", "ryzen"],
    city: "",
    maxAskingPrice: 900,
    minNetMargin: 80,
  },
  {
    name: "Vélo de course",
    category: "velo-course" as const,
    keywords: ["velo", "vélo", "route", "course", "cadre"],
    city: "",
    maxAskingPrice: 1600,
    minNetMargin: 100,
  },
];

export const list = query({
  args: {},
  returns: v.array(pisteDoc),
  handler: async (ctx) => {
    return await ctx.db
      .query("pistes")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { id: v.id("pistes") },
  returns: v.union(pisteDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("pistes", args.id);
  },
});

export const ensureDefaults = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("pistes")
      .withIndex("by_created")
      .take(1);
    if (existing.length > 0) return null;
    const now = Date.now();
    for (const piste of defaults) {
      await ctx.db.insert("pistes", { ...piste, createdAt: now });
    }
    return null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    keywords: v.array(v.string()),
    city: v.string(),
    maxAskingPrice: v.number(),
    minNetMargin: v.number(),
  },
  returns: v.id("pistes"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length < 2 || name.length > 60) {
      throw new Error("Le nom de la piste doit faire entre 2 et 60 caractères.");
    }
    if (!Number.isFinite(args.maxAskingPrice) || args.maxAskingPrice <= 0) {
      throw new Error("Le plafond de prix doit être un montant positif.");
    }
    if (!Number.isFinite(args.minNetMargin) || args.minNetMargin < 0) {
      throw new Error("La marge minimale ne peut pas être négative.");
    }
    const keywords = args.keywords
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 8);
    return await ctx.db.insert("pistes", {
      name,
      category: args.category,
      keywords,
      city: args.city.trim().slice(0, 80),
      maxAskingPrice: Math.round(args.maxAskingPrice),
      minNetMargin: Math.round(args.minNetMargin),
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("pistes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_piste", (q) => q.eq("pisteId", args.id))
      .take(200);
    for (const listing of listings) {
      await ctx.db.delete("listings", listing._id);
    }
    await ctx.db.delete("pistes", args.id);
    return null;
  },
});
