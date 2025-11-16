(function () {
    function getCartItems() {
        try {
            return JSON.parse(sessionStorage.getItem('carritoCompra')) || [];
        } catch {
            return [];
        }
    }

    function updateCartCounters() {
        const total = getCartItems().reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        document.querySelectorAll('.contador-carrito').forEach(el => {
            el.textContent = String(total);
            el.style.display = total > 0 ? 'flex' : 'none';
        });
    }

    function isLoggedIn() {
        try {
            return localStorage.getItem('usuarioLogueado') === 'true';
        } catch {
            return false;
        }
    }

    function toggleLoginVsProfile() {
        const logged = isLoggedIn();
        const btnLogin = document.querySelector('.btn-registrar');
        const btnLoginMovil = document.querySelector('.btn-registrar-movil');
        const perfilIcon = document.querySelector('.perfil-icon');
        if (btnLogin) btnLogin.style.display = logged ? 'none' : 'block';
        if (btnLoginMovil) btnLoginMovil.style.display = logged ? 'none' : 'block';
        if (perfilIcon) perfilIcon.style.display = logged ? 'inline-block' : 'none';
    }

    function initSearchHandlers() {
        const bindEnter = (el, handler) => {
            if (!el || el.dataset.searchInit === 'true') return;
            el.dataset.searchInit = 'true';
            el.addEventListener('keypress', e => { if (e.key === 'Enter') handler(); });
        };
        const bindClick = (el, handler) => {
            if (!el || el.dataset.searchInit === 'true') return;
            el.dataset.searchInit = 'true';
            el.addEventListener('click', handler);
        };

        const inputDesktop = document.querySelector('#busqueda-input') || document.querySelector('.barra-busqueda input');
        const inputMobile = document.querySelector('#busqueda-input-movil') || document.querySelector('.barra-busqueda-movil input');

        const goSearchDesktop = () => {
            const termino = inputDesktop && inputDesktop.value ? inputDesktop.value.trim() : '';
            if (termino) window.location.href = `busqueda.html?termino=${encodeURIComponent(termino)}`;
        };
        const goSearchMobile = () => {
            const termino = inputMobile && inputMobile.value ? inputMobile.value.trim() : '';
            if (termino) window.location.href = `busqueda.html?termino=${encodeURIComponent(termino)}`;
        };

        bindEnter(inputDesktop, goSearchDesktop);
        bindEnter(inputMobile, goSearchMobile);
        bindClick(document.querySelector('#busqueda-btn') || document.querySelector('.barra-busqueda .bx-search'), goSearchDesktop);
        bindClick(document.querySelector('#busqueda-btn-movil') || document.querySelector('.barra-busqueda-movil .bx-search'), goSearchMobile);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSearchHandlers();
        toggleLoginVsProfile();
        // Set profile redirect according to role (admin -> administrador.html)
        setProfileRedirectBasedOnRole();
        updateCartCounters();
    });
    async function setProfileRedirectBasedOnRole() {
        try {
            // Collect possible profile link targets across different page structures:
            // 1) anchors that contain an element with class .perfil-icon
            // 2) anchors whose href contains 'perfil' (perfil_usuario.html, perfil.html, etc.)
            // 3) elements with data-perfil-link attribute (custom marker)
            const anchors1 = Array.from(document.querySelectorAll('a')).filter(a => a.querySelector && a.querySelector('.perfil-icon'));
            const anchors2 = Array.from(document.querySelectorAll('a[href*="perfil"]'));
            const anchors3 = Array.from(document.querySelectorAll('[data-perfil-link]')).map(el => (el.tagName === 'A' ? el : el.closest('a'))).filter(Boolean);

            const allAnchors = Array.from(new Set([].concat(anchors1, anchors2, anchors3))).filter(Boolean);
            if (!allAnchors.length) return;

            // default target for non-admins and non-logged users
            let target = 'perfil_usuario.html';

            // Always try to query server session to determine role. Relying solely on localStorage
            // fails when session exists but client storage is not in sync (different tab/window).
            try {
                const res = await fetch('/perfil-usuario', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success && data.usuario) {
                        const usuario = data.usuario;
                        const isAdmin = Boolean(usuario.ID_empleado || usuario.esAdmin || usuario.rol === 'admin' || usuario.rol === 'ADMIN');
                        if (isAdmin) target = 'administrador.html';
                    }
                } else {
                    // If server responds with not-authenticated, we can fallback to localStorage flag
                    if (isLoggedIn()) {
                        // keep perfil_usuario.html for regular logged users by default
                        target = 'perfil_usuario.html';
                    }
                }
            } catch (e) {
                // network or other error — fallback to localStorage if present
                if (isLoggedIn()) target = 'perfil_usuario.html';
            }

            allAnchors.forEach(a => { try { a.href = target; } catch (e) {} });

            // Also handle cases where the icon is rendered outside of an anchor
            const perfilIcons = Array.from(document.querySelectorAll('.perfil-icon'));
            perfilIcons.forEach(icon => {
                try {
                    // If the icon is already inside an anchor, update it
                    let anchor = icon.closest('a');
                    if (!anchor) {
                        // Check siblings commonly used in your templates
                        const prev = icon.previousElementSibling;
                        const next = icon.nextElementSibling;
                        if (prev && prev.tagName === 'A') anchor = prev;
                        else if (next && next.tagName === 'A') anchor = next;
                    }

                    if (anchor) {
                        anchor.href = target;
                    } else if (icon.parentNode) {
                        // No anchor found — wrap icon in one so it becomes clickable
                        const a = document.createElement('a');
                        a.href = target;
                        // preserve possible attributes from icon's parent (like onclick handlers)
                        icon.parentNode.insertBefore(a, icon);
                        a.appendChild(icon);
                    }
                } catch (e) {
                    // ignore per-icon failures
                }
            });
        } catch (err) {
            console.error('setProfileRedirectBasedOnRole error:', err);
        }
    }

    // Re-evaluate when localStorage changes (another tab logged in/out)
    window.addEventListener('storage', function(e) {
        if (!e || (e.key && e.key !== 'usuarioLogueado')) return;
        setProfileRedirectBasedOnRole();
    });

    window.FEBRI_SHARED = { getCartItems, updateCartCounters, isLoggedIn, toggleLoginVsProfile, setProfileRedirectBasedOnRole };
})();