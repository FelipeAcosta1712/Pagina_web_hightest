/**
 * Control de Acceso a Dashboard de Reportes
 * Solo Administrador y Director Técnico pueden acceder
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario puede acceder a reportes
    const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
    // Soportar dos formatos: { rol: 'administrador' } y { user: { rol: 'administrador', nombre: '...' }, ... }
    const userRole = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
    const analyticsSection = document.getElementById('analyticsAccessSection');
    // Si el elemento no existe (lo quitamos del DOM), no hacer nada
    if (!analyticsSection) return;
    
    const permittedRoles = ['administrador', 'director_tecnico'];
    
    if (analyticsSection) {
        if (userRole && permittedRoles.includes(userRole)) {
            analyticsSection.style.display = 'block';
            console.log('✅ Acceso a Dashboard de Reportes permitido para: ' + userRole);
        } else {
            analyticsSection.style.display = 'none';
            console.log('🔒 Acceso a Dashboard de Reportes denegado');
        }
    }
});

// Función pública para que otros scripts verifiquen acceso a reportes
function verificarAccesoReportes() {
    const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
    const userRole = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
    const analyticsSection = document.getElementById('analyticsAccessSection');
    if (!analyticsSection) return false;
    const permittedRoles = ['administrador', 'director_tecnico'];
    if (userRole && permittedRoles.includes(userRole)) {
        analyticsSection.style.display = 'block';
        console.log('✅ Acceso a Dashboard de Reportes permitido para: ' + userRole);
        return true;
    } else {
        analyticsSection.style.display = 'none';
        console.log('🔒 Acceso a Dashboard de Reportes denegado');
        return false;
    }
}

// Exponer globalmente
window.verificarAccesoReportes = verificarAccesoReportes;
