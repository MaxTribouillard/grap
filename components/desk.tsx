"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Category = "pc-gamer" | "velo-course" | "autre";
type Verdict = "kept" | "discarded";

type Listing = {
  _id: Id<"listings">;
  pisteName: string;
  title: string;
  askingPrice: number;
  shippingPaid: number;
  url: string;
  city: string;
  verdict: Verdict;
  estimatedResale: number;
  fees: number;
  netMargin: number;
  confidence: number;
  reason: string;
  method: "bareme" | "modele";
  signals: string[];
};

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const categoryLabel: Record<Category, string> = {
  "pc-gamer": "PC gamer",
  "velo-course": "Vélo de course",
  autre: "Autre",
};

const examples: Array<{
  label: string;
  category: Category;
  title: string;
  description: string;
  askingPrice: number;
  shippingPaid: number;
  city: string;
}> = [
  {
    label: "PC sous-coté",
    category: "pc-gamer",
    title: "PC gamer RTX 4070 Ryzen 7 7700 32 Go SSD 1 To",
    description:
      "Tour complète en bon état, peu servie. Facture disponible. Vente cause déménagement.",
    askingPrice: 390,
    shippingPaid: 0,
    city: "Lyon",
  },
  {
    label: "PC déjà cher",
    category: "pc-gamer",
    title: "PC gamer RTX 4060 Ryzen 5 5600 16 Go",
    description: "Fonctionne très bien, bon état, je m'en sépare.",
    askingPrice: 890,
    shippingPaid: 0,
    city: "Paris",
  },
  {
    label: "Accessoire",
    category: "pc-gamer",
    title: "Souris gamer Logitech G Pro",
    description: "Comme neuve, boîte d'origine, peu servie.",
    askingPrice: 45,
    shippingPaid: 5,
    city: "Lille",
  },
  {
    label: "Vélo sous-coté",
    category: "velo-course",
    title: "Canyon Ultimate CF SL Shimano 105",
    description:
      "Vélo de route carbone, taille M, bon état, révision récente. Groupe 105 complet.",
    askingPrice: 890,
    shippingPaid: 0,
    city: "Bordeaux",
  },
];

function marginLabel(value: number): string {
  const formatted = euro.format(value);
  return value > 0 ? `+${formatted}` : formatted;
}

