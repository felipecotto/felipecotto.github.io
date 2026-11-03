/*
 * Header flutuante
 * - O rótulo do meio mostra a seção que está na tela (rolagem vertical do texto).
 * - O link da seção atual fica em destaque.
 * - Uma linha fina na base do header mostra o progresso de leitura.
 * Sem JS, o header continua funcionando: só o rótulo fica no texto padrão.
 */
(function () {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var label = header.querySelector('[data-section-label]');
    var progress = header.querySelector('[data-progress]');
    var links = Array.prototype.slice.call(header.querySelectorAll('[data-nav-link]'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var defaultText = label ? label.textContent.trim() : '';
    var current = defaultText;

    // seções com título: usa data-label se existir, senão o texto do h2 (com o número, se houver)
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[aria-labelledby]'))
        .map(function (section) {
            var heading = document.getElementById(section.getAttribute('aria-labelledby'));
            if (!heading || heading.tagName !== 'H2') return null;
            var text = section.getAttribute('data-label');
            if (!text) {
                var num = heading.querySelector('span');
                var title = heading.textContent.replace(num ? num.textContent : '', '').trim();
                text = num ? num.textContent.trim() + ' · ' + title : title;
            }
            return { el: section, id: heading.id, text: text };
        })
        .filter(Boolean);

    function setLabel(text) {
        if (!label || text === current) return;
        var previous = current;
        current = text;
        if (reduce.matches) {
            label.textContent = text;
            return;
        }
        var goingDown = sections.findIndex(function (s) { return s.text === text; }) >
                        sections.findIndex(function (s) { return s.text === previous; });
        var outgoing = document.createElement('span');
        var incoming = document.createElement('span');
        outgoing.textContent = previous;
        incoming.textContent = text;
        outgoing.className = 'label-roll label-out' + (goingDown ? '' : ' label-reverse');
        incoming.className = 'label-roll label-in' + (goingDown ? '' : ' label-reverse');
        label.textContent = '';
        label.appendChild(outgoing);
        label.appendChild(incoming);
        incoming.addEventListener('animationend', function () {
            if (current === text) label.textContent = text;
        }, { once: true });
    }

    function setActiveLink(id) {
        links.forEach(function (link) {
            var target = (link.getAttribute('href') || '').split('#')[1];
            var on = target && target === id;
            link.classList.toggle('is-active', !!on);
            if (on) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }

    var ticking = false;
    function update() {
        ticking = false;
        var line = window.innerHeight * 0.35;
        var active = null;
        sections.forEach(function (s) {
            var r = s.el.getBoundingClientRect();
            if (r.top <= line && r.bottom > line) active = s;
        });
        // entre seções (separadores), mantém a última que passou do meio da tela
        if (!active) {
            sections.forEach(function (s) {
                if (s.el.getBoundingClientRect().top <= line) active = s;
            });
        }
        setLabel(active ? active.text : defaultText);
        setActiveLink(active ? active.id : null);

        if (progress) {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        }
        header.classList.toggle('is-scrolled', window.scrollY > 8);
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
