/* Jelada Studios - site behaviour.
   Everything here is progressive enhancement: with JavaScript off, the page still reads in full.
   Page copy for both languages is provided by the page as window.SITE_I18N. */
(function () {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };

    root.classList.add('js');
    window.__siteReady = true; // tells the head's safety net that the script booted

    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ================= Smooth scroll (Lenis) ================= */
    let lenis = null;
    let programmatic = false; // true while a nav click is scrolling, so the bar does not hide mid-trip
    if (!reduced && typeof window.Lenis === 'function') {
        lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: true });
    }

    function scrollToTarget(hash) {
        const el = hash && hash !== '#' && hash !== '#top' ? $(hash) : null;
        if (lenis) {
            programmatic = true;
            // Lenis honours the page's scroll-padding-top (6rem). The pinned Games sequence is the one
            // place that should land flush, so the stage is already pinned when you arrive.
            const stage = el && el.querySelector('.games-stage');
            const flush = !!stage && getComputedStyle(stage).position === 'sticky';
            lenis.scrollTo(el || 0, {
                offset: flush ? 96 : 0,
                duration: 1.5,
                easing: (t) => 1 - Math.pow(1 - t, 4),
                onComplete: () => { programmatic = false; }
            });
        } else if (el) {
            el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        }
    }

    document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const hash = a.getAttribute('href');
        if (hash.length > 1 && !$(hash)) return;
        e.preventDefault();
        scrollToTarget(hash);
        try { history.pushState(null, '', hash === '#' ? location.pathname + location.search : hash); } catch (err) {}
    });

    /* ================= Theme (light / dark) ================= */
    const themeColorMeta = $('#themeColorMeta');
    const MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    const SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        const icon = theme === 'dark' ? MOON_SVG : SUN_SVG;
        $$('[data-theme-toggle]').forEach((btn) => { btn.innerHTML = icon; });
        if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#f0efea');
        store.set('theme', theme);
    }
    applyTheme(root.getAttribute('data-theme') || 'dark');
    // The new theme opens as a circle from the button that was pressed (View Transitions API);
    // browsers without it, and reduced motion, just switch.
    $$('[data-theme-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            if (reduced || typeof document.startViewTransition !== 'function') { applyTheme(next); return; }
            const r = btn.getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
            root.classList.add('vt');
            const vt = document.startViewTransition(() => applyTheme(next));
            vt.ready.then(() => {
                root.animate(
                    { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
                    { duration: 800, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            }).catch(() => {});
            vt.finished.finally(() => root.classList.remove('vt'));
        });
    });

    /* ================= Word split (About paragraph) ================= */
    // Wraps every word in a span carrying its index, so CSS can light the words up in sequence.
    function splitWords(el) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => (n.parentElement.classList.contains('w') || !n.nodeValue.trim())
                ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach((node) => {
            const frag = document.createDocumentFragment();
            node.nodeValue.split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                const s = document.createElement('span');
                s.className = 'w';
                s.textContent = part;
                frag.appendChild(s);
            });
            node.parentNode.replaceChild(frag, node);
        });
        const words = $$('.w', el);
        words.forEach((w, i) => { w.style.setProperty('--i', i); w.style.setProperty('--n', words.length); });
        el.classList.add('is-split');
    }

    /* ================= Kinetic type: letters in masks ================= */
    // Splits an element's text into words and letters so CSS can raise them one by one. The heading
    // gets an aria-label and the pieces are hidden from assistive tech, so it still reads as one phrase.
    const textFromHtml = (html) => html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    function splitChars(el) {
        if (el.querySelector('.c')) return;
        el.__label = textFromHtml(el.innerHTML);
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        let ci = 0;
        nodes.forEach((node) => {
            const frag = document.createDocumentFragment();
            node.nodeValue.split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                const word = document.createElement('span');
                word.className = 'cw';
                word.setAttribute('aria-hidden', 'true');
                Array.from(part).forEach((ch) => {
                    const c = document.createElement('span');
                    c.className = 'c';
                    c.style.setProperty('--ci', ci++);
                    c.textContent = ch;
                    word.appendChild(c);
                });
                frag.appendChild(word);
            });
            node.parentNode.replaceChild(frag, node);
        });
        const heading = el.closest('h1, h2');
        if (heading) heading.setAttribute('aria-label', $$('[data-chars]', heading).map((e) => e.__label || textFromHtml(e.innerHTML)).join(' '));
    }

    /* ================= Nav indicator + scrollspy ================= */
    const navLinks = $$('.nav-link');
    const navInd = $('#navInd');
    let activeLink = null;
    function placeIndicator(instant) {
        if (!navInd) return;
        if (!activeLink) { navInd.classList.remove('on'); return; }
        if (instant) navInd.style.transition = 'none';
        navInd.style.setProperty('--x', activeLink.offsetLeft + 'px');
        navInd.style.setProperty('--w', activeLink.offsetWidth);
        if (instant) { void navInd.offsetWidth; navInd.style.transition = ''; }
        navInd.classList.add('on');
    }
    function syncNavText() {
        navLinks.forEach((el) => el.setAttribute('data-text', el.textContent));
        placeIndicator(true);
    }

    /* ================= i18n (TR / EN) ================= */
    const dictionaries = window.SITE_I18N || {};

    // Language swap: a bar wipes across each element (uses ::before so it never clashes with
    // the hero underline which uses ::after); text is swapped while the bar covers it.
    function lineWipe(el, apply, dur, delay) {
        const cs = getComputedStyle(el);
        if (cs.position === 'static') el.style.position = 'relative';
        if (cs.display === 'inline') el.style.display = 'inline-block';
        el.style.setProperty('--wipe-dur', dur + 'ms');
        el.style.setProperty('--wipe-delay', delay + 'ms');
        el.classList.remove('line-wipe'); void el.offsetWidth; el.classList.add('line-wipe');
        setTimeout(apply, delay + dur * 0.5);                      // swap under the covering bar
        setTimeout(() => el.classList.remove('line-wipe'), delay + dur + 90);
    }

    function setLang(lang, animate) {
        if (!dictionaries[lang]) lang = 'en';
        const dict = dictionaries[lang];
        const anim = animate && !reduced;
        root.lang = lang;

        const items = [];
        $$('[data-i18n]').forEach((el) => {
            const v = dict[el.getAttribute('data-i18n')];
            if (v != null) items.push({ el, apply: () => { el.textContent = v; if (el.hasAttribute('data-chars')) splitChars(el); } });
        });
        $$('[data-i18n-html]').forEach((el) => {
            const v = dict[el.getAttribute('data-i18n-html')];
            if (v != null) items.push({ el, apply: () => { el.innerHTML = v; if (el.hasAttribute('data-split')) splitWords(el); if (el.hasAttribute('data-chars')) splitChars(el); } });
        });
        $$('.lang-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-lang') === lang));

        if (anim) {
            const dur = 620;
            items.forEach(({ el, apply }, i) => lineWipe(el, apply, dur, Math.min(i * 11, 220)));
            setTimeout(syncNavText, 220 + dur + 60);
        } else {
            items.forEach(({ apply }) => apply());
            syncNavText();
        }
        store.set('lang', lang);
    }

    const savedLang = store.get('lang');
    const initialLang = savedLang || (navigator.language && navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en');
    setLang(initialLang, false);
    $$('[data-split]').forEach(splitWords);
    $$('[data-chars]').forEach(splitChars);
    $$('.lang-btn').forEach((btn) => btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang'), true)));

    /* ================= Reveal system (opt-in hiding) ================= */
    const revealEls = $$('[data-reveal], .sec-rule');
    if (reduced) {
        revealEls.forEach((el) => el.classList.add('in'));
    } else {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach((el) => io.observe(el));

        // Safety net: after load, reveal anything already on-screen that the observer missed
        window.addEventListener('load', () => setTimeout(() => {
            revealEls.forEach((el) => {
                if (el.classList.contains('in')) return;
                const r = el.getBoundingClientRect();
                if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
            });
        }, 2500));
    }

    /* ================= Preloader (logo zoom-through, once per session) ================= */
    (function () {
        const preloader = $('#preloader');
        let revealed = false;
        function reveal() { if (revealed) return; revealed = true; body.classList.add('is-loaded'); }
        if (reduced || !preloader || root.classList.contains('no-pl')) {
            if (preloader) preloader.remove();
            // Two frames so the hero's starting state is painted before it animates
            requestAnimationFrame(() => requestAnimationFrame(reveal));
            return;
        }
        try { sessionStorage.setItem('jelada:pl', '1'); } catch (e) {}
        // The preloader leaves when the headline font and the hero photograph are really ready
        // (never later than 2.8s), and never before the mark has had time to land.
        const heroImg = $('.hero-img');
        const ready = Promise.race([
            Promise.all([
                document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
                heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve()
            ]),
            new Promise((r) => setTimeout(r, 2800))
        ]);
        Promise.all([new Promise((r) => setTimeout(r, 900)), ready]).then(() => {
            preloader.classList.add('zoom');
            setTimeout(reveal, 520);                               // the site emerges as we fly through
            setTimeout(() => preloader.classList.add('done'), 1100);
            setTimeout(() => preloader.remove(), 1250);
        });
    })();

    /* ================= Nav state, back-to-top and progress (no scroll listeners where avoidable) ================= */
    const toTop = $('#toTop');
    const flag = (selector, onOut) => {
        const s = $(selector);
        if (!s) return;
        new IntersectionObserver(([e]) => onOut(!e.isIntersecting), { threshold: 0 }).observe(s);
    };
    flag('#sentinelNav', (out) => body.classList.toggle('is-scrolled', out));
    flag('#sentinelTop', (out) => { if (toTop) toTop.classList.toggle('show', out); });
    if (toTop) toTop.addEventListener('click', () => scrollToTarget('#'));

    // Headroom: hide the bar while scrolling down, bring it back as soon as you scroll up.
    // Needs a direction, which Lenis already tracks, so it only runs where Lenis does.
    if (lenis) {
        lenis.on('scroll', ({ scroll, direction }) => {
            if (programmatic || body.classList.contains('menu-open')) { body.classList.remove('nav-hidden'); return; }
            if (scroll < 400 || direction < 0) body.classList.remove('nav-hidden');
            else if (direction > 0) body.classList.add('nav-hidden');
        });
    }

    // The progress bar is driven by a CSS scroll timeline. Where that is unavailable (or the
    // animation is switched off for reduced motion) a single rAF-throttled listener stands in.
    const progress = $('#progress');
    const hasScrollTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    if (progress && (reduced || !hasScrollTimeline)) {
        let ticking = false;
        const update = () => {
            const h = root.scrollHeight - window.innerHeight;
            progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
            ticking = false;
        };
        window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
        update();
    }

    /* ================= Mobile menu ================= */
    const menuToggle = $('#menuToggle');
    const menuClose = $('#menuClose');
    const mobileMenu = $('#mobileMenu');
    const behindMenu = ['main', 'footer', '#navbar', '#toTop'].map((s) => $(s)).filter(Boolean);
    function setMenu(open) {
        mobileMenu.classList.toggle('open', open);
        if (open) mobileMenu.removeAttribute('inert'); else mobileMenu.setAttribute('inert', '');
        behindMenu.forEach((el) => { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
        menuToggle.setAttribute('aria-expanded', String(open));
        body.classList.toggle('menu-open', open);
        if (lenis) { if (open) lenis.stop(); else lenis.start(); } else { body.style.overflow = open ? 'hidden' : ''; }
        if (open) setTimeout(() => { const first = $('.mobile-link', mobileMenu); if (first) first.focus({ preventScroll: true }); }, 350);
        else menuToggle.focus({ preventScroll: true });
    }
    if (menuToggle && mobileMenu) {
        mobileMenu.setAttribute('inert', '');
        $$('.mobile-link', mobileMenu).forEach((l, i) => l.style.setProperty('--i', i));
        const tools = $('.menu-tools', mobileMenu);
        if (tools) tools.style.setProperty('--i', 5);
        menuToggle.addEventListener('click', () => setMenu(true));
        menuClose.addEventListener('click', () => setMenu(false));
        $$('.mobile-link', mobileMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mobileMenu.classList.contains('open')) setMenu(false); });
        window.addEventListener('resize', () => { if (window.innerWidth >= 768 && mobileMenu.classList.contains('open')) setMenu(false); });
    }

    /* ================= Scrollspy ================= */
    // The hero is sticky, so it never leaves the viewport: track every section in the band and
    // highlight the last one (in page order) that is in it. No section in the band means no highlight.
    const spyOrder = ['top', 'about', 'games', 'other', 'team', 'contact'];
    const inBand = new Set();
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) inBand.add(entry.target.id); else inBand.delete(entry.target.id); });
        const current = spyOrder.filter((id) => inBand.has(id)).pop();
        activeLink = null;
        navLinks.forEach((link) => {
            const on = link.getAttribute('href') === '#' + current;
            link.classList.toggle('is-active', on);
            if (on) activeLink = link;
        });
        placeIndicator(false);
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('#top, section[id], footer[id]').forEach((s) => spy.observe(s));
    if ('ResizeObserver' in window && navInd) new ResizeObserver(() => placeIndicator(true)).observe(navInd.parentElement);

    /* ================= Pointer effects (fine pointers only) ================= */
    if (finePointer && !reduced) {
        // Magnetic: the icon leans toward the cursor and springs back when it leaves
        $$('.magnetic').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.classList.add('is-held');
                el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.35) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35) + 'px)';
            });
            el.addEventListener('pointerleave', () => { el.classList.remove('is-held'); el.style.transform = ''; });
        });

        // The photograph on the project card opens from the side the cursor came in on
        $$('.fts-card').forEach((card) => {
            const setOrigin = (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            };
            card.addEventListener('pointerenter', setOrigin);
            card.addEventListener('pointerleave', setOrigin);
        });

        // Flashlight: the hero's full-colour copy follows the cursor with a little inertia
        (function () {
            const hero = $('#top');
            const lit = $('.hero-lit');
            if (!hero || !lit) return;
            let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, on = false;
            const frame = () => {
                cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
                lit.style.setProperty('--lx', cx + 'px');
                lit.style.setProperty('--ly', cy + 'px');
                raf = (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) ? requestAnimationFrame(frame) : 0;
            };
            hero.addEventListener('pointermove', (e) => {
                if (e.pointerType !== 'mouse') return;
                const r = lit.getBoundingClientRect();
                tx = e.clientX - r.left; ty = e.clientY - r.top;
                if (!on) { on = true; cx = tx; cy = ty; hero.classList.add('is-lit'); }
                if (!raf) raf = requestAnimationFrame(frame);
            });
            const off = () => { on = false; hero.classList.remove('is-lit'); };
            hero.addEventListener('pointerleave', off);
            new IntersectionObserver(([e]) => { if (!e.isIntersecting) off(); }).observe(hero);
        })();

        // Spotlight: cards light their border where the cursor is
        $$('.spot').forEach((el) => {
            let raf = 0, x = 0, y = 0;
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                x = e.clientX - r.left; y = e.clientY - r.top;
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    el.style.setProperty('--sx', x + 'px');
                    el.style.setProperty('--sy', y + 'px');
                    raf = 0;
                });
            });
        });

        // Nav links scramble into place on hover
        const chars = '!<>-_\\/[]{}=+*^?#';
        navLinks.forEach((link) => {
            let frame, running = false;
            link.addEventListener('mouseenter', () => {
                if (running) return; running = true;
                const original = link.getAttribute('data-text') || link.textContent;
                let iteration = 0;
                clearInterval(frame);
                frame = setInterval(() => {
                    link.textContent = original.split('').map((ch, i) => i < iteration ? original[i] : chars[Math.floor(Math.random() * chars.length)]).join('');
                    if (iteration >= original.length) { clearInterval(frame); link.textContent = original; running = false; }
                    iteration += 1 / 2;
                }, 30);
            });
        });
    }

    /* ================= Rolling text (contact address) ================= */
    $$('[data-roll]').forEach((el) => {
        const text = el.textContent.trim();
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', text);
        el.textContent = '';
        Array.from(text).forEach((ch, i) => {
            const cell = document.createElement('span');
            cell.className = 'roll-c';
            cell.setAttribute('aria-hidden', 'true');
            const face = document.createElement('span');
            face.setAttribute('data-c', ch);
            face.style.setProperty('--i', i);
            face.textContent = ch;
            cell.appendChild(face);
            el.appendChild(cell);
        });
    });
})();
