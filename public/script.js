document.addEventListener('DOMContentLoaded', function() {
        const menuIcon = document.querySelector('.menu-icon');
        const menuLateral = document.querySelector('.menu-lateral');
        
        menuIcon.addEventListener('click', function() {
            menuLateral.classList.toggle('activo');
        });
    });

// Helper global para navegar al carrito desde cabeceras que usan este script
function irAlCarrito() {
  window.location.href = 'carrito_compra.html';
}

    //ocultar boton de inicio de sesion despues de haver iniciado sesion
document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.querySelector('.btn-registrar');
  const perfilIcon = document.querySelector('.perfil-icon');

  if (localStorage.getItem('usuarioLogueado') === 'true') {
    if (btnLogin) btnLogin.style.display = 'none';
    if (perfilIcon) perfilIcon.style.display = 'inline-block';
  } else {
    if (btnLogin) btnLogin.style.display = 'block';
    if (perfilIcon) perfilIcon.style.display = 'none';
  }
});