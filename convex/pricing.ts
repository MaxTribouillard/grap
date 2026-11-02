export type Category = "pc-gamer" | "velo-course" | "autre";

export type PisteInput = {
  name: string;
  category: Category;
  keywords: string[];
  city: string;
  maxAskingPrice: number;
  minNetMargin: number;
};

export type ListingInput = {
  title: string;
  description: string;
  askingPrice: number;
  shippingPaid: number;
  city: string;
};

export type Estimate = {
  estimatedResale: number;
  confidence: number;
  belongs: boolean;
  summary: string;
  signals: string[];
};

export type Review = Estimate & {
  fees: number;
  netMargin: number;
  verdict: "kept" | "discarded";
  reason: string;
  method: "bareme" | "modele";
};

const FRICTION = 0.08;

type Tagged = { keys: string[]; label: string; value: number };

const GPUS: Tagged[] = [
  { keys: ["rtx 5090", "5090"], label: "RTX 5090", value: 1600 },
  { keys: ["rtx 5080", "5080"], label: "RTX 5080", value: 1000 },
  { keys: ["rtx 5070 ti", "5070 ti"], label: "RTX 5070 Ti", value: 700 },
  { keys: ["rtx 5070", "5070"], label: "RTX 5070", value: 520 },
  { keys: ["rtx 5060 ti", "5060 ti"], label: "RTX 5060 Ti", value: 360 },
  { keys: ["rtx 5060", "5060"], label: "RTX 5060", value: 280 },
  { keys: ["rtx 4090", "4090"], label: "RTX 4090", value: 1100 },
  { keys: ["rtx 4080 super"], label: "RTX 4080 Super", value: 780 },
  { keys: ["rtx 4080", "4080"], label: "RTX 4080", value: 700 },
  { keys: ["rtx 4070 ti super"], label: "RTX 4070 Ti Super", value: 560 },
  { keys: ["rtx 4070 ti", "4070 ti"], label: "RTX 4070 Ti", value: 500 },
  { keys: ["rtx 4070 super"], label: "RTX 4070 Super", value: 460 },
  { keys: ["rtx 4070", "4070"], label: "RTX 4070", value: 400 },
  { keys: ["rtx 4060 ti", "4060 ti"], label: "RTX 4060 Ti", value: 280 },
  { keys: ["rtx 4060", "4060"], label: "RTX 4060", value: 210 },
  { keys: ["rtx 3090"], label: "RTX 3090", value: 480 },
  { keys: ["rtx 3080 ti"], label: "RTX 3080 Ti", value: 360 },
  { keys: ["rtx 3080"], label: "RTX 3080", value: 300 },
  { keys: ["rtx 3070 ti"], label: "RTX 3070 Ti", value: 240 },
  { keys: ["rtx 3070"], label: "RTX 3070", value: 200 },
  { keys: ["rtx 3060 ti"], label: "RTX 3060 Ti", value: 170 },
  { keys: ["rtx 3060"], label: "RTX 3060", value: 140 },
  { keys: ["rx 7900 xtx"], label: "RX 7900 XTX", value: 620 },
  { keys: ["rx 7900 xt"], label: "RX 7900 XT", value: 500 },
  { keys: ["rx 7800 xt"], label: "RX 7800 XT", value: 400 },
  { keys: ["rx 7700 xt"], label: "RX 7700 XT", value: 320 },
  { keys: ["rx 6800 xt"], label: "RX 6800 XT", value: 300 },
  { keys: ["rx 6800"], label: "RX 6800", value: 250 },
  { keys: ["rx 6700 xt"], label: "RX 6700 XT", value: 200 },
];

const CPUS: Tagged[] = [
  { keys: ["9800x3d"], label: "Ryzen 7 9800X3D", value: 340 },
  { keys: ["7800x3d"], label: "Ryzen 7 7800X3D", value: 280 },
  { keys: ["7700x"], label: "Ryzen 7 7700X", value: 180 },
  { keys: ["7700"], label: "Ryzen 7 7700", value: 170 },
  { keys: ["7600x"], label: "Ryzen 5 7600X", value: 140 },
  { keys: ["7600"], label: "Ryzen 5 7600", value: 130 },
  { keys: ["14900"], label: "Core i9-14900", value: 240 },
  { keys: ["14700"], label: "Core i7-14700", value: 200 },
  { keys: ["14600"], label: "Core i5-14600", value: 150 },
  { keys: ["13900"], label: "Core i9-13900", value: 200 },
  { keys: ["13700"], label: "Core i7-13700", value: 160 },
  { keys: ["13600"], label: "Core i5-13600", value: 130 },
  { keys: ["5800x3d"], label: "Ryzen 7 5800X3D", value: 180 },
  { keys: ["5700x"], label: "Ryzen 7 5700X", value: 90 },
  { keys: ["5600x"], label: "Ryzen 5 5600X", value: 80 },
  { keys: ["5600"], label: "Ryzen 5 5600", value: 80 },
  { keys: ["12400"], label: "Core i5-12400", value: 70 },
];

