# News feed (Markdown → RSS)

## Comment publier une actu
1. Crée un fichier dans `news/posts/` avec l’extension `.md`.
2. Ajoute l’entête (front matter) puis le contenu en Markdown.
3. Depuis `news/` : `npm run build` (ou `npm install` puis `npm run build` la première fois).
4. Commits/push : `news/news.xml` est mis à jour, utilisable dans le launcher via `rss`.

## Front matter minimal
```yaml
---
title: "Titre de l’article"
date: 2024-12-09T12:00:00Z   # ISO 8601 (UTC)
author: "Ton nom"
slug: mon-article           # optionnel, sinon le nom du fichier est utilisé
link: "https://ton-site/news/mon-article"   # optionnel, sinon NEWS_SITE_URL/slug
comments: 0                 # optionnel
---
Contenu en **Markdown** ici.
```

## Générer le flux
```bash
cd news
npm install       # à faire une fois
npm run build
```
Le flux est produit dans `news/news.xml`.

## URL publique
Définis la base publique (pour les liens) via la variable d’env :
- Local/CI : `NEWS_SITE_URL="https://ton-url/news" npm run news:build`
- Sinon le script utilise `https://example.com/news`.

Pour servir le flux facilement : active GitHub Pages sur ce dépôt (branche `main`, dossier `/`), l’URL deviendra `https://<ton compte>.github.io/archivesdormeur/news/news.xml`. Mets cette URL dans `distro/distribution.json` → `"rss": "<URL>"`.
