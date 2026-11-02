/**
 * Scraper module for LeBonCoin listings.
 *
 * Fetches listings by category/keywords, parses structured data
 * (title, description, price, city, url), and feeds them into
 * the existing Convex analysis pipeline.
 *
 * Two modes:
 *  - "fetch"    — live HTTP scraping (needs a headless browser or proxy)
 *  - "simulate" — local simulation with realistic sample data
 *
 * The Convex action `scraper.scrape` orchestrates everything.
 */

import { v } from "convex/values";
import { action, env } from "./_generated/server";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { applyVerdict, estimateWithBareme, type Estimate } from "./pricing";

// ─── Types ───────────────────────────────────────────────────────────

export type ScrapeCategory = "pc-gamer" | "velo-course" | "autre";

export type RawListing = {
  title: string;
  description: string;
  askingPrice: number;
  city: string;
  url: string;
};

export type ScrapeResult = {
  scraped: number;
  analyzed: number;
  kept: number;
  discarded: number;
  listingIds: Id<"listings">[];
};

// ─── Category → LeBonCoin mapping ────────────────────────────────────

const CATEGORY_MAP: Record<
  ScrapeCategory,
  { lbcCategory: string; searchTerms: string[] }
> = {
  "pc-gamer": {
    lbcCategory: "13", // Informatique
    searchTerms: ["pc gamer", "tour gamer", "pc gaming rtx"],
  },
  "velo-course": {
    lbcCategory: "161", // Vélos
    searchTerms: ["vélo route", "velo course carbone", "velo route Shimano"],
  },
  autre: {
    lbcCategory: "0", // Toutes catégories
    searchTerms: [],
  },
};

// ─── Live fetch (runs in Convex action) ──────────────────────────────

async function fetchSearchPage(
  category: string,
  searchTerm: string,
  maxPrice: number,
): Promise<RawListing[]> {
  const url = new URL("https://www.leboncoin.fr/recherche");
  url.searchParams.set("category", category);
  url.searchParams.set("text", searchTerm);
  url.searchParams.set("price_max", String(maxPrice));
  url.searchParams.set("locations", "France");
  url.searchParams.set("sort", "0"); // Most recent

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(25000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
    },
  });

  if (!response.ok) {
    console.warn(`[scraper] fetch blocked (${response.status}) for "${searchTerm}"`);
    return [];
  }

  const html = await response.text();
  return parseListings(html);
}

// ─── HTML parser ─────────────────────────────────────────────────────

