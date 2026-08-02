"""Rend leurs iris bleus au personnage : le generateur les sort verts.

C est le piege n°2 de la character sheet (`freelance/branding/character-sheet`),
ou il est note comme SYSTEMATIQUE : le prompt ne suffit pas a le corriger de
facon fiable, ca se repare apres coup. Maxime a les yeux bleus.

    python outils/yeux-bleus.py perso-src/brut-bras-croises.png

Ecrit a cote, suffixe `-yeux`. La correction permute les canaux vert et bleu :
un iris (100, 150, 110) devient (100, 110, 150), ce qui garde l ombrage et le
trait au lieu de poser un aplat.

⚠️ La selection est bornee par une ZONE, pas par la seule teinte, exactement pour
la raison notee dans la character sheet : la chemise a motif porte des feuilles
kaki que le meme test de teinte attrape des qu on le desserre.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent

FRANC = 12       # ecart qui designe un vert franc, pour trouver les iris
DOUX = 5         # ecart retenu ensuite, dans la seule zone des iris
MARGE = 3        # px ajoutes autour de la boite trouvee


def main() -> None:
    a = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    a.add_argument("entree")
    args = a.parse_args()

    chemin = Path(args.entree)
    chemin = chemin if chemin.is_absolute() else RACINE / chemin
    im = np.asarray(Image.open(chemin).convert("RGB")).astype(int)
    r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]

    franc = (g > r + FRANC) & (g > b + FRANC) & (g > 70)
    if not franc.any():
        print("aucun iris vert, rien a faire")
        return

    ys, xs = np.where(franc)
    y0, y1 = max(0, ys.min() - MARGE), ys.max() + MARGE + 1
    x0, x1 = max(0, xs.min() - MARGE), xs.max() + MARGE + 1

    zone = np.zeros(franc.shape, bool)
    zone[y0:y1, x0:x1] = True
    cible = zone & (g > r + DOUX) & (g > b + DOUX)

    sortie = im.copy()
    sortie[cible, 1], sortie[cible, 2] = im[cible, 2], im[cible, 1]

    dest = chemin.with_name(f"{chemin.stem}-yeux.png")
    Image.fromarray(sortie.astype(np.uint8)).save(dest)
    print(f"{dest.name} — {int(cible.sum())} px corriges "
          f"dans x{x0}-{x1} y{y0}-{y1}")


if __name__ == "__main__":
    main()
