(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- waveform: built in JS so the markup stays clean ---- */
  var wf = document.getElementById('waveform');
  if (wf) {
    var heights = [38,66,28,88,48,62,34,78,44,58,24,72,40,84,30,54,68,36,90,46,26,60,42,74];
    heights.forEach(function (h, i) {
      var b = document.createElement('i');
      b.style.height = h + '%';
      b.style.animationDelay = (i * 0.09).toFixed(2) + 's';
      wf.appendChild(b);
    });
  }

  /* ---- theme toggle: auto → light → dark → auto ---- */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme');
      var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = cur ? (cur === 'dark' ? 'light' : 'dark') : (sysDark ? 'light' : 'dark');
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('fieldnotes:theme', next); } catch (e) {}
    });
  }

  /* ---- reading progress + nav hide-on-scroll ---- */
  var bar = document.getElementById('progress');
  var nav = document.getElementById('nav');
  var last = 0, ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (nav) {
      nav.classList.toggle('scrolled', y > 8);
      if (!reduce) nav.classList.toggle('hidden', y > last && y > 220);
    }
    last = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---- bookmarks: kept in this browser, per reader ---- */
  var SAVED_KEY = 'fieldnotes:saved';
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch (e) { saved = []; }

  function persistSaved() {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch (e) {}
  }

  window.fnPaintSaved = function () {
    document.querySelectorAll('.entry[data-slug]').forEach(function (entry) {
      var on = saved.indexOf(entry.getAttribute('data-slug')) > -1;
      entry.setAttribute('data-saved', on ? '1' : '0');
      var btn = entry.querySelector('.save');
      if (btn) {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? 'Remove from saved' : 'Save this story for later');
      }
    });
    var label = document.getElementById('saved-label');
    if (label) label.textContent = saved.length ? 'Saved · ' + saved.length : 'Saved';
    var empty = document.getElementById('empty-saved');
    if (empty) empty.style.display = (document.body.classList.contains('only-saved') && !saved.length) ? 'block' : 'none';
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.save');
    if (!btn) return;
    e.preventDefault();
    var slug = btn.closest('.entry').getAttribute('data-slug');
    var i = saved.indexOf(slug);
    if (i > -1) saved.splice(i, 1); else saved.push(slug);
    persistSaved();
    window.fnPaintSaved();
  });

  var savedToggle = document.getElementById('saved-toggle');
  if (savedToggle) {
    savedToggle.addEventListener('click', function () {
      var on = document.body.classList.toggle('only-saved');
      savedToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      window.fnPaintSaved();
    });
  }
  window.fnPaintSaved();
})();

/* =========================================================
   IN-PAGE STORY READER
   Clicking a story expands it here instead of navigating away.
   The <a href> underneath stays real, so no-JS visitors, crawlers,
   ⌘-click and middle-click all still get the standalone page at
   the very same URL. This is an enhancement, never a replacement.
   ========================================================= */
(function () {
  'use strict';

  var dialog = document.getElementById('reader');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  var scroller = document.getElementById('reader-scroll');
  var holder   = document.getElementById('reader-content');
  var bar      = document.getElementById('reader-bar');
  var closeBtn = document.getElementById('reader-close');
  if (!scroller || !holder || !closeBtn) return;

  var reduce    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var siteName  = dialog.getAttribute('data-site') || '';
  var homeTitle = document.title;

  var cache  = {};    // url -> html, so reopening a story is instant
  var opener = null;  // the link we came from, for focus return
  var pushed = false; // did we add a history entry we still owe a back()?
  var isOpen = false;

  /* ---- data ---- */

  function partialUrl(url) {
    return url.replace(/\/+$/, '') + '/partial.html';
  }

  function load(url) {
    if (cache[url]) return Promise.resolve(cache[url]);
    return fetch(partialUrl(url), { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) { cache[url] = html; return html; });
  }

  function titleFor(url) {
    var link = document.querySelector('a[data-reader][href="' + url + '"]');
    var text = link ? link.textContent.trim() : '';
    if (!text) return homeTitle;
    return siteName ? text + ' — ' + siteName : text;
  }

  /* ---- reading progress for the open story ---- */

  var ticking = false;
  function paintProgress() {
    if (!bar) return;
    var max = scroller.scrollHeight - scroller.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(scroller.scrollTop / max, 1) : 0) + ')';
  }
  scroller.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { paintProgress(); ticking = false; });
    }
  }, { passive: true });

  /* ---- open / close ---- */

  function show(url, html) {
    holder.innerHTML = html;

    if (!isOpen) {
      dialog.showModal();
      isOpen = true;
    }

    // Must come after showModal: while the dialog is still display:none the
    // scroller has no layout box, so setting scrollTop would be a no-op and
    // a reopened story would keep the previous story's scroll position.
    scroller.scrollTop = 0;
    paintProgress();

    document.title = titleFor(url);

    // land the reader on the headline, not on the close button
    var target = holder.querySelector('h1') || scroller;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function openStory(url, push) {
    load(url).then(function (html) {
      show(url, html);
      if (push) {
        history.pushState({ fnReader: url }, '', url);
        pushed = true;
      }
    }).catch(function () {
      window.location.href = url;   // anything went wrong: just navigate
    });
  }

  function restoreList() {
    if (!opener) return;
    var entry = opener.closest('.entry, .note');
    if (entry) {
      var r = entry.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        entry.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
    }
    opener.focus({ preventScroll: true });
  }

  function closeReader(rewind) {
    if (!isOpen) return;
    isOpen = false;
    document.title = homeTitle;
    dialog.close();
    if (rewind && pushed) {
      pushed = false;
      history.back();   // popstate fires, but isOpen is already false
    }
    restoreList();
  }

  /* ---- wiring ---- */

  // Delegated on the document so stories and notes share one path. Matching on
  // an explicit data-reader attribute rather than a URL prefix means a link only
  // opens in the reader when the template says it should.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // let the browser open a tab
    if (!e.target.closest) return;
    if (e.target.closest('.save')) return;                          // bookmark button does its own job

    var link = e.target.closest('a[data-reader]');
    if (!link) return;

    e.preventDefault();
    opener = link;
    openStory(link.getAttribute('href'), true);
  });

  closeBtn.addEventListener('click', function () { closeReader(true); });

  // Esc: route through the same path so the URL never desyncs
  dialog.addEventListener('cancel', function (e) {
    e.preventDefault();
    closeReader(true);
  });

  window.addEventListener('popstate', function (e) {
    var st = e.state;
    if (st && st.fnReader) {
      pushed = false;                 // this entry already exists in history
      openStory(st.fnReader, false);
    } else if (isOpen) {
      pushed = false;
      closeReader(false);
    }
  });
})();

