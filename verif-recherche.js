/* Banc de la barre de recherche. Chargé uniquement par une page fabriquée à la
   demande depuis index.html (voir README), jamais par index.html.

   Il tape dans le champ, filtre par catégorie, navigue au clavier, choisit un
   résultat, et vérifie ce que la page en fait. Résultat en JSON dans
   <pre id=verif>, entre DEBUT_VERIF et FIN_VERIF.

   ⚠️ CE FICHIER DOIT RESTER EXTERNE, chargé par `<script src>`. Collé en
   ligne dans la page, son propre code source contient les chaînes
   'DEBUT_VERIF' et 'FIN_VERIF' — un lecteur qui les cherche dans le DOM tombe
   alors sur le SOURCE et croit lire un rapport. Ça a fait conclure trois fois
   de suite qu'un piège n'était pas détecté alors que la page plantait pour de
   bon. Le vrai coupable était le lecteur, pas le banc.

   ⚠️ Comme `verif.js`, il coupe transitions et animations : en rendu sans
   interface l'horloge n'avance pas, les nœuds restent à `opacity: 0` et tout
   contrôle de visibilité mesurerait du vide. */
(function () {
  var R = [];
  var ERR = [];
  window.addEventListener('error', function (e) { ERR.push(e.message); });

  var fige = document.createElement('style');
  fige.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}' +
                     '.plan .noeud,.plan .moi{opacity:1}';
  document.head.appendChild(fige);

  var out = document.createElement('pre');
  out.id = 'verif';
  /* hors flux : dans le flux il fausserait la hauteur de la page — voir la
     même leçon en tête de verif.js */
  out.style.cssText = 'position:fixed;top:0;left:0;z-index:99';
  document.body.appendChild(out);

  var q = document.getElementById('q');
  var cat = document.getElementById('cat');
  var tr = document.getElementById('trouve');

  function ok(nom, cond, det) { R.push((cond ? 'OK' : 'RATE') + ' · ' + nom + (det ? ' | ' + det : '')); }
  function tape(v) { q.value = v; q.dispatchEvent(new Event('input')); }
  function res() {
    return [].map.call(document.querySelectorAll('.trouve__r b'), function (e) { return e.textContent; });
  }
  function touche(k) {
    q.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }
  function rendre() {
    var mal = R.filter(function (l) { return l.indexOf('RATE') === 0; });
    out.textContent = 'DEBUT_VERIF' + JSON.stringify({
      verdict: mal.length ? mal : 'rien à signaler',
      controles: R.length,
      langue: document.documentElement.getAttribute('data-lang'),
      exceptions: ERR,
      detail: R
    }, null, 1) + 'FIN_VERIF';
  }

  /* ⚠️ CHIEN DE GARDE. Une exception levée DANS un écouteur ne remonte pas à
     l'appelant : `el.click()` rend la main comme si de rien n'était, la suite
     du banc part en vrille, et sans ce filet le rapport n'est jamais publié —
     un plantage se lirait « le banc n'a rien rendu », un silence au lieu d'un
     défaut nommé. Vérifié : en retirant le reposage du chemin dans `basculer`,
     c'est lui qui dit lequel. */
  setTimeout(function () {
    if (out.textContent) return;
    ERR.forEach(function (e) { R.push('RATE · exception de la page | ' + e); });
    if (!ERR.length) R.push('RATE · le banc s est arrêté avant la fin');
    rendre();
  }, 16000);

  setTimeout(function () {
    ok('la liste est fermée au départ', tr.hidden);
    ok('catégories = tout + les 5 mères', cat.options.length === 6,
       [].map.call(cat.options, function (o) { return o.textContent; }).join(','));
    ok('libellés en français', /Chercher/.test(q.placeholder), q.placeholder);

    tape('you');
    ok('« you » rend YouTube en premier', res()[0] === 'YouTube', res().join(' / '));
    tape('reseaux');
    ok('sans accent, « reseaux » trouve « Réseaux »', res().indexOf('Réseaux') >= 0, res().join(' / '));
    tape('DROPS');
    ok('la casse est ignorée', res().length > 0, res().join(' / '));
    tape('butin');
    ok('un nœud profond est trouvé', res().indexOf('Butin') >= 0, res().join(' / '));
    var ou = document.querySelector('.trouve__ou');
    ok('le chemin est affiché', ou && ou.textContent.indexOf('Projets') === 0, ou ? ou.textContent : '-');

    tape('a');
    var large = res().length;
    cat.value = 'gaming'; cat.dispatchEvent(new Event('change'));
    var etroit = res();
    ok('la catégorie réduit la liste', etroit.length < large, large + ' → ' + etroit.length + ' : ' + etroit.join(' / '));
    ok('et il en reste', etroit.length > 0, etroit.join(' / '));
    cat.value = '*'; cat.dispatchEvent(new Event('change'));

    tape('zzzzz');
    ok('rien trouvé se dit', document.querySelector('.trouve__rien') !== null);

    tape('twitch');
    var lien = document.querySelector('.trouve__r');
    ok('une destination est un lien', lien && lien.tagName === 'A', lien ? lien.tagName : '-');
    ok('elle part en onglet neuf', lien && lien.target === '_blank' && /noopener/.test(lien.rel));

    tape('butin');
    touche('ArrowDown');
    ok('le fléchage sélectionne', document.querySelectorAll('.trouve__r[aria-selected="true"]').length === 1);
    ok('aria-activedescendant suit', q.getAttribute('aria-activedescendant') === 'trouve-0',
       q.getAttribute('aria-activedescendant'));
    touche('Escape');
    ok('Échap vide le champ', q.value === '');
    touche('Escape');
    ok('le 2ᵉ Échap ferme la liste', tr.hidden);

    /* ⚠️ LE CAS QUI PLANTAIT : viser une ÉTAPE dont la branche n'a jamais été
       ouverte, donc dont le nœud n'est pas posé. Sans le reposage du chemin
       dans `basculer`, la carte se vidait. */
    tape('black desert online');
    var b = document.querySelector('.trouve__r');
    ok('une étape est un bouton', b && b.tagName === 'BUTTON', b ? b.tagName : '-');
    if (b) b.click();

    setTimeout(function () {
      var pl = document.getElementById('plan');
      ok('la carte s\'est ouverte dessus', /ouvert/.test(pl.className), pl.className);
      var vus = [].filter.call(pl.querySelectorAll('.noeud'), function (n) {
        return getComputedStyle(n).opacity !== '0';
      }).length;
      ok('des nœuds sont visibles (carte non vide)', vus >= 5, vus + ' nœuds');
      ok('la fratrie visée est posée', [].some.call(pl.querySelectorAll('.n'), function (e) {
        return e.textContent === 'Butin';
      }));
      ok('la liste ne se rouvre pas toute seule', tr.hidden);

      tape('shop');
      document.querySelector('[data-set-lang="en"]').click();
      setTimeout(function () {
        ok('EN : les libellés suivent', /Search/.test(q.placeholder), q.placeholder);
        ok('EN : les catégories suivent', cat.options[0].textContent === 'All',
           [].map.call(cat.options, function (o) { return o.textContent; }).join(','));
        /* changer de langue est un clic HORS du champ : la liste se ferme,
           c'est la règle générale du clic dehors */
        ok('EN : le clic langue ferme la liste', tr.hidden);
        tape('shop');
        ok('EN : « shop » rend Shop', res().indexOf('Shop') >= 0, res().join(' / '));
        ok('aucune exception', ERR.length === 0, ERR.join(' | '));
        rendre();
      }, 900);
    }, 2600);
  }, 2600);
})();
