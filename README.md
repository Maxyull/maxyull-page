# maxyull — le plan

Page de liens personnelle de **Maxime Lacoste** (`maxyull`), en ligne sur
**[maxyull.fr](https://maxyull.fr)**.

Ce n'est pas une liste de boutons : c'est une **carte**. Le portrait est au
centre, cinq mères l'entourent, et **cliquer une mère y envoie le portrait** le
long du trait avant que ses destinations ne se déploient. Une liste ne peut pas
dire qu'un dépôt appartient à GitHub qui appartient aux projets ; une carte, si.

Statique, sans dépendance, sans build, **sans aucune requête réseau tierce** :
polices auto-hébergées, icônes en sprite SVG inliné, aucun analytics, aucun
cookie.

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

## Les pièges (à lire avant de modifier)

- **`place:` décide de la position d'une mère, pas l'ordre du tableau.** Chaque
  valeur est payée d'un chevauchement mesuré : « Projets » à gauche (seul flanc
  où sa branche à trois niveaux tient et d'où un éventail vers le haut ne sort
  pas du cadre), « Réseaux » à droite (six enfants, flanc le plus haut),
  « Boutique » et « Gaming » échangées (en haut à droite, PayPal tombait sur
  YouTube). En déplacer une rouvre le sien.
- **Au 3ᵉ niveau, le dernier enfant passe dessous et les autres s'ouvrent vers le
  haut.** Deux règles ont été essayées avant : un éventail vers le haut met
  forcément le milieu en haut et les *deux* extrêmes en bas ; un tour réparti
  régulièrement impose une position qui vise exactement la mère grand-parent.
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

Code sous **MIT** (`LICENSE`). Le portrait, le nom et les marques n'en font pas
partie — c'est écrit dans le fichier. Polices sous **SIL OFL 1.1**
(`fonts/licences/`). Tracés d'icônes issus de **Simple Icons v16 (CC0)**, sauf
LinkedIn, l'épée de Black Desert Idle, la manette, le réseau, le sac et la bulle,
dessinés à la main dans la même voix.
