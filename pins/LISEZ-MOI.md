# pins/ — les visuels Pinterest

Ces PNG ne servent **pas** au site. Ils sont ici pour une seule raison : Metricool
ne sait programmer une épingle qu'à partir d'une **URL publique**, jamais d'un
fichier local. Ce dossier est donc l'entrepôt qui rend `maxyull.fr/pins/<id>.png`
adressable, et rien d'autre.

⚠️ **Ce dossier n'est pas la source.** La source est
`D:\DEV\freelance\pinterest\publish\` : `epingles.json` + `gabarit.html`, rendus par
`generer.py`. Modifier un PNG ici serait perdu au prochain rendu. Toute correction
se fait là-bas, puis on recopie :

```bash
cp D:/DEV/freelance/pinterest/publish/sorties/*.png D:/DEV/maxyull-page/pins/
```

⚠️ **Aucune page du site n'y renvoie**, volontairement : ce sont des visuels de
diffusion, pas du contenu. Ils restent malgré tout publics et indexables, ce qui est
sans inconvénient ici puisqu'ils sont faits pour être vus.

Le poids total tourne autour de 2 Mo pour dix épingles. Si le dossier grossit
beaucoup (la phase 2 prévoit cinq épingles par semaine), penser à purger celles
déjà publiées : une fois l'épingle en ligne, Pinterest héberge sa propre copie et
l'URL d'origine ne sert plus à rien.
