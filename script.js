  document.addEventListener('DOMContentLoaded', function() {
        const menuIcon = document.querySelector('.menu-icon');
        const menuLateral = document.querySelector('.menu-lateral');
        
        menuIcon.addEventListener('click', function() {
            menuLateral.classList.toggle('activo');
        });
    });