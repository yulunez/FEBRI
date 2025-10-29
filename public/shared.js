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
        updateCartCounters();
    });

    window.FEBRI_SHARED = { getCartItems, updateCartCounters, isLoggedIn, toggleLoginVsProfile };
})();