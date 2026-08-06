# maxyull — le plan

[![Déploiement](https://github.com/Maxyull/maxyull-page/actions/workflows/deployer.yml/badge.svg)](https://github.com/Maxyull/maxyull-page/actions/workflows/deployer.yml)
[![En ligne](https://img.shields.io/website?url=https%3A%2F%2Fmaxyull.fr&label=maxyull.fr)](https://maxyull.fr)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-yellow.svg)](LICENSE)
[![Sans dépendance](https://img.shields.io/badge/build-statique%2C%20sans%20d%C3%A9pendance-4c9a2a)](#comment-cest-construit)

Page de liens personnelle de **Maxime Lacoste** (`maxyull`), en ligne sur
**[maxyull.fr](https://maxyull.fr)**.

Ce n'est pas une liste de boutons : c'est une **carte**. Le portrait est au
centre, cinq mères l'entourent, et **cliquer une mère y envoie le portrait** le
long du trait avant que ses destinations ne se déploient. Une liste ne peut pas
dire qu'un dépôt appartient à GitHub qui appartient aux projets ; une carte, si.

Statique, sans dépendance, sans build : polices auto-hébergées, icônes en
sprite SVG inliné, **aucun cookie**.

Une seule requête sort du domaine, depuis le 2026-08-03 : le marqueur d'audience
**Umami**, auto-hébergé sur `stats.maxyull.fr`, c'est-à-dire sur mon VPS et pas
chez un service tiers. Sans cookie ni identifiant persistant, donc sans bandeau
de consentement. La porte de publication de `deployer.yml` continue de refuser
tout le reste, et ne tolère que cette URL exacte.

## Lancer en local

Le dossier se sert tel quel :

```bash
python -m http.server 8781
```

Puis ouvrir <http://localhost:8781/index.html>. Un double-clic sur `index.html`
marche aussi.

## Comment c'est construit

| Fichier | Rôle |
|---|---|
| `index.html` | Le sprite d'icônes, le chapeau, le plan, le repli mobile, **et l'arbre** (`MERES`) d'où tout est dérivé |
| `styles.css` | Mise en page, animations, repli mobile, mouvement réduit |
| `tokens.css` | Couleurs, typographie, espacements, durées |
| `fonts/` | Space Grotesk + JetBrains Mono (variables, latin), sous OFL 1.1 |
| `verif.js` | Banc de mesure : ouvre chaque étape et vérifie chevauchements, débordements et cibles tactiles |

### Une seule source de vérité

`MERES`, dans `index.html`, porte la parenté, les textes FR/EN et les
destinations. **Les traits SVG, les nœuds du plan et la liste mobile en sont
tous les trois dérivés.** Écrits séparément, ils finiraient par diverger —
c'était le défaut de la première version.

### La règle qui gouverne tout

> **`url` ⇒ destination (un lien), même si le nœud a des enfants.
> Pas d'`url` + `enfants` ⇒ étape (un bouton) où le portrait se rend.**

Les cinq mères n'ont pas d'`url` : ce sont des étapes. GitHub, lui, a les deux —
il est cliquable *et* parent de ses dépôts, ce qui n'est tenable que parce
qu'arriver sur « Projets » déplie déjà ses dépôts : il n'y a rien à ouvrir, donc
rien ne se perd à ce que le clic parte.

Ce dépliage « dans la foulée » va d'**un seul cran**, jamais plus (`foulee`, dans
`fratrie()`). Il est là pour qu'arriver sur « Projets » ne montre pas GitHub tout
seul — pas pour vider la branche entière. « Black Desert Online », qui est une
étape sous GitHub, garde donc ses deux outils repliés jusqu'à ce qu'on l'ouvre.
Sans cette limite les huit nœuds de la branche se posaient pleine taille dans le
tiers gauche, et **aucune position ne s'en sortait** : le balayage complet des
angles et des rayons ne rendait que 7 px de marge, contre 22 une fois la cascade
coupée.

### Deux façons de revenir

> **Le portrait remonte d'un cran. Le siège vide, au centre, ramène au centre.**

Le portrait *est* le bouton retour : depuis GitHub il ramène à « Projets », pas
au centre — et son libellé le dit. L'anneau pointillé laissé à la place du
portrait est un bouton lui aussi, et celui-là rentre **d'un coup**, en suivant
les traits (deux étapes depuis le 2ᵉ niveau : on ne coupe jamais à travers la
carte). Il n'apparaît, et ne devient cliquable, qu'une fois le portrait parti :
au repos il est exactement sous la photo et lui volerait son clic. `Échap` fait
comme le portrait.

## Les pièges (à lire avant de modifier)

- **`place:` décide de la position d'une mère, pas l'ordre du tableau.** Chaque
  valeur est payée d'un chevauchement mesuré : « Projets » à gauche (seul flanc
  où sa branche à trois niveaux tient et d'où un éventail vers le haut ne sort
  pas du cadre), « Réseaux » à droite (six enfants, flanc le plus haut),
  « Boutique » et « Gaming » échangées (en haut à droite, PayPal tombait sur
  YouTube). En déplacer une rouvre le sien.
- **Au 3ᵉ niveau les angles sont écrits en dur** (`TOUR`, dans `index.html`), pas
  calculés. GitHub n'a pas un tour libre : le bord gauche le serre et « Projets »
  lui barre le flanc droit, il ne lui reste que deux secteurs séparés — ce
  qu'aucun éventail régulier ne sait exprimer. Trois formules ont été essayées
  avant, la dernière ayant tenu jusqu'à ce qu'un 4ᵉ dépôt la fasse poser un nœud
  sur « Projets ». Le 5ᵉ (« Black Desert Online ») a été mesuré à son tour :
  -98°, et un `bras` à lui seul pour monter chercher le coin haut-gauche.
  **Un 6ᵉ dépôt demande une nouvelle mesure**, il n'y a pas d'angle pour lui.
- **Un trait ne doit traverser aucune étiquette**, et c'est une vraie règle de
  la carte : hors des cinq traits qui partent du portrait, elle n'a **aucun**
  croisement. Un banc qui ne compare que les boîtes ne le voit pas. Une
  première version de « Black Desert Online » passait tous les tests de
  chevauchement et se faisait quand même barrer « Butin » et « Rubin » par le
  trait qui va du centre à « Projets ». Une fois la règle imposée, le balayage
  complet ne rend plus **aucune** position dans le corps de la carte : les 222
  qui restent sont toutes à gauche de GitHub, dans le coin haut, et aucune à
  moins de 210 unités de lui. C'est pour ça que ce bras est long.
- **En vue normale, c'est la NOTE qui fait la largeur** dès qu'elle dépasse le
  nom. « chronomètre de quêtes » portait Rubin à 132 unités, « compteur de
  butin » Butin à 107 — à ces largeurs il n'existait littéralement aucune
  position valide sur la carte. Raccourcies en « les quêtes » et « les drops »,
  elles tombent à 63 et 57, et 222 positions s'ouvrent. Rallonger une note,
  c'est refermer la porte.
- **Un nœud peut poser ses enfants lui-même** (`angles`, `anneau`) et s'éloigner
  de ses frères (`bras`). Ça n'existe que pour « Black Desert Online », le seul
  nœud du 4ᵉ niveau. Sur l'anneau ordinaire il tombait à 42 px de « Auto Claim
  Twitch Drops », l'étiquette la plus large de la carte, et `TOUR[2]` aurait
  envoyé ses deux outils droit au-dessus et droit en dessous — il n'y a plus la
  hauteur pour ça si bas dans l'arbre.
- **Trois états à vérifier, pas un.** Une position peut passer en vue éclatée
  (étiquettes rapetissées, notes masquées) et se chevaucher en vue normale, où
  les nœuds sont pleine taille. Il faut mesurer : *Projets ouverte*, *Black
  Desert Online ouverte* (les mères s'effacent, le portrait change de place) et
  *vue éclatée*. En français **et** en anglais : les étiquettes n'ont pas la
  même largeur.
- **Un banc qui ne trouve rien ne prouve rien tant qu'on ne l'a pas piégé.**
  Avant de croire un rapport vert, poser volontairement un nœud sur un trait et
  vérifier que le banc le signale, puis le remettre en place. C'est la seule
  façon de distinguer « rien à signaler » de « rien mesuré » — et ce banc-là
  s'est déjà tu quatre fois.
- **Toute destination s'ouvre dans un onglet neuf** (`dehors()`, appelée aux
  *deux* endroits où un `<a>` est fabriqué : le plan et le repli mobile). La
  carte reste donc ouverte derrière, à l'endroit où on l'a laissée — son état ne
  vit qu'en mémoire, un retour arrière du navigateur la ramenait au centre.
- **Le plan est borné par la hauteur** et tout ce qu'il contient est dimensionné
  en `cqw` (`container-type: inline-size`). Remettre une taille en px ferait
  grossir cet élément quand la carte rétrécit, et les étiquettes se
  percuteraient sur les petits écrans.
- **`pathLength="1"`** sur chaque trait, posé en JS (c'est un attribut SVG, pas
  une propriété CSS) : sans lui, un trait court se dessine plus vite qu'un long
  et la construction paraît boiteuse.
- **`.plan.fini`** décroche l'animation d'entrée des mères. Sans elle, son
  `forwards` garde la main sur `opacity` et le fondu des mères non ouvertes ne
  se produit jamais.
- **Mouvement réduit** : tout est coupé, et traits + nœuds sont **remis
  visibles**. Leur état initial est « invisible » ; sans ces règles, la page
  resterait vide pour qui a désactivé les animations.
- **Le repli mobile (≤ 880 px) a sa propre identité** : le portrait vit dans le
  plan, qui est masqué à cette largeur.
- **Le siège, c'est deux boîtes** : le bouton fait 44 px au minimum, l'anneau
  qu'on voit n'est qu'un `::before` de 3.04cqw. Dessiné à même le bouton, il
  descendait sous 28 px sur fenêtre étroite — et le banc le rapportait, à juste
  titre : on ne vise pas un anneau de 26 px.
- **`_noeud` peut être nul dans `basculer`**, et seulement en rentrant au centre
  depuis le 2ᵉ niveau : le repli part alors de la mère et a déjà retiré le nœud
  d'où l'on vient. Sans le garde-fou, le clic sur le siège lançait une exception
  au lieu du voyage. Le retour d'un cran, lui, ne repliait jamais que sous le
  nœud courant : il ne l'a jamais rencontré.

## Le banc de mesure

`verif.js` n'est pas chargé par la page. On fabrique une page de test :

```bash
sed 's|</body>|<script src="verif.js"></script></body>|' index.html > verif.html
```

Puis on la rend dans un navigateur sans interface et on lit le JSON produit. Il
ouvre chaque étape, en FR et en EN, et rapporte chevauchements, débordements,
cibles sous 28 px et requêtes externes.

> ⚠️ **Ce banc a déjà menti trois fois**, toujours pour la même raison : en rendu
> sans interface, l'horloge d'animation n'avance pas. Une transition lancée reste
> bloquée sur sa valeur de départ *pour toujours*, et les nœuds restent à
> `opacity: 0` — le banc les écartait tous et annonçait « 0 chevauchement » **en
> ne mesurant rien**. D'où les coupe-circuits en tête de fichier. Les retirer
> rend le rapport vert et faux.

## Déploiement

Un `git push` sur `main` met [maxyull.fr](https://maxyull.fr) à jour, via
`.github/workflows/deployer.yml`. Les secrets à renseigner sont listés en tête
de ce fichier.

## Licences

Code sous **MIT** (`LICENSE`). Le portrait, le nom, les marques et les polices
n'en font pas partie : le détail est dans **`NOTICE.md`**.
