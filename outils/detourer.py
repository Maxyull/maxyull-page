"""Detoure une illustration Meshy posee sur fond blanc, pour le decor de la page.

Sert aux deux sujets du decor : le poste de travail (`bureau-src/`) et le
personnage (`perso-src/`). Chaque sujet garde ses images dans son dossier, seul
l outil est commun.

    python outils/detourer.py bureau-src/brut-isole.png bureau.webp
    python outils/detourer.py perso-src/brut-bras-croises.png perso.webp --lum 1

Il ecrit aussi, a cote de l image d entree, un `apercu-<sortie>.png` : la meme
image composee sur le papier du site.
⚠️ C est le SEUL controle valable. Un PNG a canal alpha s affiche sur du blanc ou
sur un damier selon la visionneuse, et un fond blanc oublie y est parfaitement
invisible — c est ce qui a laisse passer les enclaves du bureau au premier jet.

Le detourage se fait par CONNEXITE, jamais au seuil global : l ecran vertical du
bureau, les reflets sur la vitre de la tour et les touches du clavier contiennent
des pixels aussi clairs que le fond. Seules les zones blanches qui TOUCHENT le
bord de l image sont du fond.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage

RACINE = Path(__file__).resolve().parent.parent
PAPIER = (0x0a, 0x0c, 0x0b)          # --color-paper de tokens.css, pour l apercu

SEUIL = 236          # un pixel plus clair que ca, sur les 3 canaux, est candidat
ECART = 12           # ... et quasi neutre : |max canal - min canal| sous cet ecart
EROSION = 1          # px manges sur le sujet, pour tuer la frange blanche
FLOU = 0.7           # px de flou sur l alpha, pour un bord non crenele

# Poches blanches ENCLAVEES : du fond coince entre le plateau et les ecrans, que
# la connexite seule ne peut pas voir. On ne peut pas toutes les jeter, la page
# de documentation affichee sur l ecran vertical en est une aussi.
# Ce qui les separe, mesure sur l image : le fond du generateur est un aplat
# quasi pur (moyenne 254, ecart-type < 2,2) la ou une page dessinee porte du
# texte et de l ombrage (moyenne < 245, ecart-type ~ 5).
ENCLAVE_MIN = 200    # px, en dessous c est un detail de dessin, on n y touche pas
ENCLAVE_MOY = 250.0
ENCLAVE_ECART = 3.0


def masque_fond(rgb: np.ndarray) -> np.ndarray:
    """True la ou c est le fond : ce qui touche le bord, plus les enclaves unies."""
    clair = rgb.min(axis=2) >= SEUIL
    neutre = (rgb.max(axis=2).astype(int) - rgb.min(axis=2)) <= ECART
    candidat = clair & neutre

    etiquettes, n = ndimage.label(candidat)
    if n == 0:
        return np.zeros(candidat.shape, bool)

    bord = np.concatenate([
        etiquettes[0, :], etiquettes[-1, :], etiquettes[:, 0], etiquettes[:, -1],
    ])
    garde = set(np.unique(bord[bord > 0]).tolist())

    tailles = ndimage.sum(candidat, etiquettes, range(1, n + 1))
    for i, taille in enumerate(tailles, start=1):
        if i in garde or taille < ENCLAVE_MIN:
            continue
        vals = rgb[etiquettes == i]
        if vals.mean() >= ENCLAVE_MOY and vals.std() <= ENCLAVE_ECART:
            garde.add(i)

    return np.isin(etiquettes, sorted(garde))


def detourer(entree: Path, sortie: Path, lum: float) -> None:
    im = Image.open(entree).convert("RGB")

    sujet = ~masque_fond(np.asarray(im))
    if EROSION:
        sujet = ndimage.binary_erosion(sujet, iterations=EROSION)

    alpha = Image.fromarray((sujet * 255).astype(np.uint8), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(FLOU))

    if lum != 1:
        im = ImageEnhance.Brightness(im).enhance(lum)
    im = im.convert("RGBA")
    im.putalpha(alpha)
    im = im.crop(im.getbbox())          # plus de marge blanche inutile a servir

    im.save(sortie, "WEBP", quality=90, method=6)

    # ⚠️ L apercu va dans decor-src, JAMAIS a cote de l entree : les poses du
    # personnage sont lues dans la character sheet, et l ecrire la-bas deposait
    # des fichiers de controle du site au milieu d un autre projet.
    papier = Image.new("RGBA", im.size, PAPIER + (255,))
    apercu = RACINE / "decor-src" / f"apercu-{sortie.stem}.png"
    Image.alpha_composite(papier, im).convert("RGB").save(apercu)

    print(f"{sortie.name} {im.size} {sortie.stat().st_size // 1024} Ko "
          f"— sujet {100 * sujet.mean():.1f} % du carre — controle {apercu.name}")


def main() -> None:
    a = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    a.add_argument("entree", help="illustration Meshy sur fond blanc")
    a.add_argument("sortie", help="webp a ecrire, relatif a la racine du site")
    a.add_argument("--lum", type=float, default=1.0,
                   help="assombrissement (0,88 pour le bureau, dont le bois "
                        "tapait trop fort sur le papier)")
    args = a.parse_args()

    entree = Path(args.entree)
    entree = entree if entree.is_absolute() else RACINE / entree
    sortie = Path(args.sortie)
    sortie = sortie if sortie.is_absolute() else RACINE / sortie
    detourer(entree, sortie, args.lum)


if __name__ == "__main__":
    main()