export function Desk() {
  const pistes = useQuery(api.pistes.list);
  const kept = useQuery(api.listings.listKept);
  const discarded = useQuery(api.listings.listDiscarded);
  const ensureDefaults = useMutation(api.pistes.ensureDefaults);
  const createPiste = useMutation(api.pistes.create);
  const removePiste = useMutation(api.pistes.remove);
  const removeListing = useMutation(api.listings.remove);
  const review = useAction(api.analyze.review);
  const scrape = useAction(api.scraper.scrape);

  const [pisteId, setPisteId] = useState<Id<"pistes"> | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [shippingPaid, setShippingPaid] = useState("0");
  const [city, setCity] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState<Id<"listings"> | null>(null);
  const [notice, setNotice] = useState("");
  const [scrapeNotice, setScrapeNotice] = useState("");

  const [pisteName, setPisteName] = useState("");
  const [pisteCategory, setPisteCategory] = useState<Category>("autre");
  const [pisteKeywords, setPisteKeywords] = useState("");
  const [pisteCity, setPisteCity] = useState("");
  const [pisteMax, setPisteMax] = useState("800");
  const [pisteMargin, setPisteMargin] = useState("80");

  useEffect(() => {
    if (pistes && pistes.length === 0) {
      void ensureDefaults();
    }
  }, [pistes, ensureDefaults]);

  const selectedPiste =
    pistes?.find((piste) => piste._id === pisteId) ?? pistes?.[0];
  const selectedId = selectedPiste?._id ?? "";

  const averageMargin = useMemo(() => {
    if (!kept || kept.length === 0) return null;
    const total = kept.reduce((sum, listing) => sum + listing.netMargin, 0);
    return Math.round(total / kept.length);
  }, [kept]);

  async function submitListing(event?: FormEvent) {
    event?.preventDefault();
    if (!selectedId) {
      setError("Choisis une piste.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await review({
        pisteId: selectedId,
        title,
        description,
        askingPrice: Number(askingPrice),
        shippingPaid: Number(shippingPaid || 0),
        url,
        city,
      });
      setHighlight(result.listingId);
      setNotice(
        result.verdict === "kept"
          ? `Gardée. ${result.reason}`
          : `Écartée. ${result.reason}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le tri a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function runScrape() {
    if (!selectedId) {
      setError("Choisis une piste.");
      return;
    }
    setScraping(true);
    setScrapeNotice("Recherche en cours…");
    setError("");
    try {
      const result = await scrape({
        pisteId: selectedId,
        mode: "simulate",
        count: 20,
      });
      setScrapeNotice(
        `Done — ${result.scraped} analysées, ${result.kept} gardées, ${result.discarded} écartées.`,
      );
    } catch (caught) {
      setScrapeNotice("");
      setError(caught instanceof Error ? caught.message : "Le scraping a échoué.");
    } finally {
      setScraping(false);
    }
  }

  function loadExample(example: (typeof examples)[number]) {
    const piste = pistes?.find((item) => item.category === example.category);
    if (piste) setPisteId(piste._id);
    setTitle(example.title);
    setDescription(example.description);
    setAskingPrice(String(example.askingPrice));
    setShippingPaid(String(example.shippingPaid));
    setCity(example.city);
    setUrl("");
  }

  async function addPiste(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const id = await createPiste({
        name: pisteName,
        category: pisteCategory,
        keywords: pisteKeywords.split(","),
        city: pisteCity,
        maxAskingPrice: Number(pisteMax),
        minNetMargin: Number(pisteMargin),
      });
      setPisteId(id);
      setPisteName("");
      setPisteKeywords("");
      setPisteCity("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Piste refusée.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-5xl tracking-tight text-gain sm:text-6xl">
            Grap
          </p>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            Tu colles une annonce déjà ouverte. Grap estime le prix de revente,
            retire les frais, et ne garde dans le catalogue que ce qui peut
            laisser une marge.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:min-w-64">
          <div className="border border-line bg-paper px-3 py-2">
            <dt className="text-muted">Gardées</dt>
            <dd className="font-display text-2xl">{kept?.length ?? "–"}</dd>
          </div>
          <div className="border border-line bg-paper px-3 py-2">
            <dt className="text-muted">Marge moyenne</dt>
            <dd className="font-display text-2xl text-gain">
              {averageMargin === null ? "–" : marginLabel(averageMargin)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="border border-line bg-paper/90 p-4">
          <h2 className="font-display text-2xl">Annonce</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Grap ne va pas chercher Le Bon Coin tout seul. Le tri porte sur ce
            que tu lui donnes.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => loadExample(example)}
                className="border border-line px-2 py-1 text-xs text-muted hover:border-gain hover:text-foreground"
              >
                {example.label}
              </button>
            ))}
          </div>

          <form onSubmit={submitListing} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-muted">Piste</span>
              <select
                value={selectedId}
                onChange={(event) =>
                  setPisteId(event.target.value as Id<"pistes">)
                }
                className="mt-1 w-full border border-line bg-ink px-3 py-2"
              >
                {(pistes ?? []).map((piste) => (
                  <option key={piste._id} value={piste._id}>
                    {piste.name} · plafond {euro.format(piste.maxAskingPrice)} ·
                    marge {euro.format(piste.minNetMargin)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Titre</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-1 w-full border border-line bg-ink px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-muted">Prix demandé</span>
                <input
                  inputMode="numeric"
                  value={askingPrice}
                  onChange={(event) => setAskingPrice(event.target.value)}
                  required
                  className="mt-1 w-full border border-line bg-ink px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Port payé par toi</span>
                <input
                  inputMode="numeric"
                  value={shippingPaid}
                  onChange={(event) => setShippingPaid(event.target.value)}
                  className="mt-1 w-full border border-line bg-ink px-3 py-2"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-muted">Ville</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-1 w-full border border-line bg-ink px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Lien de l&apos;annonce</span>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
                className="mt-1 w-full border border-line bg-ink px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="mt-1 w-full border border-line bg-ink px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !pistes}
              className="w-full bg-gain px-3 py-3 font-semibold text-ink disabled:opacity-50"
            >
              {busy ? "Estimation…" : "Trier cette annonce"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void runScrape()}
            disabled={scraping || !pistes}
            className="mt-3 w-full border border-line px-3 py-3 font-semibold text-muted disabled:opacity-50 hover:border-gain hover:text-foreground"
          >
            {scraping ? "Scraping en cours…" : "🔍 Scanner Le Bon Coin"}
          </button>

          {error ? (
            <p className="mt-3 text-sm leading-6 text-loss">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-3 text-sm leading-6 text-foreground">{notice}</p>
          ) : null}
          {scrapeNotice ? (
            <p className="mt-3 text-sm leading-6 text-gain">{scrapeNotice}</p>
          ) : null}

          <details className="mt-6 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm text-muted">
              Nouvelle piste
            </summary>
            <form onSubmit={addPiste} className="mt-3 space-y-3">
              <input
                value={pisteName}
                onChange={(event) => setPisteName(event.target.value)}
                placeholder="Nom"
                className="w-full border border-line bg-ink px-3 py-2 text-sm"
              />
              <select
                value={pisteCategory}
                onChange={(event) =>
                  setPisteCategory(event.target.value as Category)
                }
                className="w-full border border-line bg-ink px-3 py-2 text-sm"
              >
                <option value="pc-gamer">PC gamer</option>
                <option value="velo-course">Vélo de course</option>
                <option value="autre">Autre — barème faible</option>
              </select>
              <input
                value={pisteKeywords}
                onChange={(event) => setPisteKeywords(event.target.value)}
                placeholder="Mots-clés, séparés par des virgules"
                className="w-full border border-line bg-ink px-3 py-2 text-sm"
              />
              <input
                value={pisteCity}
                onChange={(event) => setPisteCity(event.target.value)}
                placeholder="Ville, ou vide"
                className="w-full border border-line bg-ink px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={pisteMax}
                  onChange={(event) => setPisteMax(event.target.value)}
                  aria-label="Plafond de prix"
                  className="border border-line bg-ink px-3 py-2 text-sm"
                />
                <input
                  value={pisteMargin}
                  onChange={(event) => setPisteMargin(event.target.value)}
                  aria-label="Marge minimale"
                  className="border border-line bg-ink px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full border border-gain px-3 py-2 text-sm text-gain"
              >
                Créer la piste
              </button>
            </form>
          </details>

          <ul className="mt-4 space-y-2">
            {(pistes ?? []).map((piste) => (
              <li
                key={piste._id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span>
                  <span className="block">{piste.name}</span>
                  <span className="text-muted">
                    {categoryLabel[piste.category]} · plafond{" "}
                    {euro.format(piste.maxAskingPrice)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void removePiste({ id: piste._id })}
                  className="text-muted hover:text-loss"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-8">
          <div>
            <h2 className="font-display text-3xl">Catalogue</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Seulement les annonces au-dessus du seuil de marge, avec une
              confiance suffisante. Le montant est une estimation — le barème
              interne ne voit pas les ventes réelles du moment. Avec une clé
              OpenAI côté Convex, un modèle relit l&apos;annonce à la place du
              barème.
            </p>
            <div className="mt-4 space-y-3">
              {kept === undefined ? (
                <p className="text-muted">Chargement du catalogue…</p>
              ) : kept.length === 0 ? (
                <p className="border border-dashed border-line px-4 py-8 text-muted">
                  Rien n&apos;est gardé pour l&apos;instant. Essaie « PC
                  sous-coté » ou « Vélo sous-coté », puis trie.
                </p>
              ) : (
                kept.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    active={listing._id === highlight}
                    onRemove={() => void removeListing({ id: listing._id })}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl text-muted">Écartées</h2>
            <div className="mt-3 space-y-3">
              {discarded === undefined ? null : discarded.length === 0 ? (
                <p className="text-sm text-muted">
                  Les hors-sujet, les prix déjà justes et les estimations trop
                  fragiles atterrissent ici.
                </p>
              ) : (
                discarded.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    active={listing._id === highlight}
                    onRemove={() => void removeListing({ id: listing._id })}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ListingCard({
  listing,
  active,
  onRemove,
}: {
  listing: Listing;
  active: boolean;
  onRemove: () => void;
}) {
  const kept = listing.verdict === "kept";
  return (
    <article
      className={`border bg-paper p-4 ${active ? "border-gain" : "border-line"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className={`font-display text-4xl tracking-tight ${kept ? "text-gain" : "text-loss"}`}
          >
            {marginLabel(listing.netMargin)}
          </p>
          <h3 className="mt-1 text-lg">{listing.title}</h3>
          <p className="text-sm text-muted">
            {listing.pisteName}
            {listing.city ? ` · ${listing.city}` : ""}
          </p>
        </div>
        <p className="border border-line px-2 py-1 text-xs uppercase tracking-wide text-muted">
          {kept ? "Gardée" : "Écartée"} ·{" "}
          {listing.method === "modele" ? "Modèle" : "Barème"}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6">{listing.reason}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-muted">Demandé</dt>
          <dd>{euro.format(listing.askingPrice)}</dd>
        </div>
        <div>
          <dt className="text-muted">Revente</dt>
          <dd>{euro.format(listing.estimatedResale)}</dd>
        </div>
        <div>
          <dt className="text-muted">Confiance</dt>
          <dd>{listing.confidence}/100</dd>
        </div>
      </dl>
      {listing.signals.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {listing.signals.map((signal) => (
            <li
              key={signal}
              className="bg-ink px-2 py-1 text-xs text-muted"
            >
              {signal}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex gap-4 text-sm">
        {listing.url ? (
          <a
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            className="text-gain"
          >
            Voir l&apos;annonce
          </a>
        ) : null}
        <button type="button" onClick={onRemove} className="text-muted">
          Retirer
        </button>
      </div>
    </article>
  );
}
