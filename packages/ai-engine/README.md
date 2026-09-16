# @relook/ai-engine

Abstraction de fournisseur IA generatif pour les deux modules qui
necessitent un modele de diffusion (hors de portee d'un simple CPU) :

- **Changement de forme de coiffure** (`HairstyleProvider`)
- **Essayage virtuel de vetements** (`ClothingTryOnProvider`)

## Pourquoi cette abstraction ?

Le reste de l'application (segmentation, landmarks, recoloration des
cheveux, simulation de silhouette) tourne entierement en local via
`services/vision`, sans dependance externe. Ces deux modules generatifs
sont differents : ils necessitent un modele de diffusion/inpainting que
nous ne pouvons pas faire tourner localement sans GPU dedie.

Plutot que de simuler un resultat (interdit par les exigences produit),
`packages/ai-engine` :

1. Definit des interfaces stables (`HairstyleProvider`, `ClothingTryOnProvider`).
2. Fournit une implementation reelle contre l'API Replicate
   (`HairstyleReplicateProvider`, `ClothingReplicateProvider`), qui ne
   fonctionne que si `REPLICATE_API_TOKEN` est configure.
3. Fournit un provider explicite "non configure"
   (`NotConfiguredHairstyleProvider`/`NotConfiguredClothingProvider`) qui
   renvoie toujours un statut `provider_not_configured` clair — jamais un
   faux succes.

## Configuration

```
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=...           # https://replicate.com/account/api-tokens
REPLICATE_HAIRSTYLE_MODEL_OWNER=stability-ai   # optionnel, defaut fourni
REPLICATE_HAIRSTYLE_MODEL_NAME=stable-diffusion-inpainting
REPLICATE_CLOTHING_MODEL_OWNER=cuuupid
REPLICATE_CLOTHING_MODEL_NAME=idm-vton
```

**Important** : les modeles par defaut ci-dessus sont des modeles publics
reels sur Replicate au moment de l'ecriture. Les schemas d'entree des
modeles tiers peuvent evoluer : avant un deploiement en production,
verifiez le schema courant sur la page Replicate du modele choisi et
ajustez `hairstyle-replicate-provider.ts` / `clothing-replicate-provider.ts`
si necessaire.

## Ajouter un nouveau fournisseur

Implementez `HairstyleProvider` et/ou `ClothingTryOnProvider`
(`src/types.ts`), puis ajoutez un cas dans `src/factory.ts`. Aucune autre
partie de l'application n'a besoin de changer.