/* =========================================================
   CONTACT FORM
   Netlify handles storage, spam filtering and the email itself.
   This layer only adds inline, screen-reader-friendly validation
   and keeps the visitor on the page. With JS off, the form still
   submits natively to /thanks/ — nothing here is load-bearing.
   ========================================================= */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = document.getElementById('cf-status');
  var inputs = [].slice.call(form.querySelectorAll('input[required], textarea[required]'));
  if (!inputs.length) return;

  var MESSAGES = {
    'cf-name':    { missing: 'Please tell me your name.',
                    short:   'That looks a little short — your full name is ideal.' },
    'cf-email':   { missing: 'I need an email address to reply to.',
                    type:    'That email address does not look quite right.' },
    'cf-message': { missing: 'Please write a message.',
                    short:   'A little more detail would help — at least 20 characters.' }
  };

  // Take over validation only once we know JS is running.
  form.noValidate = true;

  function messageFor(input) {
    var set = MESSAGES[input.id] || {};
    var v = input.validity;
    if (v.valueMissing) return set.missing || 'This field is required.';
    if (v.typeMismatch) return set.type || 'Please check the format.';
    if (v.tooShort)     return set.short || 'Please add a little more.';
    if (v.tooLong)      return 'That is longer than the form allows.';
    return 'Please check this field.';
  }

  function setError(input, msg) {
    var box = document.getElementById(input.id + '-err');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (box) { box.textContent = msg; box.classList.add('show'); }
    } else {
      input.removeAttribute('aria-invalid');
      if (box) { box.textContent = ''; box.classList.remove('show'); }
    }
  }

  function say(msg, kind) {
    if (!status) return;
    status.textContent = msg || '';
    status.className = 'cf-status' + (kind ? ' ' + kind : '');
  }

  function check(input) {
    var ok = input.checkValidity();
    setError(input, ok ? '' : messageFor(input));
    return ok;
  }

  inputs.forEach(function (input) {
    // don't scold someone mid-sentence: validate on leaving a filled field,
    // then keep it live only once it is already marked wrong
    input.addEventListener('blur', function () { if (input.value.trim()) check(input); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid')) check(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstBad = null;
    inputs.forEach(function (input) { if (!check(input) && !firstBad) firstBad = input; });
    if (firstBad) {
      say('Please fix the highlighted fields.', 'err');
      firstBad.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    say('Sending…');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);

      var done = document.createElement('div');
      done.className = 'contact-sent';
      done.setAttribute('tabindex', '-1');
      done.innerHTML =
        '<span class="label"><span class="dot"></span>Message sent</span>' +
        '<p>Thank you — it is in my inbox. I read everything myself and usually reply ' +
        'within two working days.</p>';
      form.parentNode.replaceChild(done, form);
      done.focus();
    }).catch(function () {
      if (btn) btn.disabled = false;
      say('That did not send. Please email me directly instead — the address is just below.', 'err');
    });
  });
})();
