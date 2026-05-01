// admin.js
document.getElementById('formNuevoEnsayo').addEventListener('submit', async (e) => {
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