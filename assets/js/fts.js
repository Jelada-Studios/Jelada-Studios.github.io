/* FT's Geology page behaviour: the boundary tabs, the seismogram and the copy buttons.
   Loaded after site.js. Everything is optional; the page reads in full without it. */
(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

    /* ================= Boundary tabs ================= */
    // Four boundary types, one cross-section each. The selected type plays its diagram; unless the
    // visitor prefers reduced motion the tabs also advance on their own while the section is on
    // screen (the thin red line under the active tab is the timer, and it pauses on hover or focus).
    (function () {
        const root = $('[data-tabs]');
        if (!root) return;
        const tabs = $$('[role="tab"]', root);
        const panels = $$('[role="tabpanel"]', root);
        const figs = $$('.bound-fig', root);
        let index = 0;

        function select(i, focus) {
            index = (i + tabs.length) % tabs.length;
            tabs.forEach((tab, j) => {
                const on = j === index;
                // Re-adding the class restarts the diagram's animation and the timer line
                tab.classList.remove('is-active'); panels[j].classList.remove('is-active'); figs[j].classList.remove('is-active');
                if (on) {
                    void tab.offsetWidth;
                    tab.classList.add('is-active'); panels[j].classList.add('is-active'); figs[j].classList.add('is-active');
                }
                tab.setAttribute('aria-selected', String(on));
                tab.tabIndex = on ? 0 : -1;
            });
            if (focus) tabs[index].focus();
        }

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => select(i));
            tab.addEventListener('keydown', (e) => {
                const k = e.key;
                if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select(index + 1, true); }
                else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select(index - 1, true); }
                else if (k === 'Home') { e.preventDefault(); select(0, true); }
                else if (k === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
            });
        });

        select(0);
        // Diagrams only play while the section is on screen; off screen they wait at their first frame
        // (animating SVG pieces is main-thread work, and the first tab would otherwise play during page load)
        let onScreen = false;
        new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; root.classList.toggle('is-visible', onScreen); }, { threshold: 0.1 }).observe(root);
        if (reduced) return;

        root.setAttribute('data-auto', '');
        root.classList.add('is-paused'); // waits until the section is on screen
        let visible = false, hovered = false;
        const sync = () => root.classList.toggle('is-paused', !visible || hovered);
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(root);
        root.addEventListener('pointerenter', () => { hovered = true; sync(); });
        root.addEventListener('pointerleave', () => { hovered = false; sync(); });
        root.addEventListener('focusin', () => { hovered = true; sync(); });
        root.addEventListener('focusout', () => { hovered = false; sync(); });
        // The timer line finishing is the cue to move on
        root.addEventListener('animationend', (e) => {
            if (e.animationName === 'tabProg') select(index + 1);
        });
    })();

    /* ================= Seismogram ================= */
    // A trace that sits quiet, builds, throws one large event and settles. Deterministic, so the
    // picture is the same on every visit; CSS draws it as the section scrolls into view.
    (function () {
        const line = $('.seismo-line');
        if (!line) return;
        let seed = 7;
        const rand = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        const W = 1200, MID = 70, N = 520;
        const events = [[0.30, 0.02, 9], [0.52, 0.025, 20], [0.70, 0.045, 58], [0.745, 0.05, 26]]; // [position, width, amplitude]
        let d = '';
        for (let i = 0; i <= N; i++) {
            const p = i / N;
            let amp = 3 + 5 * p;
            events.forEach(([c, w, a]) => { amp += a * Math.exp(-Math.pow((p - c) / w, 2)) * (p >= c ? 1 : 0.55); });
            amp *= 1 + 0.35 * Math.sin(p * 90);
            const y = MID + (rand() * 2 - 1) * amp;
            d += (i ? 'L' : 'M') + (p * W).toFixed(1) + ' ' + y.toFixed(1);
        }
        line.setAttribute('d', d);
    })();

    /* ================= Copy buttons ================= */
    $$('[data-copy]').forEach((btn) => {
        const row = btn.closest('.cmd');
        let timer = 0;
        btn.addEventListener('click', async () => {
            const text = btn.getAttribute('data-copy');
            let ok = false;
            try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
                // Older browsers: select the text in a hidden field and copy that
                const ta = document.createElement('textarea');
                ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
                document.body.appendChild(ta); ta.select();
                try { ok = document.execCommand('copy'); } catch (err) {}
                ta.remove();
            }
            if (!ok) return;
            row.classList.add('is-copied');
            clearTimeout(timer);
            timer = setTimeout(() => row.classList.remove('is-copied'), 1800);
        });
    });
})();