const BIKE_BRANDS: Tagged[] = [
  { keys: ["s-works", "sworks"], label: "S-Works", value: 2600 },
  { keys: ["pinarello"], label: "Pinarello", value: 2200 },
  { keys: ["cervelo"], label: "Cervélo", value: 2000 },
  { keys: ["specialized"], label: "Specialized", value: 1500 },
  { keys: ["canyon"], label: "Canyon", value: 1500 },
  { keys: ["trek"], label: "Trek", value: 1300 },
  { keys: ["orbea"], label: "Orbea", value: 1200 },
  { keys: ["cannondale"], label: "Cannondale", value: 1100 },
  { keys: ["lapierre"], label: "Lapierre", value: 850 },
  { keys: ["cube"], label: "Cube", value: 800 },
  { keys: ["van rysel"], label: "Van Rysel", value: 700 },
  { keys: ["triban"], label: "Triban", value: 420 },
  { keys: ["btwin"], label: "Btwin", value: 280 },
  { keys: ["decathlon"], label: "Decathlon", value: 350 },
];

const PC_ACCESSORIES = [
  "souris",
  "clavier",
  "ecran",
  "moniteur",
  "tapis",
  "casque",
  "manette",
  "webcam",
];

const BIKE_ACCESSORIES = [
  "casque",
  "cuissard",
  "maillot",
  "pedales",
  "pneus seuls",
  "home trainer",
];

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function hasToken(text: string, key: string): boolean {
  const foldedKey = fold(key).trim();
  if (!foldedKey) return false;
  const escaped = foldedKey
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(text);
}

function firstHit(text: string, rows: Tagged[]): Tagged | null {
  const ranked = [...rows].sort((a, b) => {
    const longest = (row: Tagged) =>
      Math.max(...row.keys.map((key) => fold(key).length));
    return longest(b) - longest(a);
  });
  for (const row of ranked) {
    if (row.keys.some((key) => hasToken(text, key))) return row;
  }
  return null;
}

