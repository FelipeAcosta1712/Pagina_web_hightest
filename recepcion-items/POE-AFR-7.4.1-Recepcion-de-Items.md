# Procedimiento Operativo Estándar (POE)

Código: AFR-7.4.1  
Nombre: Recepción y Entrega de Ítems  
Versión: 01  
Fecha de vigencia: 2025-07-07  
Elaboró: (Completar)  
Revisó: (Completar)  
Aprobó: (Completar)

---

## 1. Objetivo
Establecer el método estandarizado para la recepción, registro, almacenamiento temporal, lavado (cuando aplique), y entrega de ítems de clientes en HIGH TEST SAS, garantizando trazabilidad, integridad de los elementos y cumplimiento de requisitos del cliente y normativos.

## 2. Alcance
Aplica a todo el proceso desde la recepción del ítem y datos del cliente, la ejecución de actividades de almacenamiento y/o lavado (si procede), hasta la entrega y generación de documentos (PDF de recepción, PDF completo y comunicaciones). Aplica a todos los clientes y a todo el personal autorizado de HIGH TEST SAS.

## 3. Referencias normativas y documentales
- Código del formato: FR-7.4.1 — Formato de Recepción y Entrega de Ítems (sistema web).
- Sistema de gestión y calidad (cuando aplique):
   - ISO/IEC 17025:2017 — Requisitos generales para la competencia de los laboratorios de ensayo y calibración.
   - ISO 9001:2015 — Sistemas de gestión de la calidad — Requisitos.
- Protección de datos personales (Colombia):
   - Ley 1581 de 2012 — Protección de datos personales.
   - Decreto 1377 de 2013 — Reglamentario parcial de la Ley 1581.
   - Políticas internas de tratamiento de datos personales de HIGH TEST SAS.
- Procedimientos/documentos internos relacionados:
   - Procedimiento de gestión de no conformidades y acciones (si aplica).
   - Matriz de roles y permisos (auth.js) y lineamientos de acceso.
   - Guía de generación de documentos (PDF recepción, PDF completo) y control documental.
- Normas técnicas asociadas a los elementos del alcance (según catálogo interno vigente):
   - Bastones, Cizallas, Pértigas: ASTM F711 (u otras aplicables según elemento específico).
   - Guantes y Mangas aislantes: ASTM F496 (cuidado en servicio).
   - Cubridores/Mangueras: ASTM F478 (cuidado en servicio).
   - Mantas: ASTM F479 (cuidado en servicio).
   - Tapetes: ASTM D178 (especificación de material aislante).
   - Botas: ASTM F1116/F1116M (ensayo dieléctrico de calzado aislante). 
   - Rígidos (guard equipment): ASTM F712.
   - Detectores, Jumpers, Tierras temporales, Plataformas ABNT/NBR 11855, Cascos NTC 1523: según referencia indicada en el sistema y ficha técnica interna.

Nota: La identificación exacta, título y edición vigente de cada norma deben verificarse antes de aplicarse. Cuando existan discrepancias, prevalece la versión oficial más reciente y la ficha técnica del servicio.

## 4. Definiciones
- Ítem: Elemento o equipo recibido del cliente para servicios de inspección, lavado y/o entrega.
- Recepción: Acto de recibir físicamente ítems del cliente y registrarlos en el sistema (con Nº de Recepción y cantidades).
- Entrega: Acto de devolver ítems al cliente, registrando cantidades, observaciones y firmas.
- Ensayos Alcance: Conjunto de elementos/servicios definidos por HIGH TEST SAS que se gestionan en el formulario (según catálogo interno y normas técnicas aplicables).
- Borrador: Estado intermedio del formulario que se guarda para continuar posteriormente, sin cerrar el caso.
- Caso en progreso: Registro activo seleccionado desde "Casos en progreso" para continuar su diligenciamiento.
- Vista Previa: Render de verificación del documento consolidado generado antes de emitir PDFs.
- PDF Recepción: Documento en PDF que contiene la información de la fase de recepción (puede incluir firmas y datos del cliente).
- PDF Completo: Documento en PDF con la totalidad de la información del proceso (recepción, lavado si aplica, entrega, totales, firmas).
- Firma digital: Firma trazable capturada en el sistema mediante un lienzo (canvas) usando SignaturePad; se almacena como imagen y se inserta en el PDF. Su validez legal depende de políticas internas y del contexto contractual.
- NIT: Número de Identificación Tributaria del cliente.
- Remisión: Documento que el cliente usa para relacionar ítems; en el sistema puede registrarse como "NO REGISTRA" u "Otro".
- Trazabilidad: Capacidad de seguir cada ítem y sus cantidades a lo largo del proceso (recepción → lavado → entrega), con referencia a fechas, responsables y documentos.
- Estado General del Proceso: Indicador resumido (pendiente/en progreso/completo) de acuerdo con las reglas del sistema.
- Responsable del Lavado: Persona(s) encargada(s) de la actividad de lavado cuando aplique.
- Datos personales: Información que identifica o hace identificable a una persona natural; su tratamiento debe cumplir Ley 1581 de 2012 y políticas internas.

