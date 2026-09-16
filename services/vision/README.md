# Service de vision (segmentation, landmarks, recoloration, silhouette)

Micro-service Python/FastAPI qui execute, **entierement en local sur CPU**,
les traitements de vision par ordinateur reels de l'application :

| Endpoint          | Fonction                                                                 | Modele MediaPipe                     |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------- |
| `POST /analyze`     | Detection visage/corps, classification du cadrage, score de nettete      | Face Landmarker, Pose Landmarker      |
| `POST /segment-hair`| Masque de segmentation des cheveux (debug/admin)                         | Hair Segmenter                        |
| `POST /recolor-hair`| Recoloration reelle des cheveux (transfert de couleur LAB sur le masque) | Hair Segmenter                        |
| `POST /reshape`     | Simulation de silhouette par palier de 2kg (warp local guide par la pose)| Pose Landmarker, Selfie Segmenter      |

Tous les modeles sont ceux publies officiellement par Google (licence
Apache-2.0) ; aucune cle API n'est necessaire pour ce service.

Ce service **ne fait pas** le changement de forme de coiffure (geometrie)
ni l'essayage de vetements (virtual try-on) : ces deux fonctions
necessitent un modele de diffusion generatif, hors de portee d'un CPU. Ils
sont geres par `packages/ai-engine` via un fournisseur externe optionnel
(voir sa documentation).

## Installation

```bash
cd services/vision
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/download_models.sh
```

## Lancement

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8100
```

## Tests

```bash
python -m pytest -v
```

Les tests utilisent des images reelles (`tests/fixtures/`, jeux de test
publics officiels MediaPipe) pour valider la detection de visage, la
classification de cadrage, la recoloration et le warp de silhouette sur
des photos reelles plutot que des donnees synthetiques.

## Algorithmes

- **Recoloration des cheveux** : transfert de couleur en espace LAB
  (type Reinhard), restreint au masque de segmentation des cheveux. Seule
  la moyenne (teinte/luminance) est recentree sur la couleur cible ; la
  variance locale (texture, reflets) est preservee. Les techniques
  bi-ton (balayage, ombre, degrade, meches, racines differentes,
  bicolore) appliquent un gradient racines/pointes entre deux couleurs
  cibles avant ce transfert. Voir `app/color_transform.py`.

- **Simulation de silhouette** : mise a l'echelle horizontale ligne par
  ligne du buste/taille/hanches, centree sur l'axe du corps (landmarks de
  pose) et bornee par la silhouette reelle (Selfie Segmenter). L'effet est
  attenue (taper) en haut/bas et strictement borne aux epaules -> haut
  des cuisses pour ne jamais toucher au visage, a la coiffure, ni creer de
  deformation de membres. Voir `app/silhouette.py` pour les limites
  connues et les pistes d'amelioration (warp thin-plate-spline complet,
  inpainting genere pour les zones revelees).