function keywordHit(text: string, keywords: string[]): boolean {
  const useful = keywords.map((keyword) => fold(keyword).trim()).filter(Boolean);
  if (useful.length === 0) return true;
  return useful.some((keyword) => text.includes(keyword));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function euro(value: number): string {
  return `${Math.round(value)} €`;
}

function conditionFactor(text: string, signals: string[]): { factor: number; confidenceDelta: number } {
  if (
    hasToken(text, "pour pieces") ||
    hasToken(text, "hors service") ||
    hasToken(text, "hs") ||
    text.includes("ne demarre pas") ||
    text.includes("ne sallume pas") ||
    text.includes("s'allume pas") ||
    text.includes("pour piece")
  ) {
    signals.push("Annonce abîmée ou pour pièces");
    return { factor: 0.35, confidenceDelta: -18 };
  }
  if (text.includes("a reparer") || text.includes("reparer")) {
    signals.push("À réparer");
    return { factor: 0.55, confidenceDelta: -10 };
  }
  if (
    hasToken(text, "neuf") ||
    text.includes("sous blister") ||
    text.includes("jamais servi")
  ) {
    signals.push("État neuf ou quasi neuf");
    return { factor: 1.12, confidenceDelta: 6 };
  }
  if (text.includes("bon etat") || text.includes("tres bon")) {
    signals.push("Bon état indiqué");
    return { factor: 1, confidenceDelta: 4 };
  }
  return { factor: 1, confidenceDelta: 0 };
}

function memoryValue(text: string, signals: string[]): number {
  if (/\b64\s?go\b/.test(text) || /\b64\s?gb\b/.test(text)) {
    signals.push("64 Go de RAM");
    return 70;
  }
  if (/\b32\s?go\b/.test(text) || /\b32\s?gb\b/.test(text)) {
    signals.push("32 Go de RAM");
    return 35;
  }
  if (/\b16\s?go\b/.test(text) || /\b16\s?gb\b/.test(text)) {
    signals.push("16 Go de RAM");
    return 12;
  }
  return 0;
}

function storageValue(text: string, signals: string[]): number {
  if (/\b2\s?to\b/.test(text) || /\b2\s?tb\b/.test(text)) {
    signals.push("SSD 2 To");
    return 45;
  }
  if (/\b1\s?to\b/.test(text) || /\b1\s?tb\b/.test(text)) {
    signals.push("SSD 1 To");
    return 25;
  }
  return 0;
}

function looksLikeFullPc(text: string): boolean {
  return (
    text.includes("pc gamer") ||
    text.includes("ordinateur") ||
    hasToken(text, "tour") ||
    text.includes("unite centrale") ||
    text.includes("boitier") ||
    text.includes("setup") ||
    text.includes("config")
  );
}

function groupsetFactor(text: string, signals: string[]): number {
  if (
    text.includes("dura-ace") ||
    text.includes("dura ace") ||
    text.includes("super record") ||
    hasToken(text, "red axs") ||
    hasToken(text, "sram red")
  ) {
    signals.push("Groupe haut de gamme");
    return 1.4;
  }
  if (
    text.includes("ultegra") ||
    hasToken(text, "force") ||
    text.includes("chorus")
  ) {
    signals.push("Groupe Ultegra / Force / Chorus");
    return 1.12;
  }
  if (text.includes("tiagra") || hasToken(text, "claris") || hasToken(text, "sora")) {
    signals.push("Groupe entrée de gamme");
    return 0.62;
  }
  if (/\b105\b/.test(text) || hasToken(text, "rival")) {
    signals.push("Groupe 105 / Rival");
    return 1;
  }
  return 0.9;
}

function yearFactor(text: string, signals: string[]): { factor: number; confidenceDelta: number } {
  const match = text.match(/\b(20[0-2][0-9])\b/);
  if (!match) {
    signals.push("Millésime absent");
    return { factor: 0.9, confidenceDelta: -12 };
  }
  const year = Number(match[1]);
  if (year >= 2023) {
    signals.push(`Millésime ${year}`);
    return { factor: 1, confidenceDelta: 6 };
  }
  if (year >= 2019) {
    signals.push(`Millésime ${year}`);
    return { factor: 0.78, confidenceDelta: -4 };
  }
  signals.push(`Millésime ${year}, ancien`);
  return { factor: 0.5, confidenceDelta: -14 };
}

function estimatePc(text: string, keywords: string[]): Estimate {
  const signals: string[] = [];
  const gpu = firstHit(text, GPUS);
  const cpu = firstHit(text, CPUS);
  const accessory = PC_ACCESSORIES.some((word) => hasToken(text, word));
  const full = looksLikeFullPc(text);
  const onPiste = keywordHit(text, keywords);

  if (!gpu && !cpu && accessory) {
    return {
      estimatedResale: 0,
      confidence: 22,
      belongs: false,
      summary: "Accessoire ou périphérique, pas un PC complet.",
      signals: ["Hors catalogue"],
    };
  }

  if (gpu && !full && !cpu) {
    return {
      estimatedResale: gpu.value,
      confidence: 48,
      belongs: false,
      summary: `${gpu.label} seule : la piste vise un PC complet.`,
      signals: [gpu.label, "Carte seule"],
    };
  }

  if (!gpu && !cpu) {
    return {
      estimatedResale: 0,
      confidence: 18,
      belongs: false,
      summary: onPiste
        ? "Pas assez d'indices pour reconnaître un PC gamer."
        : "L'annonce ne correspond pas à la piste PC gamer.",
      signals: ["Configuration illisible"],
    };
  }

  const ram = memoryValue(text, signals);
  const storage = storageValue(text, signals);
  const condition = conditionFactor(text, signals);
  let resale = (gpu?.value ?? 220) + (cpu?.value ?? 150) + ram + storage;
  if (!gpu) {
    resale += 80;
    signals.push("Carte graphique non précisée");
  } else {
    signals.unshift(gpu.label);
  }
  if (cpu) signals.splice(gpu ? 1 : 0, 0, cpu.label);
  resale = Math.round(resale * condition.factor);

  let confidence = 36;
  if (gpu) confidence += 22;
  if (cpu) confidence += 14;
  if (ram || storage) confidence += 6;
  confidence += condition.confidenceDelta;
  if (!full) confidence -= 8;

  return {
    estimatedResale: resale,
    confidence: clamp(confidence, 0, 82),
    belongs: true,
    summary: [gpu?.label, cpu?.label].filter(Boolean).join(" + ") || "PC reconnu",
    signals,
  };
}

function estimateBike(text: string, keywords: string[]): Estimate {
  const signals: string[] = [];
  const brand = firstHit(text, BIKE_BRANDS);
  const bikeWord =
    text.includes("velo") ||
    text.includes("route") ||
    text.includes("cadre") ||
    text.includes("bike") ||
    text.includes("course");
  const accessory =
    BIKE_ACCESSORIES.some((word) => text.includes(fold(word))) && !bikeWord;
  const onPiste = keywordHit(text, keywords);

  if (accessory || (!brand && !bikeWord)) {
    return {
      estimatedResale: 0,
      confidence: 20,
      belongs: false,
      summary: onPiste
        ? "Ça ne ressemble pas à un vélo de course complet."
        : "Hors piste vélo de course.",
      signals: ["Hors catalogue"],
    };
  }

  if (text.includes("roues seules") || (text.includes("roue") && !bikeWord && !brand)) {
    return {
      estimatedResale: 0,
      confidence: 24,
      belongs: false,
      summary: "Paire de roues ou pièce détachée, pas un vélo.",
      signals: ["Hors catalogue"],
    };
  }

  const base = brand?.value ?? 480;
  if (brand) signals.push(brand.label);
  else signals.push("Marque non reconnue");

  const group = groupsetFactor(text, signals);
  const year = yearFactor(text, signals);
  const condition = conditionFactor(text, signals);
  let factor = group * year.factor * condition.factor;
  if (text.includes("carbone") || text.includes("carbon") || text.includes("cf sl")) {
    signals.push("Cadre carbone");
    factor *= brand ? 1.08 : 1.2;
  }
  if (text.includes("cadre seul")) {
    signals.push("Cadre seul");
    factor *= 0.42;
  }
  if (text.includes("di2") || text.includes("etap") || text.includes("axs")) {
    signals.push("Transmission électrique");
    factor *= 1.08;
  }

  let confidence = brand ? 58 : 34;
  confidence += year.confidenceDelta + condition.confidenceDelta;
  if (group !== 0.9) confidence += 8;

  return {
    estimatedResale: Math.round(base * factor),
    confidence: clamp(confidence, 0, 80),
    belongs: true,
    summary: brand ? `${brand.label} reconnu` : "Vélo de route sans marque claire",
    signals,
  };
}

export function estimateWithBareme(piste: PisteInput, listing: ListingInput): Estimate {
  const text = fold(`${listing.title}\n${listing.description}`);
  if (piste.category === "pc-gamer") return estimatePc(text, piste.keywords);
  if (piste.category === "velo-course") return estimateBike(text, piste.keywords);

  const onPiste = keywordHit(text, piste.keywords);
  return {
    estimatedResale: 0,
    confidence: 15,
    belongs: onPiste,
    summary: onPiste
      ? "Piste libre : le barème ne couvre pas cette catégorie."
      : "Hors des mots de la piste.",
    signals: ["Pas de barème"],
  };
}

export function applyVerdict(
  piste: PisteInput,
  listing: ListingInput,
  estimate: Estimate,
  method: "bareme" | "modele",
): Review {
  const signals = [...estimate.signals];
  if (
    piste.city.trim() &&
    listing.city.trim() &&
    fold(piste.city) !== fold(listing.city)
  ) {
    signals.push(`Ville ${listing.city}, piste calée sur ${piste.city}`);
  }

  const friction = Math.round(Math.max(0, estimate.estimatedResale) * FRICTION);
  const fees = friction + Math.max(0, listing.shippingPaid);
  const netMargin = Math.round(estimate.estimatedResale - fees - listing.askingPrice);
  const confidence = clamp(estimate.confidence, 0, 90);

  let verdict: "kept" | "discarded" = "kept";
  let reason = `${estimate.summary}. Marge nette estimée : ${euro(netMargin)}.`;

  if (!estimate.belongs) {
    verdict = "discarded";
    reason = estimate.summary;
  } else if (listing.askingPrice > piste.maxAskingPrice) {
    verdict = "discarded";
    reason = `Prix demandé ${euro(listing.askingPrice)}, au-dessus du plafond ${euro(piste.maxAskingPrice)}. Revente estimée ${euro(estimate.estimatedResale)}.`;
  } else if (confidence < 40) {
    verdict = "discarded";
    reason = `${estimate.summary}. Confiance ${confidence}/100, trop basse pour miser.`;
  } else if (netMargin < piste.minNetMargin) {
    verdict = "discarded";
    reason = `Revente estimée ${euro(estimate.estimatedResale)}, frais ${euro(fees)}, marge ${euro(netMargin)}. Sous le seuil de ${euro(piste.minNetMargin)}.`;
  } else {
    reason = `${estimate.summary}. Revente estimée ${euro(estimate.estimatedResale)}, frais ${euro(fees)} (8 % de négo${listing.shippingPaid ? ` + port ${euro(listing.shippingPaid)}` : ""}), marge nette ${euro(netMargin)}.`;
  }

  return {
    estimatedResale: Math.round(Math.max(0, estimate.estimatedResale)),
    confidence,
    belongs: estimate.belongs,
    summary: estimate.summary,
    signals,
    fees,
    netMargin,
    verdict,
    reason,
    method,
  };
}