## 5. Responsables y roles
- Representante del Cliente (Recepción/Entrega): Diligencia datos, firma y valida cantidades.
- Representante HIGH TEST (Recepción/Entrega): Atiende el proceso, valida información y firma cuando corresponda.
- Coordinación/Calidad: Revisa cumplimiento del POE y atiende auditorías.

## 6. Entradas
- Datos del cliente (empresa, NIT, contacto).  
- N° de Recepción.  
- Fechas de recepción y entrega.  
- Ítems del alcance y cantidades (recibida/entregada/uso/lavado).  
- Observaciones generales.

## 7. Salidas
- Vista previa consolidada.  
- PDF de Recepción (con firmas cuando aplique).  
- PDF Completo (reporte final).  
- Notificaciones/Correo (si se configura).

## 8. Recursos y herramientas
- Aplicación web: `index.html`, `script.js`, `save-table.js`, `pagination.js`.  
- Generación de PDF: `jsPDF` y `html2canvas`.  
- Firmas: `signature_pad`.  
- Autenticación y permisos: `auth.js`.  
- Sistema de emails: `email-completo.js` (opcional).  
- Estilos y diseño responsivo: `styles.css`, `table-styles.css`, `pagination-styles.css`, `responsive.css`.

## 9. Procedimiento

### 9.1 Apertura y autenticación
1. Abrir la aplicación en el navegador autorizado.  
2. Iniciar sesión si el sistema lo requiere.  
3. Verificar permisos (crear, ver, generar PDF) según rol.

### 9.2 Selección de caso o creación de uno nuevo
1. En "Casos en progreso", seleccionar un caso abierto y presionar "Continuar", o refrescar con "↻".  
2. Si no existe caso, continuar con el diligenciamiento de un nuevo formulario.

### 9.3 Información general del cliente
1. Seleccionar "Nº de Recepción" y completar fechas de recepción/entrega.  
2. Elegir la empresa cliente; verificar NIT autocompletado.  
3. Definir "Facturar a Nombre de":
   - Mismo cliente (predeterminado) o 
   - Otro (habilitar campo editable).  
4. Definir "Informe a Nombre de" con la misma lógica.  
5. Diligenciar Nº de Remisión: "NO REGISTRA" (predeterminado) u "Otro".

### 9.4 Gestión de ítems del alcance
1. Seleccionar tipo de ensayo: Ensayos Alcance.  
2. Usar filtros y búsqueda para ubicar ítems.  
3. Diligenciar cantidades por ítem: Recibida, Entregada, No Usado, Usado, Lavados.  
4. Registrar observaciones por ítem cuando aplique.  
5. Agregar artículos personalizados si no están predefinidos.  
6. Guardar/visualizar elementos guardados; usar papelera para eliminar.

### 9.5 Información de lavado (cuando aplique)
1. Responder si se realizó proceso de lavado (Sí/No).  
2. Si Sí: registrar cantidad de elementos lavados y responsables.  
3. Si No: el campo de cantidad permanece en "solo lectura".

### 9.6 Totales y estado
1. Verificar totales de recepción y entrega.  
2. Revisar el "Estado General del Proceso" (pendiente/en progreso/completo según lógica implementada).

### 9.7 Observaciones generales
1. Registrar observaciones complementarias del proceso.

### 9.8 Firmas
1. Capturar firmas del Representante del Cliente (Recepción y Entrega).  
2. Diligenciar nombre, cargo y cédula.  
3. Guardar la firma (botón "Guardar").  
4. Seleccionar representantes HIGH TEST y verificar que el cargo se autocompleta.

### 9.9 Vista previa y validaciones
1. Presionar "Vista Previa" para revisar el documento consolidado.  
2. Validar que la información sea correcta (nombres, cantidades, fechas, firmas).  
3. Corregir en el formulario si es necesario y actualizar la vista previa.

### 9.10 Generación de documentos
1. PDF Recepción: usar "PDF Recepción".  
2. PDF Completo: usar "Generar PDF Completo".  
3. (Opcional) Imprimir o enviar por correo según configuración.

### 9.11 Cierre del caso
1. Guardar borrador si el caso continúa pendiente.  
2. Cuando esté completo, archivar según política interna y registrar la entrega al cliente.

## 10. Controles y registros
- Formulario electrónico completado y firmas digitales.  
- PDFs generados y almacenados.  
- Historial de elementos guardados y borradores (cuando aplique).  
- Logs de autenticación y permisos.

## 11. Indicadores de desempeño
- Tasa de formularios completos vs. iniciados.  
- Tiempo de ciclo entre recepción y entrega.  
- Incidencias/no conformidades por datos incompletos.  
- Reintentos de firma o de generación de PDF.

## 12. Riesgos y controles
- Datos erróneos del cliente → Validación en vista previa y doble verificación.  
- Firmas no capturadas → Bloqueo de generación de PDF hasta firmar (si se implementa).  
- Pérdida de información → Guardado periódico y respaldo de PDFs.  
- Uso en móvil → Reglas en `responsive.css` para consistencia visual.

## 13. Anexos
- Anexo A: Checklist Operativo de Recepción y Entrega (archivo separado).  
- Anexo B: Evidencias de firmas (capturas si aplica).  
- Anexo C: Matriz de permisos de `auth.js`.

---

## 14. Cambios de versión
- v01 (2025-07-07): Primera emisión del POE.

