"use node";

import { v } from "convex/values";
import { action, env } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { applyVerdict, estimateWithBareme, type Estimate } from "./pricing";
import { methodValidator, verdictValidator } from "./validators";

const reviewResult = v.object({
  listingId: v.id("listings"),
  verdict: verdictValidator,
  estimatedResale: v.number(),
  fees: v.number(),
  netMargin: v.number(),
  confidence: v.number(),
  reason: v.string(),
  method: methodValidator,
  signals: v.array(v.string()),
});

function cleanText(value: string, max: number, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new Error(`${label} dépasse ${max} caractères.`);
  }
  return trimmed;
}

function cleanMoney(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 100000) {
    throw new Error(`${label} doit être un montant entre 0 et 100 000 €.`);
  }
  return Math.round(value);
}

function asEstimate(value: unknown): Estimate | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const estimatedResale = record.estimatedResale;
  const confidence = record.confidence;
  const belongs = record.belongs;
  const summary = record.summary;
  const signals = record.signals;
  if (
    typeof estimatedResale !== "number" ||
    !Number.isFinite(estimatedResale) ||
    estimatedResale < 0 ||
    estimatedResale > 20000
  ) {
    return null;
  }
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) return null;
  if (typeof belongs !== "boolean") return null;
  if (typeof summary !== "string" || summary.trim().length < 3) return null;
  if (!Array.isArray(signals) || signals.some((signal) => typeof signal !== "string")) {
    return null;
  }
  if (belongs && estimatedResale <= 0) return null;
  return {
    estimatedResale,
    confidence,
    belongs,
    summary: summary.trim().slice(0, 280),
    signals: signals.map((signal) => signal.trim()).filter(Boolean).slice(0, 8),
  };
}

async function estimateWithModel(
  key: string,
  piste: {
    name: string;
    category: string;
    keywords: string[];
    maxAskingPrice: number;
    minNetMargin: number;
  },
  listing: { title: string; description: string; askingPrice: number; city: string },
): Promise<Estimate | null> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu estimes le prix de revente d'une annonce d'occasion en France, en euros, pour un particulier qui revendrait l'objet sur Leboncoin. Réponds uniquement en JSON : {\"estimatedResale\": number, \"confidence\": number, \"belongs\": boolean, \"summary\": string, \"signals\": string[]}. estimatedResale est un prix de revente conservateur pour l'objet complet, pas le prix demandé. belongs est false si c'est un accessoire, une pièce seule, ou hors de la catégorie de la piste. confidence va de 0 à 90 et baisse si l'annonce est floue. N'invente aucun composant absent du texte. summary tient en une phrase française.",
        },
        {
          role: "user",
          content: JSON.stringify({ piste, listing }),
        },
      ],
    }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return asEstimate(JSON.parse(content));
  } catch {
    return null;
  }
}

export const review = action({
  args: {
    pisteId: v.id("pistes"),
    title: v.string(),
    description: v.string(),
    askingPrice: v.number(),
    shippingPaid: v.number(),
    url: v.string(),
    city: v.string(),
  },
  returns: reviewResult,
  handler: async (ctx, args): Promise<{
    listingId: Id<"listings">;
    verdict: "kept" | "discarded";
    estimatedResale: number;
    fees: number;
    netMargin: number;
    confidence: number;
    reason: string;
    method: "bareme" | "modele";
    signals: string[];
  }> => {
    const title = cleanText(args.title, 140, "Le titre");
    if (title.length < 4) {
      throw new Error("Le titre est trop court pour estimer quoi que ce soit.");
    }
    const description = cleanText(args.description, 5000, "La description");
    const city = cleanText(args.city, 80, "La ville");
    const url = cleanText(args.url, 500, "Le lien");
    const askingPrice = cleanMoney(args.askingPrice, "Le prix demandé");
    const shippingPaid = cleanMoney(args.shippingPaid, "Le port");
    if (askingPrice <= 0) {
      throw new Error("Indique le prix demandé.");
    }

    const piste = await ctx.runQuery(api.pistes.get, { id: args.pisteId });
    if (!piste) throw new Error("Cette piste n'existe plus.");

    const listing = {
      title,
      description,
      askingPrice,
      shippingPaid,
      city,
    };
    const pisteInput = {
      name: piste.name,
      category: piste.category,
      keywords: piste.keywords,
      city: piste.city,
      maxAskingPrice: piste.maxAskingPrice,
      minNetMargin: piste.minNetMargin,
    };

    let method: "bareme" | "modele" = "bareme";
    let estimate = estimateWithBareme(pisteInput, listing);
    const key = env.OPENAI_API_KEY?.trim();
    if (key) {
      const modeled = await estimateWithModel(key, pisteInput, listing);
      if (modeled) {
        estimate = modeled;
        method = "modele";
      }
    }

    const review = applyVerdict(pisteInput, listing, estimate, method);
    const listingId: Id<"listings"> = await ctx.runMutation(internal.listings.save, {
      pisteId: piste._id,
      pisteName: piste.name,
      title,
      description,
      askingPrice,
      shippingPaid,
      url,
      city,
      verdict: review.verdict,
      estimatedResale: review.estimatedResale,
      fees: review.fees,
      netMargin: review.netMargin,
      confidence: review.confidence,
      belongs: review.belongs,
      reason: review.reason,
      method: review.method,
      signals: review.signals,
    });

    return {
      listingId,
      verdict: review.verdict,
      estimatedResale: review.estimatedResale,
      fees: review.fees,
      netMargin: review.netMargin,
      confidence: review.confidence,
      reason: review.reason,
      method: review.method,
      signals: review.signals,
    };
  },
});
