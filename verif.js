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

  var out = document.createElement('pre');
  out.id = 'verif';
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
      debordementV: document.documentElement.scrollHeight - document.documentElement.clientHeight
    };
  }

  var res = [];
  var etapes = [function () { res.push(etat('racine')); }];

  meres.forEach(function (b, k) {
    etapes.push(function () { b.click(); });
    etapes.push(function () { res.push(etat('ouvert: ' + b.querySelector('.n').textContent)); });
    /* ⚠️ Il n'y a plus d'étape au-delà du 1er niveau : GitHub porte une `url`,
       c'est un lien. On vérifie donc seulement que ses dépôts sont bien posés
       en même temps que lui (compté dans `enfants`). */
  });
  etapes.push(function () { document.getElementById('retour').click(); });
  etapes.push(function () { res.push(etat('retour au centre')); });
  etapes.push(function () { document.getElementById('eclat').click(); });
  etapes.push(function () { res.push(etat('vue eclatee')); });
  etapes.push(function () { document.getElementById('eclat').click(); });
  etapes.push(function () { res.push(etat('repliee')); });
  etapes.push(function () {
    out.textContent = 'DEBUT_VERIF' + JSON.stringify({
      langue: document.documentElement.getAttribute('data-lang'),
      externes: performance.getEntriesByType('resource').filter(function (e) { return e.name.indexOf(location.origin) !== 0; }).map(function (e) { return e.name; }),
      iconesCassees: [].slice.call(document.querySelectorAll('use')).filter(function (u) { return !document.getElementById(u.getAttribute('href').slice(1)); }).length,
      etats: res
    }, null, 1) + 'FIN_VERIF';
  });

  var i2 = 0;
  (function suite() {
    if (i2 >= etapes.length) return;
    etapes[i2++]();
    setTimeout(suite, 1500);
  })();
})();