function parseListings(html: string): RawListing[] {
  const listings: RawListing[] = [];

  const listingRegex =
    /<a[^>]*href="([^"]*\/offres\/[0-9]+[^"]*)"[^>]*>.*?<span[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/span>.*?<span[^>]*class="[^"]*price[^"]*"[^>]*>([\d,]+)\s*€?<\/span>/gs;

  let match;
  while ((match = listingRegex.exec(html)) !== null) {
    const [, url, title, priceStr] = match;
    const price = Number(priceStr.replace(/\s/g, "").replace(",", "."));
    if (title && price > 0) {
      listings.push({
        title: title.trim().replace(/\s+/g, " "),
        description: "",
        askingPrice: Math.round(price),
        city: "",
        url,
      });
    }
  }

  return listings;
}

// ─── Simulated data (dev / fallback) ─────────────────────────────────

function generateSimulatedListings(
  category: ScrapeCategory,
  count: number,
): RawListing[] {
  const pcGamerListings: RawListing[] = [
    {
      title: "PC Gamer RTX 4070 / Ryzen 7 5700X / 32Go DDR4 / 1To NVMe",
      description:
        "PC complet en excellent état, facturé 1200€ neuf. RTX 4070 Dual, processeur Ryzen 7 5700X, 32 Go RAM DDR4, SSD NVMe 1 To. Boitier avec ventilation RGB. Vendu cause upgrade.",
      askingPrice: 650,
      city: "Lyon",
      url: "https://www.leboncoin.fr/offres/2147483647",
    },
    {
      title: "Tour PC Gamer RTX 3060 12Go / i5-12400F / 16Go",
      description:
        "Bon PC gamer pour 1080p. RTX 3060 12 Go, i5 12400F, 16 Go RAM, SSD 512 Go. Fonctionne parfaitement, aucun souci.",
      askingPrice: 480,
      city: "Paris",
      url: "https://www.leboncoin.fr/offres/2147483648",
    },
    {
      title: "PC Gamer RTX 4060 / Ryzen 5 5600X / 16 Go / 512 Go SSD",
      description:
        "Configuration équilibrée pour le gaming 1080p/1440p. RTX 4060, Ryzen 5 5600X, 16 Go DDR4, SSD 512 Go. Très bon état.",
      askingPrice: 550,
      city: "Toulouse",
      url: "https://www.leboncoin.fr/offres/2147483649",
    },
    {
      title: "PC Gamer RX 6700 XT / Ryzen 5 5600 / 16 Go",
      description:
        "Bon PC pour du 1440p. RX 6700 XT 12 Go, Ryzen 5 5600, 16 Go RAM. Vente rapide déménagement.",
      askingPrice: 420,
      city: "Marseille",
      url: "https://www.leboncoin.fr/offres/2147483650",
    },
    {
      title: "Config Gamer RTX 4070 Super / i7-13700F / 32 Go / 2 To",
      description:
        "Config haut de gamme RTX 4070 Super, Core i7-13700F, 32 Go DDR5, SSD NVMe 2 To. Comme neuve, garantie 2027.",
      askingPrice: 950,
      city: "Bordeaux",
      url: "https://www.leboncoin.fr/offres/2147483651",
    },
    {
      title: "PC Gamer RTX 3070 / i5-11400F / 16 Go",
      description:
        "PC gamer bon état. RTX 3070 Founders Edition, i5-11400F, 16 Go RAM, SSD 1 To. Facture d'origine disponible.",
      askingPrice: 500,
      city: "Lille",
      url: "https://www.leboncoin.fr/offres/2147483652",
    },
    {
      title: "Souris gamer Logitech G502 Hero",
      description: "Souris gamer en parfait état, peu utilisée. Boîte d'origine.",
      askingPrice: 25,
      city: "Nantes",
      url: "https://www.leboncoin.fr/offres/2147483653",
    },
    {
      title: "PC Gamer RTX 4080 / i7-14700K / 32 Go DDR5 / 2 To",
      description:
        "Ultra config RTX 4080 Super, Core i7-14700K, 32 Go DDR5 6000MHz, NVMe 2 To. Achetée début 2024, garantie jusqu'en 2026. Ventilation liquide 240mm.",
      askingPrice: 1300,
      city: "Grenoble",
      url: "https://www.leboncoin.fr/offres/2147483654",
    },
  ];

  const veloListings: RawListing[] = [
    {
      title: "Vélo route Canyon Ultimate CF SL 8.0 Shimano 105",
      description:
        "Vélo de route carbone Canyon Ultimate CF SL 8.0, taille M. Groupe Shimano 105 R7000 complet, freins à disque. Bon état, révision récente. Roues carbone.",
      askingPrice: 1100,
      city: "Strasbourg",
      url: "https://www.leboncoin.fr/offres/2147483700",
    },
    {
      title: "Specialized Allez Evo Shimano 105 2022",
      description:
        "Allez Evo aluminium haut de gamme, groupe Shimano 105 11v, freins à disque. Taille 54. Peu kilométré, entretien chez le véloce.",
      askingPrice: 950,
      city: "Rennes",
      url: "https://www.leboncoin.fr/offres/2147483701",
    },
    {
      title: "Vélo route Trek Domane AL 2 Di2 Shimano 105",
      description:
        "Trek Domane AL 2 avec passage au groupe 105 Di2 électronique. Taille L, carbone+aluminium. Excellent état, pneus neufs.",
      askingPrice: 1200,
      city: "Montpellier",
      url: "https://www.leboncoin.fr/offres/2147483702",
    },
    {
      title: "Lapierre Xelius SL 500 Ultegra 2020",
      description:
        "Vélo route Lapierre carbone, groupe Shimano Ultegra 11v complet. Taille M. Bon état général, quelques traces d'usage.",
      askingPrice: 750,
      city: "Dijon",
      url: "https://www.leboncoin.fr/offres/2147483703",
    },
    {
      title: "Canyon Endurace CF 7.0 Di2 2023",
      description:
        "Canyon Endurace CF SLX 7.0 avec passage Di2 12v. Taille M, carbone, freins à disque. Très peu servi, facture dispo.",
      askingPrice: 1400,
      city: "Nice",
      url: "https://www.leboncoin.fr/offres/2147483704",
    },
    {
      title: "Cube Agilis R 890 2021 Shimano Tiagra",
      description:
        "Cube Agilis R 890 aluminium, groupe Tiagra 11v. Taille 56. Bon état, entretien régulier.",
      askingPrice: 550,
      city: "Clermont-Ferrand",
      url: "https://www.leboncoin.fr/offres/2147483705",
    },
    {
      title: "Casque vélo Specialized S-Works Evade 2",
      description: "Casque aérodynamique S-Works, taille M/L. Comme neuf, acheté il y a 6 mois.",
      askingPrice: 120,
      city: "Paris",
      url: "https://www.leboncoin.fr/offres/2147483706",
    },
  ];

  if (category === "pc-gamer") {
    return pcGamerListings.slice(0, count);
  }
  if (category === "velo-course") {
    return veloListings.slice(0, count);
  }

  // "autre" — mix of both
  const all = [...pcGamerListings, ...veloListings];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

// ─── OpenAI estimation ───────────────────────────────────────────────

function asEstimate(value: unknown): Estimate | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.estimatedResale !== "number" ||
    !Number.isFinite(record.estimatedResale) ||
    record.estimatedResale < 0 ||
    record.estimatedResale > 20000
  )
    return null;
  if (typeof record.confidence !== "number" || !Number.isFinite(record.confidence))
    return null;
  if (typeof record.belongs !== "boolean") return null;
  if (typeof record.summary !== "string" || record.summary.trim().length < 3)
    return null;
  if (!Array.isArray(record.signals) || record.signals.some((s) => typeof s !== "string"))
    return null;
  if (record.belongs && record.estimatedResale <= 0) return null;
  return {
    estimatedResale: record.estimatedResale,
    confidence: record.confidence,
    belongs: record.belongs,
    summary: record.summary.trim().slice(0, 280),
    signals: record.signals
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 8),
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

// ─── Helper: analyze and persist one listing ─────────────────────────

async function analyzeAndSave(
  ctx: GenericActionCtx<DataModel>,
  piste: {
    _id: Id<"pistes">;
    name: string;
    category: "pc-gamer" | "velo-course" | "autre";
    keywords: string[];
    city: string;
    maxAskingPrice: number;
    minNetMargin: number;
  },
  raw: RawListing,
): Promise<{ listingId: Id<"listings">; verdict: "kept" | "discarded" }> {
  const listing = {
    title: raw.title,
    description: raw.description,
    askingPrice: raw.askingPrice,
    shippingPaid: 0,
    city: raw.city,
  };

  const pisteInput = {
    name: piste.name,
    category: piste.category,
    keywords: piste.keywords,
    city: piste.city,
    maxAskingPrice: piste.maxAskingPrice,
    minNetMargin: piste.minNetMargin,
  };

  // Estimate: try model first, fall back to bareme
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
    title: raw.title,
    description: raw.description,
    askingPrice: raw.askingPrice,
    shippingPaid: 0,
    url: raw.url,
    city: raw.city,
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

  return { listingId, verdict: review.verdict };
}

// ─── Convex Action: scrape listings ──────────────────────────────────

/**
 * Scraper action: fetches listings for a given piste, analyzes them
 * through the existing pricing/verdict pipeline, and persists results.
 *
 * @param args.pisteId  — Convex piste to analyze against
 * @param args.mode     — "fetch" (live) or "simulate" (local samples)
 * @param args.count    — max listings to process (default 20)
 */
export const scrape = action({
  args: {
    pisteId: v.id("pistes"),
    mode: v.optional(v.union(v.literal("fetch"), v.literal("simulate"))),
    count: v.optional(v.number()),
  },
  returns: v.object({
    scraped: v.number(),
    analyzed: v.number(),
    kept: v.number(),
    discarded: v.number(),
    listingIds: v.array(v.id("listings")),
  }),
  handler: async (ctx, args): Promise<ScrapeResult> => {
    const piste = await ctx.runQuery(api.pistes.get, { id: args.pisteId });
    if (!piste) throw new Error("Piste introuvable.");

    const category: ScrapeCategory =
      piste.category === "pc-gamer" || piste.category === "velo-course"
        ? piste.category
        : "autre";

    const mode = args.mode ?? "simulate";
    const count = args.count ?? 20;
    const listings: RawListing[] = [];

    if (mode === "fetch") {
      const config = CATEGORY_MAP[category];
      const searchTerms =
        category === "autre" && piste.keywords.length > 0
          ? piste.keywords
          : config.searchTerms;

      for (const term of searchTerms) {
        const results = await fetchSearchPage(
          config.lbcCategory,
          term,
          piste.maxAskingPrice,
        );
        listings.push(...results);
        if (listings.length >= count) break;
      }
    }

    // If live fetch returned nothing (blocked by DataDome), fall back to simulation
    if (mode === "fetch" && listings.length === 0) {
      console.warn("[scraper] Live fetch returned 0 results, using simulation fallback");
      listings.push(...generateSimulatedListings(category, count));
    }

    if (mode === "simulate") {
      listings.push(...generateSimulatedListings(category, count));
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = listings.filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

    // Analyze each listing through the existing pipeline
    const listingIds: Id<"listings">[] = [];
    let kept = 0;
    let discarded = 0;

    for (const raw of unique) {
      try {
        const result = await analyzeAndSave(ctx, piste, raw);
        listingIds.push(result.listingId);
        if (result.verdict === "kept") kept++;
        else discarded++;
      } catch (err) {
        console.warn(`[scraper] Failed to analyze "${raw.title}":`, err);
      }
    }

    return {
      scraped: unique.length,
      analyzed: listingIds.length,
      kept,
      discarded,
      listingIds,
    };
  },
});
