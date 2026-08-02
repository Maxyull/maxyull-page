# Le décor de la page

Deux sujets illustrés, posés derrière le plan (`.decor` dans `styles.css`) : **le poste de
travail** de Maxime en bas à droite, et **Maxime en personnage** debout à gauche.

| Sujet | Livrable | Sources |
|---|---|---|
| le poste | `../bureau.webp` (95 Ko) | ici |
| le personnage | `../perso-macbook.webp`, `../perso-bras-croises.webp` (53 Ko) | dans la character sheet, voir plus bas |

Le style n'est pas choisi au hasard : c'est celui de la marionnette
`freelance/branding/character-sheet` (contours noirs marqués, aplats, ombrage doux). Le
même Maxime dessiné sert donc au site et aux vidéos.

⚠️ **Ce dépôt est public, la photo source ne l'est pas.** `photo-source.webp` et
`photo.jpg` montrent l'intérieur de Maxime : ils sont exclus par `.gitignore` et ne doivent
jamais être forcés dedans. Seul le dessin qui en dérive est publié.

---

## Le poste de travail

```
photo-source.webp     la photo, telle qu'envoyée (c'est un WEBP malgré son nom d'origine)
  └─ photo.jpg        même image en JPEG, ce que l'API accepte
      └─ Meshy image_to_image  réf. 1 photo.jpg + réf. 2 le buste de la character sheet
          └─ brut-entier.png   la scène dessinée, table débarrassée, mur encore là
              └─ Meshy image_to_image  réf. brut-entier.png
                  └─ brut-isole-jeux.png  même scène sur fond blanc, sans mur ni LED
                      └─ Meshy image_to_image  réf. brut-isole-jeux.png
                          └─ brut-isole.png   écrans remplis de travail de dev
                              └─ outils/detourer.py
                                  └─ ../bureau.webp
```

```bash
python outils/detourer.py decor-src/brut-isole.png bureau.webp --lum 0.88
```

`--lum 0.88` n'est utile qu'ici : le bois clair du plateau tapait trop fort sur le papier
du site. Les écrans montrent GitHub, un éditeur de code, un terminal, de la documentation,
et à gauche cette page-ci avec le portrait de Maxime. `brut-isole-jeux.png` garde l'état
précédent, où ils affichaient des jeux.

**45 crédits Meshy** (`nano-banana-pro`, 9 par passe), dont 18 en essais abandonnés : un
cadrage 3:4 serré sur la moitié droite du poste, puis sa version table vide.

## Le personnage

⚠️ **Ses sources ne sont pas ici** : elles vivent dans
`freelance/branding/character-sheet/2-generation/`, avec les autres générations du
personnage, sous le préfixe `pose-`. C'est ce dossier qui fait foi pour tout ce qui
représente Maxime.

```
character-sheet/4-planches/character-sheet-maxyull.png
  └─ 2-generation/pose-ref-corps-face.png   la vue de face seule, découpée et doublée
      └─ Meshy image_to_image  réf. 1 la vue de face + réf. 2 le buste
          ├─ pose-bras-croises.png
          │   └─ outils/yeux-bleus.py → pose-bras-croises-bleu.png
          └─ pose-macbook.png
```

```bash
CS=../freelance/branding/character-sheet/2-generation
python outils/detourer.py $CS/pose-bras-croises-bleu.png perso-bras-croises.webp
python outils/detourer.py $CS/pose-macbook.png           perso-macbook.webp
```

Pas de `--lum` : le personnage est déjà sombre, seule son opacité CSS le retient. **18
crédits Meshy**, 9 par pose. Changer de pose = changer le `src` et les `width`/`height` de
`.decor__perso` dans `index.html`, les deux webp existent déjà.

---

## Les sept pièges

**1. `image_to_image` ignore le ratio.** Il n'a pas de paramètre `aspect_ratio`, contrairement
à `text_to_image`, et sort toujours en 1024×1024. Cadrer la référence en portrait n'y change
rien. Le format final se règle donc au détourage et en CSS, pas à la génération.

**2. Le détourage doit se faire par connexité, jamais au seuil.** L'écran vertical, les
reflets sur la vitre de la tour et les touches du clavier contiennent des pixels aussi
clairs que le fond blanc. Un seuil global les trouait. `outils/detourer.py` n'enlève que
les zones blanches qui **touchent le bord** de l'image.

**3. Il faut éroder d'un pixel avant de flouter l'alpha.** Sans ça, la frange à demi blanche
du contour survit et dessine un liséré clair tout autour du sujet sur le papier noir du
site — visible exactement là où le trait cartoon devrait être net.

**4. Retirer le mur retire aussi la barre LED.** Elle est fixée dessus : isolée, elle
flotterait dans le vide. C'est pour ça que le décor n'a plus le zigzag lumineux du vrai
bureau, alors qu'il est présent dans `brut-entier.png` si on veut le récupérer.

**5. Du fond blanc reste ENCLAVÉ entre le plateau et les écrans**, et la connexité ne peut
pas le voir : il ne touche aucun bord. Mais on ne peut pas jeter toutes les enclaves, la
page de documentation affichée sur l'écran vertical en est une aussi. Ce qui les sépare se
mesure : le fond du générateur est un aplat quasi pur (moyenne 254, écart-type sous 2,2)
là où une page dessinée porte du texte et de l'ombrage (moyenne sous 245, écart-type ~5).
⚠️ Le contrôle doit se faire sur `apercu-<sortie>.png`, jamais sur un PNG à canal alpha :
selon la visionneuse celui-ci s'affiche sur du blanc, où un fond oublié est invisible.
C'est exactement ce qui a laissé passer ces enclaves au premier jet.

**6. Les yeux du personnage sortent verts, par intermittence.** C'est le piège n°2 de la
character sheet, reproduit ici : la pose bras croisés est sortie avec des iris verts,
Maxime les a bleus. La pose MacBook est sortie bleue du premier coup — donc il faut
**regarder à chaque génération**. `outils/yeux-bleus.py` corrige après coup.

**7. Il faut donner la vue de face DÉCOUPÉE de la planche, pas la planche entière.** Piège
n°3 de la character sheet : sur la planche complète, le modèle mélange les trois vues.

## Régler le décor sans rien regénérer

Tout se joue dans `styles.css` : `opacity`, `rotate` pour le biais du poste, `width` /
`height` pour l'échelle, `right` / `bottom` / `left` pour l'ancrage.

⚠️ Le dégradé horizontal du masque du poste s'arrête à 12 % : il ne sert qu'à noyer la
coupe du cadre. Le rallonger mange l'écran de gauche, celui qui affiche cette page-ci.

⚠️ Le personnage est plus effacé que le poste (.13 contre .16), à dessein : sa peau claire
est la seule grande plage lumineuse du décor, à opacité égale il sautait aux yeux alors que
le poste, presque noir, restait en retrait.

Sous 880 px, le personnage passe en `display: none` — le repli prend toute la largeur, il
se retrouverait pile derrière les libellés des liens.
