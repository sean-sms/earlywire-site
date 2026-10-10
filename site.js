/* EarlyWire site scripts. Plain JavaScript, no libraries, no network calls except this site's own files. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- stars ---- */
  function stars(svg, n, seed) {
    if (!svg) return;
    var ns = 'http://www.w3.org/2000/svg', s = seed || 7;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < n; i++) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', (rnd() * 100).toFixed(2) + '%');
      c.setAttribute('cy', (rnd() * 70).toFixed(2) + '%');
      c.setAttribute('r', (0.5 + rnd() * 1.2).toFixed(2));
      c.setAttribute('fill', '#fff');
      c.setAttribute('opacity', (0.25 + rnd() * 0.7).toFixed(2));
      svg.appendChild(c);
    }
  }
  stars($('#stars'), 90, 11);
  stars($('#stars2'), 60, 29);
  stars($('#skyStars'), 70, 5);

  /* ---- nav and progress ---- */
  var nav = $('#nav'), bar = $('.progress');
  var hasTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  function onScroll() {
    nav.classList.toggle('solid', window.scrollY > 40);
    if (!hasTimeline) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', h > 0 ? (window.scrollY / h).toFixed(4) : 0);
    }
  }
  var mbtn = $('#menuBtn');
  function setMenu(open) {
    if (!mbtn) return;
    nav.classList.toggle('open', open);
    mbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mbtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }
  if (mbtn) {
    mbtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); mbtn.focus(); } });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760) setMenu(false); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- reveal on scroll (visible at rest if anything fails) ---- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { ro.observe(el); });
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('in'); }); }, 4000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- hero video ---- */
  var hv = $('#heroVideo');
  if (hv) {
    if (reduce) { hv.removeAttribute('autoplay'); hv.pause(); hv.setAttribute('controls', ''); }
    else { var p = hv.play(); if (p && p.catch) p.catch(function () { hv.setAttribute('controls', ''); }); }
  }

  /* ---- drag the night ---- */
  var slider = $('#night');
  if (slider) {
    var card = $('#skyCard'), sky = $('#sky'), clock = $('#clock'), logs = $$('#log li');
    // night to dawn, as RGB stops: top, mid, bottom
    var stops = [
      [[7, 15, 36], [15, 33, 80], [30, 55, 110]],
      [[12, 24, 62], [38, 62, 130], [96, 112, 160]],
      [[40, 70, 140], [120, 130, 170], [244, 160, 100]],
      [[90, 130, 200], [190, 170, 170], [255, 190, 110]]
    ];
    function mix(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
    function col(c) { return 'rgb(' + c.join(',') + ')'; }
    function render() {
      var m = +slider.value, t = m / 540;
      var f = t * (stops.length - 1), i = Math.min(Math.floor(f), stops.length - 2), u = f - i;
      var g = [0, 1, 2].map(function (k) { return col(mix(stops[i][k], stops[i + 1][k], u)); });
      sky.style.background = 'linear-gradient(180deg,' + g[0] + ' 0%,' + g[1] + ' 55%,' + g[2] + ' 100%)';
      card.style.setProperty('--t', t.toFixed(3));
      var mins = 22 * 60 + m, hh = Math.floor(mins / 60) % 24, mm = mins % 60;
      var ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12 === 0 ? 12 : hh % 12;
      clock.innerHTML = h12 + ':' + (mm < 10 ? '0' : '') + mm + '<small>' + ap + '</small>';
      logs.forEach(function (li) { li.classList.toggle('on', m >= +li.getAttribute('data-at')); });
    }
    slider.addEventListener('input', render);
    render();
    if (!reduce && 'IntersectionObserver' in window) {
      // gently play the night once when it first scrolls into view, unless the visitor has touched it
      var touched = false, played = false;
      ['pointerdown', 'keydown', 'input'].forEach(function (ev) { slider.addEventListener(ev, function () { touched = true; }); });
      new IntersectionObserver(function (es, ob) {
        if (!es[0].isIntersecting || played) return;
        played = true; ob.disconnect();
        var start = null, dur = 5200;
        (function step(ts) {
          if (touched) return;
          if (start === null) start = ts;
          var k = Math.min((ts - start) / dur, 1), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          slider.value = Math.round(e * 540 / 5) * 5; render();
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      }, { threshold: 0.55 }).observe(card);
    }
  }

  /* ---- compose your morning ---- */
  var chips = $$('.chip'), cards = $$('.tcard'), mins = { sports: 45, news: 31, music: 39, brief: 0 };
  function compose() {
    var total = 0, n = 0;
    chips.forEach(function (c) {
      var on = c.getAttribute('aria-pressed') === 'true', k = c.getAttribute('data-k');
      var card = $('.tcard[data-k="' + k + '"]');
      if (card) card.classList.toggle('on', on);
      if (on) { total += mins[k]; n++; }
    });
    $('#todayEmpty').hidden = n > 0;
    $('#totalMin').textContent = total > 0 ? total + ' min of video and music' : (n > 0 ? 'Written only' : '0 min');
    $('#totalLabel').textContent = n === 1 ? '1 part' : n + ' parts';
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      compose();
    });
  });
  compose();

  /* ---- feature steps with a sticky phone ---- */
  var steps = $$('.step'), imgs = $$('#stageScreen img');
  function show(name) {
    imgs.forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-name') === name); });
  }
  if ('IntersectionObserver' in window && steps.length) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          steps.forEach(function (s) { s.classList.toggle('active', s === e.target); });
          show(e.target.getAttribute('data-img'));
        }
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* ---- video theatre ---- */
  var vids = {
    tour: { src: 'assets/video/tour.mp4', poster: 'assets/img/poster-tour.jpg', dur: '1:05', title: 'The one-minute tour', desc: 'Choose what you want, watch EarlyWire build it, play it in YouTube, change a setting with a sentence, pick the days, then read or listen. It ends on Today.' },
    setup: { src: 'assets/video/setup.mp4', poster: 'assets/img/poster-setup.jpg', dur: '0:25', title: 'Set up in a minute', desc: 'Tick a template, press Build my morning, and watch EarlyWire read YouTube and the news for real, with progress for each part.' },
    listen: { src: 'assets/video/listen.mp4', poster: 'assets/img/poster-listen.jpg', dur: '0:26', title: 'Read, then listen', desc: 'Open a brief, switch from Read to Listen, and follow along as it is read. The recording has no sound; the app speaks out loud.' },
    describe: { src: 'assets/video/describe.mp4', poster: 'assets/img/poster-describe.jpg', dur: '0:17', title: 'Start a brief from a sentence', desc: 'Describe what you want to follow. EarlyWire suggests a name, topics and keywords for you to review before anything is saved.' }
  };
  var tv = $('#theatreVideo'), tabs = $$('#tabs .tab');
  function pick(key, autoplay) {
    var v = vids[key]; if (!v) return;
    tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-v') === key ? 'true' : 'false'); });
    tv.pause(); tv.poster = v.poster; tv.src = v.src; tv.load();
    $('#vDur').textContent = v.dur; $('#vTitle').textContent = v.title; $('#vDesc').textContent = v.desc;
    if (autoplay) { var p = tv.play(); if (p && p.catch) p.catch(function () {}); }
  }
  if (tv) {
    tv.src = vids.tour.src;
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t.getAttribute('data-v'), true); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); pick(n.getAttribute('data-v'), false); }
      });
    });
  }

  /* ---- device tabs ---- */
  var dtabs = $$('.seg button');
  dtabs.forEach(function (b) {
    b.addEventListener('click', function () {
      dtabs.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      ['iphone', 'ipad', 'mac'].forEach(function (d) { $('#shots-' + d).hidden = d !== b.getAttribute('data-d'); });
    });
  });

  /* ---- real testimonials, if any have been added to testimonials.json ---- */
  if (window.fetch) {
    fetch('testimonials.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      var box = $('#quotes'), invite = $('#invite');
      list.forEach(function (t) {
        if (!t || !t.quote || !t.name) return;
        var q = document.createElement('blockquote'); q.className = 'q reveal in';
        var p = document.createElement('p'); p.textContent = '“' + t.quote + '”';
        var f = document.createElement('footer'); f.textContent = t.name + (t.role ? ', ' + t.role : '');
        q.appendChild(p); q.appendChild(f); box.insertBefore(q, invite);
      });
      if (box.querySelector('blockquote')) { invite.querySelector('h3').textContent = 'Tried it? Tell us what you think.'; $('#voicesTitle').textContent = 'What the first testers say.'; }
    }).catch(function () {});
  }
})();
