// perfilLink.js
// Purpose: ensure profile link points to administrador.html for admins, otherwise perfil_usuario.html
(function(){
    async function resolveAndSetProfileLink(){
        try {
            const defaultTarget = 'perfil_usuario.html';
            let target = defaultTarget;

            // Ask server for session user
            try {
                const res = await fetch('/perfil-usuario', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success && data.usuario) {
                        const u = data.usuario;
                        const isAdmin = Boolean(u.ID_empleado || u.esAdmin || u.rol === 'admin' || u.rol === 'ADMIN');
                        if (isAdmin) target = 'administrador.html';
                    }
                }
            } catch (e) {
                // network error or not authenticated -> keep default
            }

            // Update anchors with id 'perfil-link'
            const byId = document.getElementById('perfil-link');
            if (byId && byId.tagName === 'A') byId.href = target;

            // Update all anchors that already link to perfil pages
            document.querySelectorAll('a[href*="perfil_"]').forEach(a => a.href = target);
            document.querySelectorAll('a[href*="perfil"]').forEach(a => a.href = target);

            // Update anchors that contain .perfil-icon
            document.querySelectorAll('a').forEach(a => {
                if (a.querySelector && a.querySelector('.perfil-icon')) a.href = target;
            });

            // Handle icons not wrapped in anchors: wrap them
            document.querySelectorAll('.perfil-icon').forEach(icon => {
                const parentA = icon.closest('a');
                if (parentA) { parentA.href = target; return; }
                // try adjacent anchors
                const prev = icon.previousElementSibling; if (prev && prev.tagName === 'A') { prev.href = target; return; }
                const next = icon.nextElementSibling; if (next && next.tagName === 'A') { next.href = target; return; }
                // otherwise wrap
                const a = document.createElement('a');
                a.href = target;
                icon.parentNode.insertBefore(a, icon);
                a.appendChild(icon);
            });
        } catch (err) {
            console.error('perfilLink error:', err);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resolveAndSetProfileLink);
    else resolveAndSetProfileLink();

    // Re-run when storage changes (login/logout in other tab)
    window.addEventListener('storage', (e) => {
        if (!e || (e.key && e.key !== 'usuarioLogueado')) return;
        resolveAndSetProfileLink();
    });

    // Expose for manual invocation
    window.resolveAndSetProfileLink = resolveAndSetProfileLink;
})();
