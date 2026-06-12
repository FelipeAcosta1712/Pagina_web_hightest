function mostrarFilaGuardada(index, nombreElemento) {
  const resumen = document.getElementById('tablaGuardada');
  if (!resumen) return;

  const estado = getRowState(index);
  if (!estado) return;

  const filaResumen = document.createElement('div');
  filaResumen.className = 'resumen-fila';
  filaResumen.innerHTML = `
    <strong>#${index + 1}</strong> - 
    <span><strong>${nombreElemento}</strong> | </span>
    Recepción: ${estado.recepcion || 0}, 
    Entrega: ${estado.entrega || 0}, 
    No usado: ${estado.noUsado || 0}, 
    Usado: ${estado.usado || 0}, 
    Lavado: ${estado.lavado || 0}, 
    Observaciones: ${estado.observaciones || ""}
  `;

  resumen.appendChild(filaResumen);
}
