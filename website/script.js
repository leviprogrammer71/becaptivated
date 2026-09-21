/* BEHOLD! — site interactions */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* Header: solid background after scrolling */
  var header = doc.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var toggle = doc.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = !body.classList.contains('menu-open');
      body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    doc.querySelectorAll('.mobile-panel a, .mobile-panel [data-open]').forEach(function (el) {
      el.addEventListener('click', function () {
        body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Modals (native <dialog>) */
  function openModal(name) {
    var dlg = doc.getElementById('modal-' + name);
    if (!dlg) return;
    doc.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
    if (typeof dlg.showModal === 'function') { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
    store.set('behold-popup-seen', '1');
  }
  doc.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); openModal(opener.getAttribute('data-open')); return; }
    var closer = e.target.closest('[data-close]');
    if (closer) { var d = closer.closest('dialog'); if (d) d.close(); return; }
    if (e.target.tagName === 'DIALOG') { e.target.close(); } // click on backdrop
  });

  /* Gentle auto popup: once per visit, after 20s (never on top of another dialog) */
  var auto = body.getAttribute('data-autopopup');
  if (auto && !store.get('behold-popup-seen')) {
    window.setTimeout(function () {
      if (!doc.querySelector('dialog[open]') && !body.classList.contains('menu-open') && !store.get('behold-popup-seen')) openModal(auto);
    }, 20000);
  }

  /* Preorder form: send visitor to the chosen edition's link */
  doc.querySelectorAll('form[data-preorder]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var chosen = form.querySelector('input[name="edition"]:checked');
      var url = chosen && chosen.getAttribute('data-url');
      if (url && url !== '#') { window.location.href = url; }
      else { window.location.href = 'contact.html?subject=preorder&edition=' + encodeURIComponent(chosen ? chosen.value : ''); }
    });
  });

  /* Sign-up forms (webinar list). Connect to your email provider by giving the form a real action URL. */
  doc.querySelectorAll('form[data-signup]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action');
      if (action && action !== '#') return; // real endpoint configured – let it submit
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.classList.add('is-sent');
    });
  });

  /* Contact form without a backend: open the visitor's email app */
  doc.querySelectorAll('form[data-mailto]').forEach(function (form) {
    var params = new URLSearchParams(window.location.search);
    if (params.get('subject') === 'preorder') {
      var sel = form.querySelector('select[name="subject"]'); if (sel) sel.value = 'Book Order';
      var msg = form.querySelector('textarea'); var ed = params.get('edition');
      if (msg && !msg.value) msg.value = 'Hi Christine, I would like to preorder BEHOLD!' + (ed ? ' (' + ed + ' edition)' : '') + '.';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = new FormData(form);
      var subject = (d.get('subject') || 'Website message') + ' — ' + (d.get('name') || '');
      var text = (d.get('message') || '') + '\n\n' + (d.get('name') || '') + '\n' + (d.get('email') || '');
      window.location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
      form.classList.add('is-sent');
    });
  });

  /* Add to calendar (.ics) */
  doc.querySelectorAll('[data-ics]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BEHOLD//Webinars//EN', 'BEGIN:VEVENT',
        'UID:' + btn.getAttribute('data-uid') + '@behold',
        'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
        'DTSTART:' + btn.getAttribute('data-start'), 'DTEND:' + btn.getAttribute('data-end'),
        'SUMMARY:' + btn.getAttribute('data-title'),
        'DESCRIPTION:' + btn.getAttribute('data-desc'),
        'LOCATION:Online (Zoom)', 'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar' });
      var a = doc.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'behold-webinar.ics';
      doc.body.appendChild(a); a.click();
      window.setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  });

  /* Blog filters */
  var filterBar = doc.querySelector('[data-filter-bar]');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var cat = b.getAttribute('data-cat');
      filterBar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      doc.querySelectorAll('[data-cats]').forEach(function (card) {
        card.hidden = !(cat === 'all' || card.getAttribute('data-cats') === cat);
      });
    });
  }

  /* Full story toggle (About) */
  doc.querySelectorAll('[data-toggle]').forEach(function (btn) {
    var target = doc.getElementById(btn.getAttribute('data-toggle'));
    if (!target) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var show = target.hidden;
      target.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
      var label = btn.querySelector('[data-label]');
      if (label) label.textContent = show ? 'Show less' : 'The full story';
      if (show) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ======================================================================
     MOTION: reveals, parallax, starfields, tilt, transitions
     ====================================================================== */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var observed = [];

  function markRevealTargets() {
    // icons that draw themselves
    doc.querySelectorAll('.feat, .value, .why-col, .topic-card, .icon-list li, .meta-list li, .ws__list li, .icon-circle, .info__icon, .step')
      .forEach(function (el) { el.classList.add('draw'); });
    // botanicals grow, sketches draw across
    doc.querySelectorAll('img[src*="botanical-"]').forEach(function (el, i) {
      if (el.closest('.topic__thumb')) return;
      el.classList.add('grow', 'sway');
      el.style.setProperty('--swt', (6 + (i % 4) * 1.3) + 's');
      el.style.setProperty('--swd', (-(i * 1.7) % 6) + 's');
      if (!/rotate/.test(el.getAttribute('style') || '')) el.style.transformOrigin = '50% 100%';
    });
    doc.querySelectorAll('img[src*="sketch-"]').forEach(function (el) { el.classList.add('wipe'); });
    doc.querySelectorAll('.author-teaser__photo, .collage figure, .feature-card, .featured-post__img, .monitor__screen, .post-card__img')
      .forEach(function (el) { el.classList.add('photo-in'); });
    // ambient floaters
    doc.querySelectorAll('.sci__art img, .sci__art .sci__emc, .stage__note, .collage__note, .list-band__art .script, .values__art .script, .po__foot .script, .ws__foot .script, .pano__caption')
      .forEach(function (el, i) { el.classList.add('floaty'); el.style.setProperty('--fd', (-i * 1.3) + 's'); el.style.setProperty('--ft', (5 + (i % 3)) + 's'); });
    doc.querySelectorAll('img[src*="salmon"]').forEach(function (el) { if (!el.classList.contains('explore-cta__fish')) el.classList.add('swim'); });
    // books: stagger the idle float
    doc.querySelectorAll('.book').forEach(function (b, i) {
      b.style.setProperty('--bd', (-(i * 1.9) % 6) + 's');
      b.style.setProperty('--bt', (5.5 + (i % 3) * 0.9) + 's');
    });
  }

  function splitWords(el) {
    if (el.classList.contains('split')) return;
    var n = 0;
    var walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/);
      if (parts.length === 1 && !parts[0].trim()) return;
      var frag = doc.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
        var w = doc.createElement('span'); w.className = 'w';
        var inner = doc.createElement('span'); inner.className = 'w__i';
        inner.style.setProperty('--i', n++);
        inner.textContent = part;
        w.appendChild(inner); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.classList.add('split');
  }

  function buildSky(sec) {
    if (sec.querySelector(':scope > .sky')) return;
    var sky = doc.createElement('div'); sky.className = 'sky'; sky.setAttribute('aria-hidden', 'true');
    var tex = doc.createElement('div'); tex.className = 'sky__tex';
    var stars = doc.createElement('div'); stars.className = 'sky__stars';
    var area = Math.max(1, sec.offsetWidth * sec.offsetHeight);
    var count = Math.min(46, Math.max(10, Math.round(area / 26000)));
    var starSvg = '<svg viewBox="0 0 20 20"><path fill="currentColor" d="M10 0l1.6 8.4L20 10l-8.4 1.6L10 20l-1.6-8.4L0 10l8.4-1.6z"/></svg>';
    for (var i = 0; i < count; i++) {
      var s = doc.createElement('span');
      var big = Math.random() < 0.28;
      s.className = 'star' + (big ? '' : ' star--dot');
      if (big) s.innerHTML = starSvg;
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.random() * 100).toFixed(2) + '%';
      s.style.setProperty('--s', (big ? 8 + Math.random() * 12 : 1.5 + Math.random() * 2.5).toFixed(1) + 'px');
      s.style.setProperty('--d', (2.5 + Math.random() * 4).toFixed(2) + 's');
      s.style.setProperty('--dl', (-Math.random() * 6).toFixed(2) + 's');
      stars.appendChild(s);
    }
    sky.appendChild(tex); sky.appendChild(stars);
    if (sec.matches('.hero, .page-hero')) {
      for (var k = 0; k < 2; k++) {
        var sh = doc.createElement('span'); sh.className = 'shooting';
        sh.style.setProperty('--t', (8 + Math.random() * 30).toFixed(1) + '%');
        sh.style.setProperty('--l', (35 + Math.random() * 55).toFixed(1) + '%');
        sh.style.setProperty('--sd', (9 + k * 5 + Math.random() * 3).toFixed(1) + 's');
        sh.style.setProperty('--sdl', (2 + k * 4).toFixed(1) + 's');
        stars.appendChild(sh);
      }
    }
    sec.insertBefore(sky, sec.firstChild);
    tex.setAttribute('data-pyf', '-0.12');
    stars.setAttribute('data-pyf', '-0.06');
    stars.setAttribute('data-depth', '-6');
  }

  function initMotion() {
    root.classList.add('motion');

    markRevealTargets();
    doc.querySelectorAll('main h1, main h2, .page-hero__sub').forEach(splitWords);
    doc.querySelectorAll('.sec-navy, .ws__side').forEach(buildSky);

    // scroll progress bar
    if (header) { var bar = doc.createElement('div'); bar.className = 'progress'; header.appendChild(bar); }

    // pointer glow in heroes
    if (finePointer) {
      doc.querySelectorAll('.hero, .page-hero').forEach(function (sec) {
        var g = doc.createElement('span'); g.className = 'glow-follow'; g.setAttribute('aria-hidden', 'true');
        sec.appendChild(g);
        sec.addEventListener('pointermove', function (e) {
          var r = sec.getBoundingClientRect();
          g.style.transform = 'translate3d(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px,0)';
          g.classList.add('is-on');
        });
        sec.addEventListener('pointerleave', function () { g.classList.remove('is-on'); });
      });
    }

    /* ---- reveal + live observers ---- */
    var revealSel = '.reveal, .split, .eyebrow, .draw, .grow, .wipe, .photo-in, .rule-caption, .closing h2, .footer-sign';
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    // clip-path reveals are invisible to IntersectionObserver, so the frame loop checks them
    var clipSel = '.grow, .wipe, .photo-in';
    var pendingClip = [];
    doc.querySelectorAll(revealSel).forEach(function (el) {
      if (el.matches(clipSel) && !el.closest('dialog')) pendingClip.push(el); else io.observe(el);
    });
    function checkClip() {
      if (!pendingClip.length) return;
      pendingClip = pendingClip.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width && r.top < vh * 0.94 && r.bottom > 0) { el.classList.add('is-in'); return false; }
        return true;
      });
    }
    // items inside dialogs reveal when the dialog opens
    doc.querySelectorAll('dialog').forEach(function (d) {
      d.querySelectorAll(revealSel).forEach(function (el) { io.unobserve(el); el.classList.add('is-in'); });
    });

    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-live', en.isIntersecting); });
    }, { rootMargin: '120px 0px 120px 0px' });
    doc.querySelectorAll('main > section, .site-footer').forEach(function (el) { liveIO.observe(el); });

    /* ---- parallax registry ---- */
    var items = [];
    doc.querySelectorAll('[data-py], [data-px], [data-pr], [data-ps], [data-depth], [data-pyf]').forEach(function (el) {
      var ref = el.parentElement ? (el.parentElement.closest('section, footer, .modal__card, .ws__side') || doc.body) : doc.body;
      items.push({
        el: el, ref: ref,
        py: parseFloat(el.getAttribute('data-py')) || 0,
        px: parseFloat(el.getAttribute('data-px')) || 0,
        pr: parseFloat(el.getAttribute('data-pr')) || 0,
        ps: parseFloat(el.getAttribute('data-ps')) || 0,
        pyf: parseFloat(el.getAttribute('data-pyf')) || 0,
        depth: parseFloat(el.getAttribute('data-depth')) || 0
      });
    });
    doc.querySelectorAll('.wl').forEach(function (el) {
      items.push({ el: el, ref: el.parentElement, wave: true,
        wdy: parseFloat(el.getAttribute('data-wdy')) || 0,
        wdx: parseFloat(el.getAttribute('data-wdx')) || 0 });
    });

    var vw = window.innerWidth, vh = window.innerHeight;
    var ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    var ticking = false;

    function setT(it, x, y) {
      var v = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      if (it.last !== v) { it.el.style.translate = v; it.last = v; }
    }
    function frame() {
      ticking = false;
      var small = vw < 900;
      var k = small ? 0.55 : 1;
      ptr.x += (ptr.tx - ptr.x) * 0.075;
      ptr.y += (ptr.ty - ptr.y) * 0.075;
      var moving = Math.abs(ptr.tx - ptr.x) > 0.002 || Math.abs(ptr.ty - ptr.y) > 0.002;
      var rects = new Map();
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var r = rects.get(it.ref);
        if (!r) { r = it.ref.getBoundingClientRect(); rects.set(it.ref, r); }
        if (r.height === 0 || r.bottom < -150 || r.top > vh + 150) continue;
        var p = ((r.top + r.height / 2) - vh / 2) / ((vh + r.height) / 2);
        if (p > 1) p = 1; else if (p < -1) p = -1;
        var x = 0, y = 0;
        if (it.wave) {
          y = it.wdy * r.height * (p + 1) / 2;
          x = it.wdx * r.width * p;
          setT(it, x, y);
          continue;
        }
        y = (it.py * p + it.pyf * r.height * p) * k;
        x = it.px * p * k;
        if (it.depth && finePointer) { x += it.depth * ptr.x; y += it.depth * ptr.y; }
        setT(it, x, y);
        if (it.pr) it.el.style.rotate = (it.pr * p).toFixed(2) + 'deg';
        if (it.ps) it.el.style.scale = (1 + it.ps * (1 - Math.abs(p))).toFixed(3);
      }
      checkClip();
      if (header) {
        var bar = header.querySelector('.progress');
        var max = doc.documentElement.scrollHeight - vh;
        if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
      }
      if (moving) request();
    }
    function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', function () { vw = window.innerWidth; vh = window.innerHeight; request(); });
    window.addEventListener('load', request);
    doc.addEventListener('toggle', request, true);
    doc.querySelectorAll('dialog').forEach(function (d) {
      new MutationObserver(function () { window.setTimeout(request, 30); }).observe(d, { attributes: true, attributeFilter: ['open'] });
    });
    if (finePointer) {
      window.addEventListener('pointermove', function (e) {
        ptr.tx = (e.clientX / vw) * 2 - 1;
        ptr.ty = (e.clientY / vh) * 2 - 1;
        request();
      }, { passive: true });
    }
    request();

    /* ---- book tilt + glare ---- */
    if (finePointer) {
      doc.querySelectorAll('.book').forEach(function (b) {
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
          b.style.setProperty('--ty', ((nx - 0.5) * 30).toFixed(1) + 'deg');
          b.style.setProperty('--tx', ((0.5 - ny) * 18).toFixed(1) + 'deg');
          b.style.setProperty('--gx', (nx * 100).toFixed(0) + '%');
          b.style.setProperty('--gy', (ny * 100).toFixed(0) + '%');
          b.classList.add('is-tilting');
        });
        b.addEventListener('pointerleave', function () {
          b.style.setProperty('--ty', '0deg'); b.style.setProperty('--tx', '0deg');
          b.classList.remove('is-tilting');
        });
      });

      /* ---- magnetic buttons ---- */
      doc.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          btn.style.translate = (dx * 0.18).toFixed(1) + 'px ' + (dy * 0.28).toFixed(1) + 'px';
        });
        btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
      });
    }

    /* ---- soft page transitions ---- */
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
      if (a.protocol !== window.location.protocol || a.host !== window.location.host) return;
      if (a.pathname === window.location.pathname) return;
      e.preventDefault();
      root.classList.add('is-leaving');
      window.setTimeout(function () { window.location.href = a.href; }, 260);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('is-leaving'); });
  }

  if (!reduce) {
    initMotion();
  } else {
    doc.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }
})();
