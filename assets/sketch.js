/*
 * sketch.js — MobiLamb whiteboard rendering engine.
 * Renders icon glyph paths and UI boxes as hand-drawn (rough.js) art.
 * Depends on: rough.js (global `rough`) and icons-data.js (global `MOBILAMB_ICONS`).
 */
(function (global) {
    'use strict';
    const NS = 'http://www.w3.org/2000/svg';
    const ICONS = global.MOBILAMB_ICONS || {};

    // Deterministic seed from a string so a given element always redraws the same.
    function seedFrom(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return Math.abs(h) % 100000;
    }

    /**
     * Build an icon as a standalone <svg> (scaled by CSS).
     * Default: a clean filled vector glyph (crisp at any size).
     * opts.sketch: render the glyph hand-drawn via rough.js (used for the sheep piece/logo).
     * opts: { fill | color, stroke, strokeWidth, roughness, bowing, seed, sketch }
     */
    function icon(name, opts) {
        opts = opts || {};
        const def = ICONS[name];
        const svg = document.createElementNS(NS, 'svg');
        svg.classList.add('sk-icon');
        if (!def) { return svg; }
        svg.setAttribute('viewBox', '0 0 ' + def.w + ' ' + def.h);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        const color = (opts.fill && opts.fill !== 'none') ? opts.fill : (opts.color || opts.stroke || '#2b2b2b');
        if (opts.sketch) {
            // hand-drawn filled silhouette (sheep). strokeWidth is in viewBox units so it
            // scales proportionally with the icon (no non-scaling-stroke needed).
            const rc = rough.svg(svg);
            svg.appendChild(rc.path(def.d, {
                fill: color,
                fillStyle: 'solid',
                stroke: opts.stroke || color,
                strokeWidth: opts.strokeWidth != null ? opts.strokeWidth : 14,
                roughness: opts.roughness != null ? opts.roughness : 1.2,
                bowing: opts.bowing != null ? opts.bowing : 1,
                seed: opts.seed || seedFrom(name)
            }));
        } else {
            const p = document.createElementNS(NS, 'path');
            p.setAttribute('d', def.d);
            p.setAttribute('fill', color);
            svg.appendChild(p);
        }
        return svg;
    }

    /**
     * Draw / redraw a hand-drawn rectangle as the background of `el`, sized to it.
     * Keeps it crisp by redrawing at real pixel size on resize.
     * opts: { fill, fillStyle, fillWeight, stroke, strokeWidth, roughness, bowing, radiusPad, seedKey, hachureGap }
     * Returns { redraw, update(newOpts) }.
     */
    function box(el, opts) {
        opts = Object.assign({}, opts);
        let svg = el.querySelector(':scope > svg.sk-box');
        if (!svg) {
            svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'sk-box');
            el.insertBefore(svg, el.firstChild);
        }
        const seed = opts.seed || seedFrom(opts.seedKey || el.id || el.textContent || 'box');
        function draw() {
            const w = Math.max(2, Math.round(el.clientWidth));
            const h = Math.max(2, Math.round(el.clientHeight));
            svg.setAttribute('width', w);
            svg.setAttribute('height', h);
            svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const rc = rough.svg(svg);
            const pad = opts.pad != null ? opts.pad : 5;
            const node = rc.rectangle(pad, pad, w - 2 * pad, h - 2 * pad, {
                stroke: opts.stroke || '#2b2b2b',
                strokeWidth: opts.strokeWidth != null ? opts.strokeWidth : 2.5,
                roughness: opts.roughness != null ? opts.roughness : 1.6,
                bowing: opts.bowing != null ? opts.bowing : 1.4,
                fill: opts.fill,
                fillStyle: opts.fillStyle || 'solid',
                fillWeight: opts.fillWeight != null ? opts.fillWeight : 3,
                hachureGap: opts.hachureGap != null ? opts.hachureGap : 8,
                seed: seed
            });
            svg.appendChild(node);
        }
        draw();
        if (!el._skObs && global.ResizeObserver) {
            el._skObs = new ResizeObserver(function () { draw(); });
            el._skObs.observe(el);
        }
        return {
            redraw: draw,
            update: function (o) { Object.assign(opts, o); draw(); }
        };
    }

    /**
     * Draw a filled hand-drawn disc as the background of `el` (sheep token).
     * opts: { fill, stroke, strokeWidth, roughness, inset, seedKey }
     * Returns { redraw }.
     */
    function disc(el, opts) {
        opts = Object.assign({}, opts);
        let svg = el.querySelector(':scope > svg.sk-disc');
        if (!svg) {
            svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'sk-disc');
            el.insertBefore(svg, el.firstChild);
        }
        const seed = seedFrom(opts.seedKey || el.id || 'disc');
        function draw() {
            const w = Math.max(2, Math.round(el.clientWidth));
            const h = Math.max(2, Math.round(el.clientHeight));
            svg.setAttribute('width', w);
            svg.setAttribute('height', h);
            svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const rc = rough.svg(svg);
            const inset = opts.inset != null ? opts.inset : 4;
            const node = rc.ellipse(w / 2, h / 2, w - inset * 2, h - inset * 2, {
                stroke: opts.stroke || '#2b2b2b',
                strokeWidth: opts.strokeWidth != null ? opts.strokeWidth : 3,
                roughness: opts.roughness != null ? opts.roughness : 1.4,
                bowing: 1,
                fill: opts.fill || '#fdfdfb',
                fillStyle: 'solid',
                seed: seed
            });
            svg.appendChild(node);
        }
        draw();
        if (!el._skDiscObs && global.ResizeObserver) {
            el._skDiscObs = new ResizeObserver(function () { draw(); });
            el._skDiscObs.observe(el);
        }
        return { redraw: draw };
    }

    /**
     * Build a sheep game-piece token: white disc + player-colored ring + sheep.
     * kind: 'dolly' (white sheep, green ring) | 'shaun' (dark sheep, orange ring).
     */
    function sheepToken(kind, palette) {
        palette = palette || {};
        const isDolly = kind === 'dolly';
        const ringColor = isDolly ? (palette.green || '#3f9e54') : (palette.orange || '#e0832e');
        const wrap = document.createElement('div');
        wrap.className = 'sk-token ' + (isDolly ? 'dolly' : 'shaun');
        disc(wrap, { fill: '#fdfdfb', stroke: ringColor, strokeWidth: 4, roughness: 1.3, inset: 5, seedKey: 'tok' + kind });
        const sheep = icon('sheep', isDolly
            ? { sketch: true, fill: '#fdfdfb', stroke: '#2b2b2b', strokeWidth: 16, roughness: 1.1 }
            : { sketch: true, fill: '#3a3a38', stroke: '#1c1c1b', strokeWidth: 16, roughness: 1.1 });
        sheep.classList.add('sk-token-sheep');
        wrap.appendChild(sheep);
        return wrap;
    }

    /** Draw an ellipse "circle around" overlay sized to el (used for the active player tag). */
    function ring(el, opts) {
        opts = opts || {};
        let svg = el.querySelector(':scope > svg.sk-ring');
        if (!svg) {
            svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'sk-ring');
            el.appendChild(svg);
        }
        function draw() {
            const w = Math.max(2, Math.round(el.clientWidth));
            const h = Math.max(2, Math.round(el.clientHeight));
            svg.setAttribute('width', w);
            svg.setAttribute('height', h);
            svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const rc = rough.svg(svg);
            const node = rc.ellipse(w / 2, h / 2, w - 6, h - 6, {
                stroke: opts.stroke || '#e0832e',
                strokeWidth: opts.strokeWidth != null ? opts.strokeWidth : 3,
                roughness: opts.roughness != null ? opts.roughness : 2,
                bowing: 1.5,
                fill: undefined,
                seed: seedFrom('ring' + (el.id || ''))
            });
            svg.appendChild(node);
        }
        draw();
        if (!el._skRingObs && global.ResizeObserver) {
            el._skRingObs = new ResizeObserver(function () { draw(); });
            el._skRingObs.observe(el);
        }
        return { redraw: draw, remove: function () { if (svg) svg.remove(); } };
    }

    global.Sketch = { icon: icon, box: box, disc: disc, sheepToken: sheepToken, ring: ring, seedFrom: seedFrom };
})(window);
