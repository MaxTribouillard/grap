# Grap

Tu colles une annonce. Grap estime le prix de revente, retire les frais, et ne garde que les objets qui peuvent laisser une marge.

## Lancer

```bash
npx convex dev
```

Dans un second terminal :

```bash
npm run dev
```

Sans clé, le tri utilise un barème interne (cartes, groupes, état). Ce n'est pas le prix des ventes du moment, et ce n'est pas une garantie de bénéfice.

Pour faire relire l'annonce par un modèle :

```bash
npx convex env set OPENAI_API_KEY
```

Grap n'aspire pas Le Bon Coin. Les annonces entrent parce que tu les colles.
