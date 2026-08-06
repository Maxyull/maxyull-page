/* Banc de mesure du plan. Chargé uniquement par verif.html (fabriqué depuis
   index.html par un `sed`), jamais par index.html.

   Deux usages, selon l'URL :
   · sans paramètre        → ouvre chaque mère l'une après l'autre et vérifie
                             qu'aucune étiquette n'en percute une autre ni ne
                             sort du cadre. Résultat en JSON dans <pre id=verif>.
   · ?ouvrir=<id de mère>  → ouvre cette mère et s'arrête là, pour la capture.

   ⚠️ En headless (--virtual-time-budget) l'horloge d'animation n'avance pas :
   une transition reste bloquée sur sa valeur de DÉPART et le portrait est
   mesuré (et dessiné) au centre même après l'avoir envoyé sur une mère. Sans
   le coupe-circuit ci-dessous, les tests de chevauchement mesuraient au mauvais
   endroit et ne prouvaient rien. Le voyage lui-même se juge à l'œil. */
(function () {
  /* ⚠️⚠️ Le second bloc a déjà menti une fois. Les animations d'entrée non plus
     n'avancent pas en headless : les nœuds restent à `opacity: 0`, `boites()`
     les écartait tous, et le banc annonçait « 0 chevauchement » en ne mesurant
     RIEN. Vérifié depuis : il en trouve bien. Ne pas retirer ce coupe-circuit. */
  var fige = document.createElement('style');
  /* ⚠️ `opacity` est remis SANS `!important` : avec, la règle qui atténue les
     mères non ouvertes et masque la mère ouverte perdait, et les captures
     montraient un état qui n'existe pas. */
  /* ⚠️⚠️ TROISIÈME piège du même genre : couper la transition du seul portrait
     ne suffit pas. En headless, une transition d'`opacity` lancée sur un nœud
     reste bloquée sur sa valeur de DÉPART pour toujours — une mère refermée
     restait mesurée à 0, une autre à 0,34, et le banc les écartait comme
     invisibles alors qu'elles sont bien là. Tout est donc coupé, partout. */
  fige.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}' +
                     '.plan .noeud,.plan .moi{opacity:1}' +
                     /* les traits se dessinent par animation : figés, ils
                        restent à `stroke-dashoffset: 1`, donc invisibles */
                     '.traits line{stroke-dashoffset:0}.traits .pouls{display:none}';
  document.head.appendChild(fige);

  var IDS = ['projet', 'contact', 'reseaux', 'gaming', 'shop'];
  var meres = [].slice.call(document.querySelectorAll('.noeud--mere'));
  var seule = new URLSearchParams(location.search).get('ouvrir');
  if (seule) {
    /* ⚠️ La chaîne de minuteurs à vide n'est pas du remplissage : sans travail
       en attente, le headless rend la page AVANT que `fini` (1400 ms) ne soit
       posé, et la capture montre les mères ni atténuées ni masquées. */
    var i = 0;
    var suite = seule.split(',').map(function (id) {
      return function () {
        if (id === 'eclat') return document.getElementById('eclat').click();

        var k = IDS.indexOf(id); if (k >= 0) meres[k].click();
      };
    });
    for (var n = 0; n < 12; n++) suite.push(function () {});
    (function pas() {
      if (i >= suite.length) return;
      suite[i++]();
      setTimeout(pas, 1600);
    })();
    return;
  }

  /* Les exceptions, d'où qu'elles viennent : celles des étapes du banc
     (attrapées plus bas) et celles que la page lève de son côté, dans un
     minuteur ou un écouteur, où le `try` du banc ne va pas. */
  var plantages = [];
  window.addEventListener('error', function (e) {
    plantages.push('page : ' + (e.message || 'erreur') + ' (' + (e.filename || '?').split('/').pop() + ':' + e.lineno + ')');
  });

  var out = document.createElement('pre');
  out.id = 'verif';
  /* ⚠️ QUATRIÈME mensonge du banc, de la même famille que les trois autres :
     ce <pre> est un enfant de plus dans le `flex` du body, avec sa gouttière.
     Posé dans le flux il ajoutait 64 px à la hauteur de la page et
     `debordementV` mesurait le banc, pas la page — il annonçait 96 px là où la
     vraie page en défilait 32. Un chiffre faux dans le rapport vaut zéro
     chiffre : personne ne l'a lu, et le défilement est passé. Hors flux, il ne
     pèse rien. */
  out.style.cssText = 'position:fixed;top:0;left:0;z-index:99';
  document.body.appendChild(out);

  function boites() {
    var l = [];
    document.querySelectorAll('.noeud, .moi__ou, .moi__texte, .moi__bouton').forEach(function (n) {
      /* la mère ouverte est volontairement sous le portrait : la compter ferait
         un faux chevauchement à chaque étape */
      if (n.classList.contains('actif')) return;
      if (n.hidden || n.closest('[hidden]')) return;
      /* ⚠️ Ce test n'est valide QUE grâce au coupe-circuit ci-dessus : sans lui
         tout est à 0 et on ne mesure rien. `boites` en tient le compte, un
         total qui s'effondre veut dire que le banc est redevenu aveugle. */
      if (getComputedStyle(n).opacity === '0') return;
      if (n.classList.contains('moi__texte') && document.getElementById('plan').classList.contains('ouvert')) return;
      var r = n.getBoundingClientRect();
      if (!r.width) return;
      l.push({ t: (n.querySelector('.n') || n.querySelector('b') || n.querySelector('h1') || n).textContent.trim().slice(0, 22) || n.className, r: r });
    });
    return l;
  }

  function chocs() {
    var b = boites(), c = [];
    for (var i = 0; i < b.length; i++) for (var j = i + 1; j < b.length; j++) {
      var A = b[i].r, B = b[j].r;
      if (A.left < B.right - 2 && B.left < A.right - 2 && A.top < B.bottom - 2 && B.top < A.bottom - 2) {
        c.push(b[i].t + ' [' + [A.left, A.top, A.right, A.bottom].map(Math.round) + '] x ' +
               b[j].t + ' [' + [B.left, B.top, B.right, B.bottom].map(Math.round) + ']');
      }
    }
    return c;
  }

  function debords() {
    var p = document.getElementById('plan').getBoundingClientRect();
    return boites().filter(function (o) {
      return o.r.left < p.left - 40 || o.r.right > p.right + 40 || o.r.top < p.top - 8 || o.r.bottom > p.bottom + 8;
    }).map(function (o) { return o.t; });
  }

  function petites() {
    /* ⚠️ `.siege` compte : c'est un bouton (retour au centre), et son anneau
       visible fait 3.04cqw — il passait sous 28 px sur fenêtre étroite. C'est
       la boîte du bouton, volontairement plus large que l'anneau, qui est
       mesurée ici : c'est bien elle qu'on clique. */
    return [].slice.call(document.querySelectorAll('.noeud, .moi__bouton:not([disabled]), .siege:not([disabled]), .langue button'))
      .filter(function (n) { var r = n.getBoundingClientRect(); return r.width && (r.width < 28 || r.height < 28); })
      .map(function (n) { return n.textContent.trim().slice(0, 18) + ' ' + Math.round(n.getBoundingClientRect().width) + 'x' + Math.round(n.getBoundingClientRect().height); });
  }

  function etat(nom) {
    var p = document.getElementById('plan').getBoundingClientRect();
    var m = document.getElementById('moi').getBoundingClientRect();
    var vise = document.querySelector('.noeud--mere.actif');
    var v = vise ? vise.getBoundingClientRect() : null;
    return {
      etape: nom,
      enfants: document.querySelectorAll('.noeud--enfant').length,
      photoSurLaMere: v ? [Math.round(m.left + m.width / 2 - (v.left + v.width / 2)),
                           Math.round(m.top + m.height / 2 - (v.top + v.height / 2))] : 'centre',
      ecartAuCentre: Math.round(m.left + m.width / 2 - (p.left + p.width / 2)) + ',' +
                     Math.round(m.top + m.height / 2 - (p.top + p.height / 2)),
      classes: document.getElementById('plan').className,
      meres: [].slice.call(document.querySelectorAll('.noeud--mere')).map(function(n){return n.querySelector('.n').textContent+':'+n.className.replace('noeud noeud--mere','')+':'+getComputedStyle(n).opacity;}),
      mesurees: boites().map(function(o){return o.t;}),
      chocs: chocs(),
      debords: debords(),
      ciblesTropPetites: petites(),
      debordementH: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      debordementV: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      /* Le plan a touché son plancher de 880 px : il ne peut plus rétrécir pour
         tenir dans la hauteur, la page défile, et c'est le choix assumé de
         styles.css. Au-dessus du plancher, un défilement est un défaut. */
      plancher: Math.round(p.width) <= 881
    };
  }

  var res = [];
  var etapes = [function () { res.push(etat('racine')); }];

  meres.forEach(function (b, k) {
    etapes.push(function () { b.click(); });
    etapes.push(function () { res.push(etat('ouvert: ' + b.querySelector('.n').textContent)); });
    /* ⚠️ GitHub porte une `url`, c'est un LIEN : on ne l'ouvre pas, on vérifie
       seulement que ses dépôts sont posés en même temps que lui (compté dans
       `enfants`). L'étape qui suit descend en revanche jusqu'au 4ᵉ niveau. */
  });

  /* ⚠️ « Black Desert Online » est le SEUL nœud du 4ᵉ niveau, et son ouverture
     est l'état le plus fragile de la carte : c'est le plus profond, le seul où
     le portrait quitte une mère sans y rester, et il n'était mesuré NULLE PART.
     Il a cassé pour de bon — carte vidée, étiquette sous le portrait — pendant
     que le banc annonçait « rien à signaler » neuf fois de suite.
     Le nom est le même en FR et en EN, d'où la recherche par libellé. */
  function parNom(nom) {
    var t = [].filter.call(document.querySelectorAll('#plan .noeud .n'), function (e) {
      return e.textContent.trim() === nom;
    })[0];
    return t ? t.closest('.noeud') : null;
  }
  etapes.push(function () { meres[0].click(); });
  etapes.push(function () {
    var b = parNom('Black Desert Online');
    if (b) b.click(); else res.push({ etape: 'Black Desert Online INTROUVABLE', chocs: ['nœud absent'], debords: [], ciblesTropPetites: [], debordementH: 0, debordementV: 0, plancher: true, mesurees: [] });
  });
  etapes.push(function () { res.push(etat('ouvert: Black Desert Online')); });
  etapes.push(function () { document.getElementById('siege').click(); });

  etapes.push(function () { document.getElementById('retour').click(); });
  etapes.push(function () { res.push(etat('retour au centre')); });
  etapes.push(function () { document.getElementById('eclat').click(); });
  etapes.push(function () { res.push(etat('vue eclatee')); });
  /* ⚠️ Descendre depuis la VUE ÉCLATÉE n'est pas la même chose que descendre
     depuis le repos : la refermeture retire du DOM tout ce qui pend sous les
     mères, y compris le nœud cliqué. Ce chemin-là plantait `basculer` en
     silence et laissait la carte vide. Il se mesure donc, lui aussi. */
  etapes.push(function () { var b = parNom('Black Desert Online'); if (b) b.click(); });
  /* ⚠️ Une étape vide, et elle est NÉCESSAIRE : depuis la vue éclatée le
     portrait fait TROIS vols (centre → Projets → GitHub → Black Desert Online),
     soit 1 860 ms, alors que le banc mesure toutes les 1 500 ms. Sans ce temps
     mort il mesurait EN PLEIN VOL et rapportait un chevauchement qui n'existe
     que pendant le trajet. Depuis le repos il n'y a que deux vols, ça passe. */
  etapes.push(function () {});
  etapes.push(function () { res.push(etat('eclatee puis Black Desert Online')); });
  etapes.push(function () { document.getElementById('siege').click(); });
  etapes.push(function () { res.push(etat('repliee')); });
  /* Le verdict : ce qu'il faut lire quand on n'a pas le temps de lire les
     étapes. Il rassemble ce que le banc sait déjà mesurer — un rapport où
     chaque défaut est enterré dans une étape parmi neuf n'est pas lu.
     ⚠️ Le défilement en fait partie parce qu'il a déjà échappé une fois : la
     page défilait de 32 px, le nom se coupait en haut, et le seul chiffre qui
     le disait était faux (voir le <pre> ci-dessus) puis noyé dans le détail. */
  function verdict() {
    var mal = [];
    plantages.forEach(function (p) { mal.push('EXCEPTION · ' + p); });
    res.forEach(function (e) {
      e.chocs.forEach(function (c) { mal.push(e.etape + ' · chevauchement : ' + c); });
      e.debords.forEach(function (d) { mal.push(e.etape + ' · sort du cadre : ' + d); });
      e.ciblesTropPetites.forEach(function (p) { mal.push(e.etape + ' · cible sous 28 px : ' + p); });
      if (e.debordementH) mal.push(e.etape + ' · la page déborde de ' + e.debordementH + ' px en largeur');
      /* ⚠️ Sous le plancher de 880 px le plan ne rétrécit plus, et la page
         défile : c'est écrit dans styles.css et assumé. Ailleurs, non. */
      if (e.debordementV && !e.plancher) mal.push(e.etape + ' · la page défile de ' + e.debordementV + ' px');
    });
    return mal;
  }

  etapes.push(function () {
    var mal = verdict();
    out.textContent = 'DEBUT_VERIF' + JSON.stringify({
      verdict: mal.length ? mal : 'rien à signaler',
      plantages: plantages,
      /* ⚠️ Sans la taille de fenêtre, `debordementV` ne veut rien dire : la
         hauteur disponible EST ce qui dimensionne le plan. Un rapport sans ce
         couple ne se rejoue pas. */
      fenetre: [window.innerWidth, window.innerHeight],
      langue: document.documentElement.getAttribute('data-lang'),
      externes: performance.getEntriesByType('resource').filter(function (e) { return e.name.indexOf(location.origin) !== 0; }).map(function (e) { return e.name; }),
      iconesCassees: [].slice.call(document.querySelectorAll('use')).filter(function (u) { return !document.getElementById(u.getAttribute('href').slice(1)); }).length,
      etats: res
    }, null, 1) + 'FIN_VERIF';
  });

  /* ⚠️ Une exception dans une étape n'arrêtait pas seulement l'étape : elle
     empêchait le `setTimeout` suivant, donc le banc s'arrêtait pour de bon et
     ne rendait AUCUN rapport. Or c'est exactement ce qu'a fait le clic sur
     « Black Desert Online » depuis la vue éclatée — `basculer` levait une
     exception au milieu, la carte restait vide, et aucune mesure ne le disait.
     Un plantage est un défaut comme un autre : on l'attrape, on le nomme, et
     on continue le parcours. */
  var i2 = 0;
  (function suite() {
    if (i2 >= etapes.length) return;
    try { etapes[i2++](); }
    catch (e) { plantages.push('étape ' + (i2 - 1) + ' : ' + (e && e.message ? e.message : e)); }
    setTimeout(suite, 1500);
  })();
})();
