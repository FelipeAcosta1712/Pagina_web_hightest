// admin.js
const formNuevoEnsayo = document.getElementById('formNuevoEnsayo');

if (formNuevoEnsayo) {
    formNuevoEnsayo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Capturamos los datos del formulario (puedes adaptarlo a tus campos)
        const datosEnsayo = {
            titulo: document.getElementById('inputTitulo').value,
            norma: document.getElementById('selectNorma').value, // Ej: ASTM F496
            resultado: "Pendiente"
        };

        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosEnsayo)
            });

            if (response.ok) {
                alert("✅ Ensayo registrado exitosamente en la nube.");
                location.reload(); // Refrescamos para ver los cambios
            }
        } catch (error) {
            console.error("Error al guardar:", error);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const adminNav = document.querySelector('.header--admin .header__nav');
    const adminMenu = document.getElementById('adminHeaderMenu');
    const adminUserInfo = document.querySelector('.header--admin .header__user-info');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    if (!adminNav || !adminMenu || !adminUserInfo || !adminLogoutBtn) {
        return;
    }

    const userMenuItem = document.createElement('li');
    userMenuItem.className = 'header__menu-item--user';

    const placeUserInfoInMenu = () => {
        if (adminMenu.contains(userMenuItem)) {
            return;
        }

        userMenuItem.appendChild(adminUserInfo);
        const adminLogoutMobileBtn = document.getElementById('adminLogoutMobileBtn');
        const adminLogoutMobileItem = adminLogoutMobileBtn ? adminLogoutMobileBtn.closest('li') : null;

        if (adminLogoutMobileItem) {
            adminMenu.insertBefore(userMenuItem, adminLogoutMobileItem);
            return;
        }

        adminMenu.appendChild(userMenuItem);
    };

    const placeUserInfoInHeader = () => {
        if (!adminMenu.contains(userMenuItem)) {
            return;
        }

        adminNav.insertBefore(adminUserInfo, adminLogoutBtn);
        userMenuItem.remove();
    };

    const syncUserInfoPlacement = () => {
        if (window.innerWidth <= 768) {
            placeUserInfoInMenu();
            return;
        }

        placeUserInfoInHeader();
    };

    syncUserInfoPlacement();
    window.addEventListener('resize', syncUserInfoPlacement, { passive: true });
});