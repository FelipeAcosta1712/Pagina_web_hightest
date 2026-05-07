/* ============================================
   HIGH TEST SAS - JAVASCRIPT
   Laboratorio de Ensayos Eléctricos
   ============================================ */

// ===========================
// CONFIGURACIÓN Y CONSTANTES
// ===========================

const CONFIG = {
    scrollRevealClass: 'scroll-reveal',
    activeClass: 'active',
    menuToggleSelector: '.header__menu-toggle',
    menuSelector: '.header__menu',
    headerSelector: '.header',
    formSelector: '.contact__form',
    animationDuration: 0.6,
    scrollDistance: 100,
    themeStorageKey: 'hightest_theme',
};

// ===========================
// UTILIDADES
// ===========================

/**
 * Utilidad para debouncing (limita la frecuencia de ejecución)
 */
const debounce = (fn, delay = 300) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Utilidad para throttling (ejecuta máximo una vez en X tiempo)
 */
const throttle = (fn, delay = 100) => {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return fn(...args);
        }
    };
};

/**

        const AccreditationGallery = {
            init() {
                this.section = document.getElementById('acreditacion');
                if (!this.section) return;

                this.thumbs = this.section.querySelectorAll('.gallery__thumb');
                this.modal = document.getElementById('accreditationModal');
                if (!this.thumbs.length || !this.modal) return;

                this.titleEl = this.modal.querySelector('.modal__title');
                this.downloadEl = this.modal.querySelector('.modal__download');
                this.closeBtn = this.modal.querySelector('.modal__close');

                this.bindEvents();
            },

            bindEvents() {
                this.thumbs.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const title = btn.dataset.title || '';
                        const href = btn.dataset.href || '#';
                        const preview = btn.dataset.img || btn.querySelector('img')?.src || '';
                        this.openModal(title, href, preview);
                    });
                });

                if (this.closeBtn) {
                    this.closeBtn.addEventListener('click', () => this.closeModal());
                }

                // close on outside click
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeModal();
                });

                // ESC to close
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.modal.getAttribute('aria-hidden') === 'false') {
                        this.closeModal();
                    }
                });
            },

            openModal(title, href, previewSrc) {
                if (this.titleEl) this.titleEl.textContent = title;
                if (this.downloadEl) this.downloadEl.setAttribute('href', href);
                // preview image
                const imgEl = this.modal.querySelector('.modal__preview');
                if (imgEl) {
                    imgEl.src = previewSrc || '';
                    imgEl.alt = title || 'Vista previa del certificado';
                }
                this.modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                // focus the download link for accessibility
                if (this.downloadEl) this.downloadEl.focus();
            },

            closeModal() {
                this.modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        };

        // ===========================
        // MÓDULO: VALIDACIÓN DE FORMULARIO
 * Validar email
 */
const isValidEmail = (email) => {
    const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    return regex.test(email);
};

/**
 * Validar teléfono (formato internacional)
 */
const isValidPhone = (phone) => {
    const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phone.trim() === '' || regex.test(phone);
};

/**
 * Notificaciones tipo Toast (sin dependencias)
 */
const Toast = {
    containerId: 'htToastContainer',

    ensureContainer() {
        let container = document.getElementById(this.containerId);
        if (container) return container;

        container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'ht-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    },

    show({ title, message, variant = 'info', duration = 2800 } = {}) {
        const safeTitle = (title ?? '').toString().trim();
        const safeMessage = (message ?? '').toString().trim();
        if (!safeTitle && !safeMessage) return;

        const iconByVariant = {
            success: '✅',
            error: '⚠️',
            info: 'ℹ️'
        };

        const container = this.ensureContainer();
        const toast = document.createElement('div');
        toast.className = `ht-toast ht-toast--${variant}`;
        toast.setAttribute('role', 'status');

        const icon = document.createElement('div');
        icon.className = 'ht-toast__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = iconByVariant[variant] || iconByVariant.info;

        const content = document.createElement('div');
        content.className = 'ht-toast__content';

        if (safeTitle) {
            const titleEl = document.createElement('div');
            titleEl.className = 'ht-toast__title';
            titleEl.textContent = safeTitle;
            content.appendChild(titleEl);
        }

        if (safeMessage) {
            const messageEl = document.createElement('div');
            messageEl.className = 'ht-toast__message';
            messageEl.textContent = safeMessage;
            content.appendChild(messageEl);
        }

        toast.appendChild(icon);
        toast.appendChild(content);

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add('ht-toast--out');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }, Math.max(900, Number(duration) || 0));
    }
};

// ===========================
// MÓDULO: MENU HAMBURGUESA
// ===========================

const MobileMenu = {
    /**
     * Inicializar el menú móvil
     */
    init() {
        this.toggle = document.querySelector(CONFIG.menuToggleSelector);
        this.menu = document.querySelector(CONFIG.menuSelector);
        
        if (!this.toggle || !this.menu) {
            console.error('❌ MobileMenu: elementos no encontrados', {
                toggle: CONFIG.menuToggleSelector,
                menu: CONFIG.menuSelector,
                toggleExists: !!document.querySelector(CONFIG.menuToggleSelector),
                menuExists: !!document.querySelector(CONFIG.menuSelector)
            });
            return;
        }
        
        this.setupListeners();
    },

    /**
     * Configurar event listeners
     */
    setupListeners() {
        // Click en botón hamburguesa
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleToggle();
        });
        
        // Cerrar al clic en un link
        const links = this.menu.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                this.close();
            });
        });

        // Cerrar al hacer scroll
        window.addEventListener('scroll', debounce(() => {
            console.log('📜 Scroll detectado, cerrando menú');
            this.close();
        }, 100));

        // Cerrar al hacer click en el overlay
        this.menu.addEventListener('click', (e) => {
            if (e.target === this.menu) {
                console.log('🌑 Click en overlay, cerrando menú');
                this.close();
            }
        });
    },

    /**
     * Toggle del menú
     */
    handleToggle() {
        this.toggle.classList.toggle(CONFIG.activeClass);
        this.menu.classList.toggle(CONFIG.activeClass);

        const isOpen = this.menu.classList.contains(CONFIG.activeClass);
        this.toggle.setAttribute('aria-expanded', isOpen);
        this.menu.setAttribute('aria-hidden', !isOpen);
    },

    /**
     * Abrir menú
     */
    open() {
        if (!this.toggle.classList.contains(CONFIG.activeClass)) {
            this.handleToggle();
        }
    },

    /**
     * Cerrar menú
     */
    close() {
        if (this.toggle.classList.contains(CONFIG.activeClass)) {
            this.handleToggle();
        }
    }
};

// ===========================
// MÓDULO: SCROLL REVEAL
// ===========================

const ScrollReveal = {
    /**
     * Inicializar scroll reveal
     */
    init() {
        this.setupObserver();
        this.revealOnLoad();
    },

    /**
     * Observador de intersección
     */
    setupObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(CONFIG.activeClass);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observar todos los elementos con scroll-reveal
        const revealElements = document.querySelectorAll(`.${CONFIG.scrollRevealClass}`);
        revealElements.forEach(el => this.observer.observe(el));
    },

    /**
     * Revelar elementos visibles al cargar
     */
    revealOnLoad() {
        const revealElements = document.querySelectorAll(`.${CONFIG.scrollRevealClass}`);
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add(CONFIG.activeClass);
            }
        });
    }
};

// ===========================
// MÓDULO: HEADER STICKY
// ===========================

const StickyHeader = {
    /**
     * Inicializar header sticky
     */
    init() {
        this.header = document.querySelector(CONFIG.headerSelector);
        if (!this.header) return;

        window.addEventListener('scroll', throttle(() => this.handleScroll(), 50));
    },

    /**
     * Manejo del scroll
     */
    handleScroll() {
        const scrollTop = window.scrollY;
        const threshold = CONFIG.scrollDistance + 50; // Adjusted threshold for better visibility

        if (scrollTop > threshold) {
            this.header.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        } else {
            this.header.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
        }
    }
};

// ===========================
// MÓDULO: TEMA CLARO / OSCURO
// ===========================

const ThemeManager = {
    currentTheme: 'light',

    init() {
        const stored = localStorage.getItem(CONFIG.themeStorageKey);
        this.currentTheme = stored === 'dark' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme, false);
        this.setupListeners();
    },

    setupListeners() {
        const desktopBtn = document.getElementById('themeToggleBtn');
        const mobileBtn = document.getElementById('mobileThemeToggleBtn');

        const handler = () => {
            const next = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(next, true);
        };

        if (desktopBtn) desktopBtn.addEventListener('click', handler);
        if (mobileBtn) mobileBtn.addEventListener('click', handler);
    },

    applyTheme(theme, persist = true) {
        this.currentTheme = theme;
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');

        this.updateToggleLabels();

        if (persist) {
            localStorage.setItem(CONFIG.themeStorageKey, theme);
        }
    },

    updateToggleLabels() {
        const desktopBtn = document.getElementById('themeToggleBtn');
        const mobileBtn = document.getElementById('mobileThemeToggleBtn');
        const isDark = this.currentTheme === 'dark';

        if (desktopBtn) {
            desktopBtn.textContent = isDark ? '☀️' : '🌙';
            desktopBtn.title = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
        }

        if (mobileBtn) {
            mobileBtn.textContent = isDark ? '☀️ Tema claro' : '🌙 Tema oscuro';
        }
    }
};

// ===========================
// MÓDULO: VALIDACIÓN DE FORMULARIO
// ===========================

const FormValidator = {
    /**
     * Inicializar validación de formulario
     */
    init() {
        this.form = document.querySelector(CONFIG.formSelector);
        if (!this.form) return;

        this.inputs = this.form.querySelectorAll('input, select, textarea');
        this.setupValidation();
    },

    /**
     * Configurar validación en tiempo real
     */
    setupValidation() {
        this.inputs.forEach(input => {
            // Validación al cambiar
            input.addEventListener('change', () => this.validateField(input));
            
            // Validación al desenfocarse
            input.addEventListener('blur', () => this.validateField(input));
            
            // Limpiar error al escribir
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                    this.removeError(input);
                }
            });
        });

        // Submit del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    /**
     * Validar campo individual
     */
    validateField(field) {
        const type = field.type;
        const value = field.value.trim();
        const required = field.required; // Simplified required check

        // Validar si es requerido
        if (required && !value) {
            this.showError(field, 'Este campo es requerido');
            return false;
        }

        // Validaciones específicas por tipo
        switch (type) {
            case 'email':
                if (value && !isValidEmail(value)) {
                    this.showError(field, 'Ingrese un email válido');
                    return false;
                }
                break;
            case 'tel':
                if (value && !isValidPhone(value)) {
                    this.showError(field, 'Ingrese un teléfono válido');
                    return false;
                }
                break;
            case 'text':
            case 'textarea':
                if (value && value.length < 3) {
                    this.showError(field, 'Mínimo 3 caracteres');
                    return false;
                }
                break;
        }

        this.removeError(field);
        return true;
    },

    /**
     * Mostrar error en campo
     */
    showError(field, message) {
        field.classList.add('error');
        
        // Eliminar error anterior si existe
        this.removeError(field);
        
        // Crear elemento de error
        const errorDiv = document.createElement('span');
        errorDiv.className = 'form__error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            display: block;
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
            animation: fadeIn 0.3s ease;
        `;
        
        field.parentNode.appendChild(errorDiv);
    },

    /**
     * Remover error en campo
     */
    removeError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.form__error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Manejar submit del formulario
     */
    handleSubmit(e) {
        e.preventDefault();

        // Validar todos los campos
        let isValid = true;
        this.inputs.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            console.warn('Formulario inválido');
            return;
        }

        // Si es válido, mostrar mensaje de éxito
        this.showSuccess();

        // Aquí se enviaría a servidor
        console.log('Formulario válido, enviando datos...');
        
        // Resetear formulario después de 2 segundos
        setTimeout(() => {
            this.form.reset();
            this.resetFields();
        }, 1500);
    },

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess() {
        const successDiv = document.createElement('div');
        successDiv.className = 'form__success';
        successDiv.setAttribute('role', 'alert');
        successDiv.innerHTML = `
            <p style="
                background: #10b981;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                animation: slideInDown 0.3s ease;
            ">
                ✓ Gracias por contactarnos. Nos comunicaremos pronto.
            </p>
        `;
        
        this.form.insertBefore(successDiv, this.form.firstChild);

        // Remover después de 3 segundos
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    },

    /**
     * Resetear estilos de campos
     */
    resetFields() {
        this.inputs.forEach(field => {
            field.classList.remove('error');
            const errorDiv = field.parentNode.querySelector('.form__error');
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }
};

// ===========================
// MÓDULO: SMOOTH SCROLL
// ===========================

const SmoothScroll = {
    /**
     * Inicializar smooth scroll para anclas
     */
    init() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => this.handleAnchorClick(e));
        });
    },

    /**
     * Manejar click en anclas
     */
    handleAnchorClick(e) {
        const href = e.currentTarget.getAttribute('href');
        
        // Saltar if es solo "#"
        if (href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        
        if (target) {
            e.preventDefault();
            
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Accessibility: focus en el elemento
            target.focus();
        }
    }
};

// ===========================
// MÓDULO: ANIMACIONES SCROLL
// ===========================

const ScrollAnimations = {
    /**
     * Inicializar animaciones por scroll
     */
    init() {
        // Agregar clase scroll-reveal a elementos que deben ser revelados
        this.addScrollRevealToCards();
        
        // Inicializar scroll reveal
        ScrollReveal.init();
    },

    /**
     * Agregar clase scroll-reveal a tarjetas
     */
    addScrollRevealToCards() {
        const selectors = [
            '.service-card',
            '.capacity__card',
            '.accreditation__card',
            '.equipment__card',
            '.sector__card',
            '.standard__item',
            '.intro__highlight',
            '.stat__item'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add(CONFIG.scrollRevealClass);
                // Delay escalonado
                el.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }
};

// ===========================
// MÓDULO: UTILIDADES DE NAVEGACIÓN
// ===========================

const Navigation = {
    /**
     * Inicializar navegación
     */
    init() {
        this.setupAnchorLinks();
        this.updateActiveLink();
        
        window.addEventListener('scroll', throttle(() => this.updateActiveLink(), 100));
    },

    /**
     * Configurar links de navegación
     */
    setupAnchorLinks() {
        const navLinks = document.querySelectorAll('.header__link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    
                    if (target) {
                        // Cerrar menú móvil
                        MobileMenu.close();
                        
                        // Scroll suave
                        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    },

    /**
     * Actualizar link activo según scroll
     */
    updateActiveLink() {
        const scrollY = window.scrollY;
        const navLinks = document.querySelectorAll('.header__link');
        
        navLinks.forEach(link => {
            link.classList.remove(CONFIG.activeClass);
            
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = document.querySelector(href);
                
                if (section) {
                    const sectionTop = section.offsetTop - 100;
                    const sectionHeight = section.offsetHeight;
                    
                    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                        link.classList.add(CONFIG.activeClass);
                    }
                }
            }
        });
    }
};

// ===========================
// MÓDULO: VERIFICADOR PÚBLICO DE INFORMES
// ===========================

const PublicReportVerifier = {
    // Datos de ejemplo de informes emitidos por HIGH TEST.
    // En producción, estos datos vendrían de una API/servidor.
    reports: [
        {
            number: 'HT-2025-001',
            client: 'Empresa 1 SAS',
            product: 'Guantes aislantes Clase 2',
            date: '2025-03-15',
            type: 'Informe de ensayo acreditado',
            status: 'Válido',
            lab: 'HIGH TEST SAS',
            note: 'Ejemplo de informe generado dentro del sistema interno de HIGH TEST.'
        },
        {
            number: 'HT-2025-002',
            client: 'Empresa 2 Ltda',
            product: 'Herramientas aislantes',
            date: '2025-03-10',
            type: 'Informe de verificación',
            status: 'Válido',
            lab: 'HIGH TEST SAS',
            note: 'Informe de verificación de lote de herramientas aislantes.'
        },
        {
            number: 'HT-2025-003',
            client: 'Empresa 3 S.A.',
            product: 'Ensayo funcional de equipos',
            date: '2025-03-08',
            type: 'Informe de ensayo',
            status: 'Válido',
            lab: 'HIGH TEST SAS',
            note: 'Ensayos funcionales de equipos de medición en banco.'
        },
        {
            number: 'HT-2025-004',
            client: 'Cliente Demo',
            product: 'Informe de ensayo adicional',
            date: '2025-03-05',
            type: 'Informe de ensayo',
            status: 'En revisión',
            lab: 'HIGH TEST SAS',
            note: 'Ejemplo de informe marcado como pendiente de cierre técnico.'
        }
    ],

    init() {
        const input = document.getElementById('numeroInforme');
        const btn = document.getElementById('verifyReportBtn');
        const result = document.getElementById('verifyReportResult');

        if (!input || !btn || !result) return;

        this.modal = document.getElementById('reportVerifyModal');
        this.modalBody = document.getElementById('reportVerifyBody');
        this.modalClose = document.getElementById('reportVerifyClose');
        this.modalCloseFooter = document.getElementById('reportVerifyCloseFooter');

        this.bindModalEvents();

        const handleVerify = () => {
            const raw = input.value.trim();
            if (!raw) {
                this.showResult('Por favor ingrese un número de informe.', false);
                this.showModal(null, false, '');
                return;
            }

            const normalized = raw.toUpperCase();
            const record = this.reports.find(r => r.number === normalized);

            if (record) {
                this.showResult(`✔ Informe ${normalized} válido. Se muestran más datos en la ventana.`, true);
                this.showModal(record, true, normalized);
            } else {
                this.showResult(`✖ No encontramos el informe ${normalized} en los registros de ejemplo.`, false);
                this.showModal(null, false, normalized);
            }
        };

        // Exponer función global opcional para validación programática
        window.validarInforme = handleVerify;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleVerify();
        });

        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleVerify();
            }
        });
    },

    bindModalEvents() {
        if (!this.modal) return;

        const close = () => this.closeModal();

        if (this.modalClose) {
            this.modalClose.addEventListener('click', close);
        }
        if (this.modalCloseFooter) {
            this.modalCloseFooter.addEventListener('click', close);
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    },

    openModal() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    showModal(record, ok, searchedNumber) {
        if (!this.modal || !this.modalBody) return;

        if (!record && !searchedNumber) {
            this.modalBody.innerHTML = `
                <div class="report-modal__status report-modal__status--error">
                    <span class="report-modal__status-icon">!</span>
                    <span>No se pudo realizar la verificación. Intente nuevamente.</span>
                </div>
            `;
            this.openModal();
            return;
        }

        if (record) {
            this.modalBody.innerHTML = `
                <div class="report-modal__status report-modal__status--ok">
                    <span class="report-modal__status-icon">✔</span>
                    <span>Informe válido emitido por HIGH TEST SAS.</span>
                </div>
                <div class="report-modal__details">
                    <div class="report-modal__row">
                        <span class="report-modal__label">Número de informe:</span>
                        <span class="report-modal__value">${record.number}</span>
                    </div>
                    <div class="report-modal__row">
                        <span class="report-modal__label">Cliente:</span>
                        <span class="report-modal__value">${record.client}</span>
                    </div>
                    <div class="report-modal__row">
                        <span class="report-modal__label">Elemento/Ensayo:</span>
                        <span class="report-modal__value">${record.product}</span>
                    </div>
                    <div class="report-modal__row">
                        <span class="report-modal__label">Fecha de emisión:</span>
                        <span class="report-modal__value">${record.date}</span>
                    </div>
                    <div class="report-modal__row">
                        <span class="report-modal__label">Tipo de documento:</span>
                        <span class="report-modal__value">${record.type}</span>
                    </div>
                    <div class="report-modal__row">
                        <span class="report-modal__label">Estado:</span>
                        <span class="report-modal__value">${record.status}</span>
                    </div>
                    <div class="report-modal__row">
                        <span class="report-modal__label">Laboratorio:</span>
                        <span class="report-modal__value">${record.lab}</span>
                    </div>
                </div>
                <p class="report-modal__note">
                    La presente verificación es informativa y se basa en datos de ejemplo cargados en este entorno de demostración.
                    Para confirmar informes reales, el laboratorio HIGH TEST SAS podrá solicitar datos adicionales de validación.
                </p>
            `;
        } else {
            this.modalBody.innerHTML = `
                <div class="report-modal__status report-modal__status--error">
                    <span class="report-modal__status-icon">✖</span>
                    <span>No encontramos el informe <strong>${searchedNumber}</strong> en los registros de ejemplo.</span>
                </div>
                <p class="report-modal__note">
                    Verifique que el número esté escrito exactamente como aparece en el informe (ejemplo: HT-2025-001).
                    Si se trata de un informe real y aún así tiene dudas, por favor contacte directamente a HIGH TEST SAS para recibir confirmación formal.
                </p>
            `;
        }

        this.openModal();
    },

    showResult(message, ok) {
        const result = document.getElementById('verifyReportResult');
        if (!result) return;

        result.textContent = message;
        result.classList.remove('hero__verify-result--ok', 'hero__verify-result--error');
        result.classList.add(ok ? 'hero__verify-result--ok' : 'hero__verify-result--error');
    }
};

// ===========================
// MÓDULO: BLOG (ARTÍCULOS)
// ===========================

const BlogManager = {
    init() {
        const posts = document.querySelectorAll('.blog__post');
        const modal = document.getElementById('blogPostModal');

        if (!posts.length || !modal) return;

        this.modal = modal;
        this.titleEl = document.getElementById('blogPostTitle');
        this.metaEl = document.getElementById('blogPostMeta');
        this.bodyEl = document.getElementById('blogPostBody');

        posts.forEach(post => {
            post.addEventListener('click', () => this.openFromPost(post));
        });

        const closeBtn = document.getElementById('blogPostClose');
        const closeFooterBtn = document.getElementById('blogPostCloseFooter');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => this.close());
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.close();
            }
        });
    },

    openFromPost(post) {
        const title = post.querySelector('.blog__title')?.textContent.trim() || '';
        const excerpt = post.querySelector('.blog__excerpt')?.textContent.trim() || '';
        const date = post.querySelector('.blog__date')?.textContent.trim() || '';
        const readTime = post.querySelector('.blog__read-time')?.textContent.trim() || '';

        if (this.titleEl) {
            this.titleEl.textContent = title;
        }

        if (this.metaEl) {
            this.metaEl.textContent = date && readTime ? `${date} · ${readTime}` : `${date}${readTime}`;
        }

        if (this.bodyEl) {
            this.bodyEl.innerHTML = `
                <p>${excerpt}</p>
                <p>
                    El desarrollo completo de este artículo estará disponible próximamente.
                    Para recibir más información técnica sobre este tema, puede contactar al equipo de HIGH TEST SAS
                    a través de los canales de contacto del sitio.
                </p>
            `;
        }

        this.open();
    },

    open() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// ===========================
// MÓDULO: CARRUSEL DEL HERO
// ===========================

const HeroCarousel = {
    images: ['image/banner.png', 'image/banner2.png', 'image/banner3.png', 'image/banner4.png'],
    currentIndex: 0,
    intervalId: null,
    intervalMs: 7000,

    init() {
        const hero = document.querySelector('.hero');
        if (!hero || this.images.length <= 1) return;

        this.hero = hero;
        this.preloadImages();
        this.start();
    },

    preloadImages() {
        this.images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    },

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.next(), this.intervalMs);
    },

    next() {
        if (!this.hero) return;

        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        const src = this.images[this.currentIndex];

        // Fondo combinado: degradado + imagen
        this.hero.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%), url('${src}')`;
        this.hero.style.backgroundSize = 'cover';
        this.hero.style.backgroundPosition = 'center';
        this.hero.style.backgroundRepeat = 'no-repeat';
    }
};

// ===========================
// MÓDULO: INICIALIZACIÓN
// ===========================

const App = {
    /**
     * Inicializar la aplicación
     */
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    },

    /**
     * Configuración principal
     */
    setup() {
        console.log('🚀 HIGH TEST SAS - Inicializando aplicación...');

        // Inicializar módulos
        MobileMenu.init();
        StickyHeader.init();
        ThemeManager.init();
        FormValidator.init();
        FormValidatorContact.init();
        SmoothScroll.init();
        ScrollAnimations.init();
        Navigation.init();
        CertificationsHub.init();
        AccreditationGallery.init();
        AuthManager.init();
        CertificatesManager.init();
        PublicCertificatesManager.init();
        CertificatesAuthManager.init();
        ClientAuth.init();
        BlogManager.init();
        HeroCarousel.init();

        console.log('✅ Aplicación inicializada correctamente');

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('appReady'));
    }
};

// ===========================
// MÓDULO: CENTRO DE CERTIFICADOS
// ===========================

const CertificationsHub = {
    /**
     * Inicializar hub de certificados
     */
    init() {
        const filterBtns = document.querySelectorAll('.cert-hub__filter-btn');
        const cards = document.querySelectorAll('.cert-hub__card');

        if (filterBtns.length === 0 || cards.length === 0) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn, cards));
        });

        // Agregar scroll reveal a las tarjetas
        cards.forEach((card, index) => {
            card.classList.add(CONFIG.scrollRevealClass);
            card.style.animationDelay = `${index * 0.05}s`;
        });
    },

    /**
     * Manejar filtrado de tarjetas
     */
    handleFilter(btn, cards) {
        const filter = btn.getAttribute('data-filter');

        // Actualizar botones activos
        document.querySelectorAll('.cert-hub__filter-btn').forEach(b => {
            b.classList.remove(CONFIG.activeClass);
            b.setAttribute('aria-pressed', 'false');
        });

        btn.classList.add(CONFIG.activeClass);
        btn.setAttribute('aria-pressed', 'true');

        // Filtrar tarjetas
        cards.forEach(card => {
            const category = card.getAttribute('data-category');

            if (filter === 'all' || category === filter) {
                // Mostrar tarjeta
                setTimeout(() => {
                    card.style.display = 'flex';
                    card.classList.add(CONFIG.activeClass);
                }, 50);
            } else {
                // Ocultar tarjeta
                card.classList.remove(CONFIG.activeClass);
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
};

// ===========================
// MÓDULO: VALIDACIÓN DE FORMULARIO
// ===========================

const FormValidatorContact = {
    init() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Validación en tiempo real
        form.querySelectorAll('.form__input').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    },

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        
        if (!value && field.required) {
            this.showError(field, 'Este campo es obligatorio');
            return false;
        }

        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showError(field, 'Correo electrónico inválido');
                return false;
            }
        }

        if (type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
            if (!phoneRegex.test(value)) {
                this.showError(field, 'Teléfono inválido');
                return false;
            }
        }

        return true;
    },

    showError(field, message) {
        field.classList.add('form__input--error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form__error';
        errorDiv.textContent = message;
        
        const existing = field.parentElement.querySelector('.form__error');
        if (existing) existing.remove();
        
        field.parentElement.appendChild(errorDiv);
    },

    clearError(field) {
        field.classList.remove('form__input--error');
        const error = field.parentElement.querySelector('.form__error');
        if (error) error.remove();
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const fields = form.querySelectorAll('.form__input[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showFormFeedback('Por favor, corrija los errores en el formulario', 'error');
            return;
        }

        this.showFormFeedback('¡Solicitud enviada exitosamente!', 'success');
        setTimeout(() => {
            form.reset();
            this.showFormFeedback('', '');
        }, 2000);
    },

    showFormFeedback(message, type) {
        const feedbackDiv = document.getElementById('formFeedback');
        if (!feedbackDiv) return;

        if (!message) {
            feedbackDiv.style.display = 'none';
            feedbackDiv.className = '';
            return;
        }

        feedbackDiv.textContent = message;
        feedbackDiv.className = `form__feedback form__feedback--${type}`;
        feedbackDiv.style.display = 'block';
    }
};

// ===========================
// GESTOR DE AUTENTICACIÓN
// ===========================

const AuthManager = {
    currentUser: null,
    storageKey: 'hightest_user',
    _initialized: false,
    _loginInProgress: false,

    ensureAuthNotice() {
        const authModal = document.getElementById('authModal');
        if (!authModal) return null;

        let notice = authModal.querySelector('#authModalNotice');
        if (notice) return notice;

        const loginTab = document.getElementById('loginTab');
        const subtitle = authModal.querySelector('.auth-modal__subtitle');
        if (!loginTab) return null;

        notice = document.createElement('div');
        notice.id = 'authModalNotice';
        notice.className = 'auth-modal__notice auth-modal__notice--hidden';
        notice.setAttribute('role', 'status');
        notice.setAttribute('aria-live', 'polite');

        if (subtitle && subtitle.parentElement === loginTab) {
            subtitle.insertAdjacentElement('afterend', notice);
        } else {
            loginTab.insertAdjacentElement('afterbegin', notice);
        }

        return notice;
    },

    showAuthNotice({ message, variant = 'success', duration = 3000 } = {}) {
        const text = (message ?? '').toString().trim();
        if (!text) return;

        const notice = this.ensureAuthNotice();
        if (!notice) return;

        notice.textContent = text;
        notice.classList.remove('auth-modal__notice--hidden');
        notice.classList.toggle('auth-modal__notice--success', variant === 'success');
        notice.classList.toggle('auth-modal__notice--error', variant === 'error');
        notice.classList.toggle('auth-modal__notice--info', variant === 'info');

        window.clearTimeout(this._noticeTimeoutId);
        this._noticeTimeoutId = window.setTimeout(() => {
            notice.classList.add('auth-modal__notice--hidden');
            notice.textContent = '';
        }, Math.max(900, Number(duration) || 0));
    },

    /**
     * Inicializar el gestor de autenticación
     */
    init() {
        if (this._initialized) {
            console.log('🔐 AuthManager: Ya estaba inicializado, omitiendo.');
            return;
        }
        this._initialized = true;
        console.log('🔐 AuthManager: Inicializando...');
        this.loadUserFromStorage();
        this.setupEventListeners();
        this.updateUIBasedOnAuthStatus();
        console.log('✅ AuthManager: Inicialización completada');
    },

    /**
     * Cargar datos del usuario desde localStorage
     */
    loadUserFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    /**
     * Guardar usuario en localStorage
     */
    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
        }
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        console.log('🔐 AuthManager: Configurando event listeners...');
        // Botón de login HIGH TEST en header
        const loginBtn = document.getElementById('loginBtn');
        console.log('🔐 AuthManager: loginBtn encontrado:', !!loginBtn);
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                console.log('🔐 AuthManager: Click en loginBtn');
                // Si ya hay sesión HIGH TEST, ir directo al panel
                if (this.currentUser) {
                    console.log('🔐 AuthManager: Usuario ya autenticado, redirigiendo a admin-panel');
                    window.location.href = 'admin-panel.html';
                    return;
                }
                // Si no hay sesión, abrir modal de login
                this.openAuthModal();
            });
        }

        // Botón de login HIGH TEST en menú móvil
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        console.log('🔐 AuthManager: mobileLoginBtn encontrado:', !!mobileLoginBtn);
        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', () => {
                console.log('🔐 AuthManager: Click en mobileLoginBtn');
                // Si ya hay sesión HIGH TEST, ir directo al panel
                if (this.currentUser) {
                    console.log('🔐 AuthManager: Usuario ya autenticado (móvil), redirigiendo a admin-panel');
                    window.location.href = 'admin-panel.html';
                    MobileMenu.close();
                    return;
                }
                // Si no hay sesión, abrir modal de login
                this.openAuthModal();
                // Cerrar menú móvil después de hacer click
                MobileMenu.close();
            });
        }

        // Modal de autenticación
        const authModal = document.getElementById('authModal');
        console.log('🔐 AuthManager: authModal encontrado:', !!authModal);
        const closeBtn = authModal?.querySelector('.auth-modal__close');
        console.log('🔐 AuthManager: closeBtn encontrado:', !!closeBtn);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('🔐 AuthManager: Click en closeBtn');
                this.closeAuthModal();
            });
        }

        // Tabs del modal (solo login ahora)
        const tabButtons = authModal?.querySelectorAll('.auth-modal__tab');
        console.log('🔐 AuthManager: tabButtons encontrados:', tabButtons?.length || 0);
        tabButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                console.log('🔐 AuthManager: Click en tab:', tabName);
                this.switchTab(tabName);
            });
        });

        // Formularios
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Cerrar modal al hacer clic fuera
        authModal?.addEventListener('click', (e) => {
            if (e.target === authModal) {
                this.closeAuthModal();
            }
        });
    },

    /**
     * Abrir modal de autenticación
     */
    openAuthModal() {
        console.log('🔐 AuthManager: Abriendo modal...');
        const authModal = document.getElementById('authModal');
        console.log('🔐 AuthManager: Modal encontrado:', !!authModal);
        if (authModal) {
            authModal.classList.add('active');
            console.log('🔐 AuthManager: Clase "active" agregada al modal');
            document.body.style.overflow = 'hidden';
            // Ir al tab de login
            this.switchTab('login');
            console.log('🔐 AuthManager: Modal abierto exitosamente');
        } else {
            console.error('🔐 AuthManager: Modal no encontrado en el DOM');
        }
    },

    /**
     * Cerrar modal de autenticación
     */
    closeAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Cambiar entre tabs de login/registro
     */
    switchTab(tabName) {
        const authModal = document.getElementById('authModal');
        if (!authModal) return;

        // Desactivar todos los tabs
        authModal.querySelectorAll('.auth-modal__tab-content').forEach(content => {
            content.classList.remove('active');
        });
        authModal.querySelectorAll('.auth-modal__tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activar el tab seleccionado
        const selectedContent = document.getElementById(`${tabName}Tab`);
        const selectedBtn = authModal.querySelector(`[data-tab="${tabName}"]`);
        if (selectedContent) selectedContent.classList.add('active');
        if (selectedBtn) selectedBtn.classList.add('active');
    },

    /**
     * Manejar login
     */
    async handleLogin(e) {
        e.preventDefault();

        if (this._loginInProgress) return;
        this._loginInProgress = true;

        let redirectScheduled = false;

        const form = e.target;
        const email = form.querySelector('input[name="email"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        // Validaciones básicas
        if (!email || !password) {
            alert('Por favor, completa todos los campos');
            this._loginInProgress = false;
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Correo electrónico inválido');
            this._loginInProgress = false;
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });

            const resultado = await response.json().catch(() => ({}));

            if (!response.ok) {
                alert('Acceso denegado: Verifique sus credenciales de HIGH TEST.');
                this._loginInProgress = false;
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            const remember = !!form.querySelector('input[name="remember"]')?.checked;
            const user = resultado?.user;
            const userName = user?.nombre || user?.name || email;
            const userRole = user?.rol || user?.rol || rol;

            // Login exitoso - Usuario HIGH TEST
            this.currentUser = {
                id: user?.id || Date.now(),
                name: userName,
                email: user?.email || email,
                company: 'HIGH TEST SAS',
                loginTime: new Date().toLocaleString(),
                userType: 'hightest',
                role: userRole,
                remember
            };

            this.saveUserToStorage();

            // Mostrar mensaje en el mismo modal y luego redirigir
            this.showAuthNotice({
                message: `Acceso concedido. Bienvenido, ${this.currentUser.name}. Redirigiendo al panel administrativo...`,
                variant: 'success',
                duration: 3000
            });

            redirectScheduled = true;
            window.setTimeout(() => {
                window.location.href = 'admin-panel.html';
            }, 3000);
        } catch (error) {
            console.error('Error en el sistema de acceso:', error);
            alert('Error en el sistema de acceso. Intente nuevamente.');
        } finally {
            if (!redirectScheduled) {
                this._loginInProgress = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        }
    },

    /**
     * Cerrar sesión (logout)
     */
    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem(this.storageKey);
            this.currentUser = null;
            this.updateUIBasedOnAuthStatus();
            this.closeAuthModal();
            // También ocultar vistas de cliente si existían
            CertificatesAuthManager.hideAllViews();
            alert('Has cerrado sesión correctamente');
        }
    },

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Mostrar vista de HIGH TEST
     */
    showHightestView() {
        // Ocultar todas las vistas
        this.hideAllViews();
        
        // Mostrar vista de HIGH TEST
        const hightestView = document.getElementById('misCertificados');
        if (hightestView) {
            hightestView.style.display = 'block';
            // Scroll a la vista
            setTimeout(() => {
                hightestView.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },

    /**
     * Ocultar todas las vistas de usuario
     */
    hideAllViews() {
        const hightestView = document.getElementById('misCertificados');
        const clientView = document.getElementById('clientPortal');
        
        if (hightestView) hightestView.style.display = 'none';
        if (clientView) clientView.style.display = 'none';
    },

    /**
     * Actualizar UI basado en estado de autenticación
     */
    updateUIBasedOnAuthStatus() {
        const loginBtn = document.getElementById('loginBtn');
        const myCertsSection = document.getElementById('misCertificados');

        if (this.currentUser) {
            // Usuario HIGH TEST autenticado
            if (loginBtn) {
                loginBtn.innerHTML = '🔐 INGRESO<br>HIGH TEST';
                loginBtn.style.backgroundColor = 'rgba(0, 58, 128, 0.9)';
                loginBtn.style.color = '#ffffff';
            }
            // En la página de inicio no mostramos la sección "Mis Certificados"
            if (myCertsSection) {
                myCertsSection.style.display = 'none';
            }
        } else {
            // Usuario no autenticado
            if (loginBtn) {
                loginBtn.innerHTML = '🔐 INGRESO<br>HIGH TEST';
                loginBtn.style.backgroundColor = '';
                loginBtn.style.color = '';
            }
            if (myCertsSection) {
                myCertsSection.style.display = 'none';
            }
            // También ocultar vista de cliente
            this.hideAllViews();
        }
    },

    /**
     * Actualizar información en la tarjeta de usuario
     */
    updateUserCardInfo() {
        if (!this.currentUser) return;

        const nameEl = document.getElementById('userName');
        const emailEl = document.getElementById('userEmail');
        const companyEl = document.getElementById('userCompany');
        const avatarEl = document.querySelector('.user-card__avatar');

        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (emailEl) emailEl.textContent = this.currentUser.email;
        if (companyEl) companyEl.textContent = this.currentUser.company;
        if (avatarEl) {
            const initials = this.currentUser.name.charAt(0).toUpperCase();
            avatarEl.textContent = initials;
        }
    }
};

// ===========================
// GESTOR DE DESCARGA DE CERTIFICADOS PÚBLICOS
// ===========================

const PublicCertificatesManager = {
    init() {
        this.setupDownloadButton();
    },

    /**
     * Configurar botón de descarga de certificado público
     */
    setupDownloadButton() {
        const downloadBtn = document.getElementById('downloadCertBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => this.handleDownload(e));
        }
    },

    /**
     * Manejar descarga de certificado
     */
    handleDownload(e) {
        e.preventDefault();
        
        // Simulación de descarga - en producción esto descargaría un PDF real
        alert('Descargando certificado de ensayo...\n\nEn una implementación real, aquí se descargaría el archivo PDF del certificado.');
        
        // Simular descarga creando un enlace temporal
        const link = document.createElement('a');
        link.href = '#'; // En producción: URL del PDF real
        link.download = 'certificado-ensayo-high-test.pdf';
        link.click();
    }
};

// ===========================
// GESTOR DE AUTENTICACIÓN DE CERTIFICADOS
// ===========================

const CertificatesAuthManager = {
    currentClient: null,
    storageKey: 'hightest_client',
    _initialized: false,

    /**
     * Inicializar el gestor de autenticación de certificados
     */
    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.loadClientFromStorage();
        this.updateClientUI();
        this.setupModalControls();
    },

    /**
     * Cargar cliente desde localStorage
     */
    loadClientFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.currentClient = JSON.parse(stored);
        }
    },

    /**
     * Actualizar UI del cliente autenticado
     */
    updateClientUI() {
        const certificatesBtn = document.getElementById('certificatesBtn');

        if (this.currentClient) {
            // En la página de inicio no mostramos datos del cliente,
            // sólo mantenemos el botón genérico y redirigimos a
            // client-portal.html cuando ya está autenticado.
            if (certificatesBtn) {
                certificatesBtn.innerHTML = '📄 Portal Clientes<br><span class="header__cta-sub">Certificados</span>';
                certificatesBtn.style.backgroundColor = '';
                certificatesBtn.style.color = '';
            }
        } else {
            if (certificatesBtn) {
                certificatesBtn.innerHTML = '📄 Portal Clientes<br><span class="header__cta-sub">Certificados</span>';
                certificatesBtn.style.backgroundColor = '';
                certificatesBtn.style.color = '';
            }
        }
    },

    /**
     * Controladores y modal
     */
    setupModalControls() {
        const certificatesBtn = document.getElementById('certificatesBtn');
        const certificatesModal = document.getElementById('certificatesModal');
        const closeBtn = document.getElementById('certificatesModalClose');
        // Buscar el formulario de certificados por varios posibles ids (compatibilidad)
        const certificatesForm = document.getElementById('certificatesForm') || document.getElementById('clientLoginForm') || document.querySelector('#certificatesModal form') || document.querySelector('.certificates-form');

        if (!certificatesBtn || !certificatesModal) {
            console.error('❌ CertificatesAuthManager: elementos de modal no encontrados');
            return;
        }

        certificatesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📌 Click en botón de certificados (fallback)');

            const storedClient = localStorage.getItem('hightest_client');
            if (storedClient) {
                window.location.href = 'client-portal.html';
                return;
            }

            this.openCertificatesModal();

            // Al abrir el modal, enfocar el campo de email si existe (soporta id clientEmail)
            setTimeout(() => {
                const modal = document.getElementById('certificatesModal');
                if (!modal) return;
                const emailInput = modal.querySelector('input[name="email"]') || modal.querySelector('#clientEmail') || document.getElementById('clientEmail') || modal.querySelector('#certificatesEmail');
                if (emailInput) emailInput.focus();
            }, 120);
        });

        // Botón de certificados en menú móvil
        const mobileCertificatesBtn = document.getElementById('mobileCertificatesBtn');
        if (mobileCertificatesBtn) {
            mobileCertificatesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📌 Click en botón de certificados móvil');

                const storedClient = localStorage.getItem('hightest_client');
                if (storedClient) {
                    window.location.href = 'client-portal.html';
                    // Cerrar menú móvil después de redireccionar
                    MobileMenu.close();
                    return;
                }

                this.openCertificatesModal();
                // Cerrar menú móvil después de abrir modal
                MobileMenu.close();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCertificatesModal());
        }

        certificatesModal.addEventListener('click', (event) => {
            if (event.target === certificatesModal) {
                this.closeCertificatesModal();
            }
        });

        if (certificatesForm) {
            console.log('📌 CertificatesAuthManager: enlazando submit del formulario de certificados', certificatesForm.id || certificatesForm.className);
            certificatesForm.addEventListener('submit', (e) => this.handleCertificatesAuth(e));
        } else {
            console.warn('⚠️ CertificatesAuthManager: no se encontró formulario de certificados para enlazar submit');
        }
    },

    /**
     * Abrir modal de certificados
     */
    openCertificatesModal() {
        console.log('🔍 Abriendo modal de certificados');
        const certificatesModal = document.getElementById('certificatesModal');
        console.log('🔍 Elemento modal encontrado:', certificatesModal);

        if (certificatesModal) {
            certificatesModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal abierto correctamente');
        } else {
            console.error('❌ No se encontró el elemento certificatesModal');
        }
    },

    /**
     * Cerrar modal de certificados
     */
    closeCertificatesModal() {
        const certificatesModal = document.getElementById('certificatesModal');
        if (certificatesModal) {
            certificatesModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Manejar autenticación de certificados
     */
    async handleCertificatesAuth(e) {
        e.preventDefault();
        const form = e.target;

        // Soporte para distintos atributos de campo: name="email" | id="clientEmail" | id="certificatesEmail"
        const emailEl = form.querySelector('input[name="email"]') || form.querySelector('#clientEmail') || document.getElementById('clientEmail') || form.querySelector('#certificatesEmail');
        const passwordEl = form.querySelector('input[name="password"]') || form.querySelector('#clientPassword') || document.getElementById('clientPassword') || form.querySelector('#certificatesPassword');

        const email = (emailEl && emailEl.value) ? emailEl.value.trim() : '';
        const password = (passwordEl && passwordEl.value) ? passwordEl.value : '';

        // Preparar feedback inline profesional
        const modal = document.getElementById('certificatesModal');
        let feedbackEl = modal && modal.querySelector('.certificates__feedback');
        if (!feedbackEl && modal) {
            feedbackEl = document.createElement('div');
            feedbackEl.className = 'certificates__feedback';
            const formParent = form.parentElement || modal;
            formParent.insertBefore(feedbackEl, form);
        }

        const setFeedback = (msg, isError = true) => {
            if (!feedbackEl) return;
            const icon = isError ? '⚠️' : '✓';
            const bgColor = isError 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.04) 100%)';
            const borderColor = isError ? '#fca5a5' : '#86efac';
            const textColor = isError ? '#7f1d1d' : '#166534';
            
            feedbackEl.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    background: ${bgColor};
                    border: 1.5px solid ${borderColor};
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: ${textColor};
                    animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                ">
                    <span style="font-size: 18px; flex-shrink: 0; display: inline-block;">${icon}</span>
                    <span>${msg}</span>
                </div>
            `;
        };

        // Inyectar animación CSS si no existe
        if (!document.getElementById('clientAuthAnimations')) {
            const style = document.createElement('style');
            style.id = 'clientAuthAnimations';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Validaciones básicas
        if (!email || !password) {
            setFeedback('Completa tu correo y tu contraseña para continuar.', true);
            return;
        }

        if (!this.isValidEmail(email)) {
            setFeedback('Escribe un correo válido, por favor.', true);
            return;
        }

        // Desactivar botón de submit y mostrar estado
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = 'Ingresando...';
        }

        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login_cliente', email, password })
            });

            const json = await resp.json().catch(() => ({}));

            if (!resp.ok || !json.ok) {
                setFeedback(json?.error || 'No pudimos validar tus datos. Revisa el correo y la contraseña e inténtalo de nuevo.', true);
                console.warn('CertificatesAuthManager login_cliente failed:', json);
                return;
            }

            // Login exitoso
            const user = json.user || {};
            this.currentClient = {
                id: user.id || Date.now(),
                name: user.name || user.nombre || user.nombre_empresa || email,
                email: user.email || email,
                company: user.company || user.nombre_empresa || null,
                loginTime: new Date().toLocaleString(),
                userType: 'client'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(this.currentClient));

            setFeedback(`Todo listo, ${this.currentClient.name}. Estamos entrando a tu portal de cliente.`, false);

            // Cerrar modal y redirigir después de pequeña pausa
            setTimeout(() => {
                this.closeCertificatesModal();
                window.location.href = 'client-portal.html';
            }, 900);
        } catch (err) {
            console.error('CertificatesAuthManager: error conectando al servidor', err);
            setFeedback('No pudimos conectar con el servidor. Intenta nuevamente en unos segundos.', true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || 'Ingresar';
            }
        }
    },

    /**
     * Mostrar vista de cliente
     */
    showClientView() {
        // Ocultar todas las vistas
        this.hideAllViews();
        
        // Mostrar vista de cliente
        const clientView = document.getElementById('clientPortal');
        if (clientView) {
            clientView.style.display = 'block';
            // Actualizar información del cliente
            this.updateClientInfo();
            // Scroll a la vista
            setTimeout(() => {
                clientView.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },

    /**
     * Ocultar todas las vistas
     */
    hideAllViews() {
        const hightestView = document.getElementById('misCertificados');
        const clientView = document.getElementById('clientPortal');
        
        if (hightestView) hightestView.style.display = 'none';
        if (clientView) clientView.style.display = 'none';
    },

    /**
     * Actualizar información del cliente en la vista
     */
    updateClientInfo() {
        if (!this.currentClient) return;

        const clientNameEl = document.getElementById('clientName');
        const clientCompanyEl = document.getElementById('clientCompany');
        const clientEmailEl = document.getElementById('clientEmail');

        if (clientNameEl) clientNameEl.textContent = this.currentClient.name;
        if (clientCompanyEl) clientCompanyEl.textContent = this.currentClient.company;
        if (clientEmailEl) clientEmailEl.textContent = this.currentClient.email;
    },

    /**
     * Logout del cliente
     */
    clientLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem(this.storageKey);
            this.currentClient = null;
            this.updateClientUI();
            this.hideAllViews();
            alert('Has cerrado sesión correctamente');
        }
    },

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

// ===========================
// GESTOR DE CERTIFICADOS
// ===========================

const CertificatesManager = {
    init() {
        console.log('🚀 Inicializando CertificatesManager');
        this.setupSearchAndFilters();
        this.setupDownloadButtons();
    },

    /**
     * Configurar búsqueda y filtros
     */
    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchCertificates');
        const filterStatus = document.getElementById('filterStatus');
        const filterType = document.getElementById('filterType');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterCertificates()));
        }
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterCertificates());
        }
        if (filterType) {
            filterType.addEventListener('change', () => this.filterCertificates());
        }
    },

    /**
     * Filtrar certificados según búsqueda y filtros
     */
    filterCertificates() {
        const grid = document.getElementById('certificatesGrid');
        if (!grid) return;

        const searchText = document.getElementById('searchCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const typeFilter = document.getElementById('filterType')?.value || '';

        const items = grid.querySelectorAll('.certificate-item');

        items.forEach(item => {
            const certId = item.dataset.certId;
            const status = item.dataset.status;
            const type = item.dataset.type;
            const title = item.querySelector('.certificate-item__title')?.textContent.toLowerCase() || '';
            const number = item.querySelector('dd')?.textContent.toLowerCase() || '';

            // Comparar búsqueda
            const matchesSearch = !searchText || 
                title.includes(searchText) || 
                certId.toLowerCase().includes(searchText) ||
                number.includes(searchText);

            // Comparar filtros
            const matchesStatus = !statusFilter || status === statusFilter;
            const matchesType = !typeFilter || type === typeFilter;

            // Mostrar u ocultar elemento
            if (matchesSearch && matchesStatus && matchesType) {
                item.style.display = 'grid';
                item.style.animation = 'fadeIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });
    },

    /**
     * Configurar botones de descarga
     */
    setupDownloadButtons() {
        const grid = document.getElementById('certificatesGrid');
        if (!grid) return;

        const downloadBtns = grid.querySelectorAll('.certificate-item__actions a.btn--primary');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const certItem = btn.closest('.certificate-item');
                const certId = certItem?.dataset.certId || 'Certificado';
                this.simulateDownload(certId);
            });
        });
    },

    /**
     * Simular descarga de PDF
     */
    simulateDownload(certId) {
        // Crear un elemento <a> temporal para simular la descarga
        const link = document.createElement('a');
        
        // Crear un contenido de ejemplo para el PDF (en producción, esto vendría del servidor)
        const pdfContent = `
            HIGH TEST SAS - REPORTE TÉCNICO
            =====================================
            Certificado: ${certId}
            Fecha de descarga: ${new Date().toLocaleDateString('es-ES')}
            
            Este es un archivo de ejemplo simulado.
            En producción, este será el PDF del reporte técnico.
            
            Detalles del ensayo:
            - Producto: [Descripción del producto]
            - Norma: [Norma aplicada]
            - Resultado: Conforme
            - Observaciones: Ninguna
            
            Generado por: Laboratorio HIGH TEST SAS
            Acreditado bajo: ISO/IEC 17025
        `;

        // Crear blob y URL
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        // Configurar y disparar descarga
        link.href = url;
        link.download = `${certId}_Reporte.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Feedback visual
        alert(`🎉 Iniciando descarga: ${certId}_Reporte.txt\n\nEn producción, se descargaría un PDF completo.`);
    }
};

// ===========================
// EJECUCIÓN
// ===========================

// Función de verificación
function verifyDOMElements() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN DEL DOM - HIGH TEST          ║');
    console.log('╚══════════════════════════════════════════════╝');
    
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const certificatesBtn = document.getElementById('certificatesBtn');
    const certificatesModal = document.getElementById('certificatesModal');
    
    console.log('✅ loginBtn:', !!loginBtn, loginBtn?.textContent);
    console.log('✅ authModal:', !!authModal);
    console.log('✅ loginForm:', !!loginForm);
    console.log('✅ registerForm:', !!registerForm);
    console.log('✅ certificatesBtn:', !!certificatesBtn, certificatesBtn?.textContent);
    console.log('✅ certificatesModal:', !!certificatesModal);
    
    const allFound = loginBtn && authModal && loginForm && registerForm && certificatesBtn;

    if (allFound) {
        console.log('✅ TODOS LOS ELEMENTOS PRINCIPALES ENCONTRADOS - Sistema listo');
    } else {
        console.error('❌ ELEMENTOS FALTANTES - Revisar HTML');
    }
}

// Fallback de botón de certificados
function bindCertificatesBtnFallback() {
    const certificatesBtn = document.getElementById('certificatesBtn');
    if (!certificatesBtn) {
        console.error('❌ bindCertificatesBtnFallback: botón no encontrado');
        return;
    }
    if (certificatesBtn.dataset.bound === 'true') return;

    certificatesBtn.dataset.bound = 'true';

    certificatesBtn.addEventListener('click', (e) => {
        console.log('🛡️ Fallback hit: certificado botón click');
        e.preventDefault();

        const storedClient = localStorage.getItem('hightest_client');
        if (storedClient) {
            console.log('➡️ Fallback: cliente logueado, redirigiendo');
            window.location.href = 'client-portal.html';
            return;
        }

        if (typeof CertificatesAuthManager !== 'undefined' && CertificatesAuthManager.openCertificatesModal) {
            CertificatesAuthManager.openCertificatesModal();
        } else {
            const certificatesModal = document.getElementById('certificatesModal');
            if (certificatesModal) {
                certificatesModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    });
}

// ===========================
// MÓDULO: AUTH CLIENTES (ClientAuth)
// ===========================

const ClientAuth = {
    formId: 'clientLoginForm',
    storageKey: 'hightest_client',

    init() {
        const form = document.getElementById(this.formId);
        if (!form) return;
        form.addEventListener('submit', (e) => this.handleLogin(e));
        console.log('🔑 ClientAuth: escuchando submit en #' + this.formId);
    },

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const emailEl = form.querySelector('input[name="email"]') || form.querySelector('#clientEmail') || document.getElementById('clientEmail');
        const passwordEl = form.querySelector('input[name="password"]') || form.querySelector('#clientPassword') || document.getElementById('clientPassword');

        const email = emailEl?.value?.trim() || '';
        const password = passwordEl?.value || '';

        // feedback inline profesional
        let feedback = form.querySelector('.client-login__feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'client-login__feedback';
            form.insertBefore(feedback, form.firstChild);
        }

        const setFeedback = (msg, isError = true) => {
            const icon = isError ? '⚠️' : '✓';
            const bgColor = isError 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.04) 100%)';
            const borderColor = isError ? '#fca5a5' : '#86efac';
            const textColor = isError ? '#7f1d1d' : '#166534';
            
            feedback.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    background: ${bgColor};
                    border: 1.5px solid ${borderColor};
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: ${textColor};
                    animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                ">
                    <span style="font-size: 18px; flex-shrink: 0; display: inline-block;">${icon}</span>
                    <span>${msg}</span>
                </div>
            `;
        };

        // Inyectar animación CSS si no existe
        if (!document.getElementById('clientAuthAnimations')) {
            const style = document.createElement('style');
            style.id = 'clientAuthAnimations';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        

        if (!email || !password) {
            setFeedback('Completa tu correo y tu contraseña para continuar.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFeedback('Escribe un correo válido, por favor.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.orig = submitBtn.textContent;
            submitBtn.textContent = 'Ingresando…';
        }

        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login_cliente', email, password })
            });

            const data = await resp.json().catch(() => ({}));

            if (!resp.ok || !data.ok) {
                setFeedback(data?.error || 'No pudimos validar tus datos. Revisa el correo y la contraseña e inténtalo de nuevo.');
                console.warn('ClientAuth failed', data);
                return;
            }

            const user = data.user || {};
            const client = {
                id: user.id || Date.now(),
                name: user.name || user.nombre || user.nombre_empresa || email,
                email: user.email || email,
                company: user.company || user.nombre_empresa || null,
                loginTime: new Date().toLocaleString()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(client));
            setFeedback(`Todo listo, ${client.name}. Estamos entrando a tu portal de cliente.`, false);

            setTimeout(() => {
                window.location.href = 'client-portal.html';
            }, 800);
        } catch (err) {
            console.error('ClientAuth error:', err);
            setFeedback('No pudimos conectar con el servidor. Intenta nuevamente en unos segundos.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.orig || 'Ingresar';
            }
        }
    }
};

// ===========================
// GESTOR DEL PANEL ADMINISTRATIVO
// ===========================

const AdminPanelManager = {
    currentUser: null,
    certificates: [],
    clientsCatalog: [],
    processSequence: 5,
    currentViewTab: 'acreditados',
    currentCertificateTypeTab: 'acreditado',

    init() {
        this.loadUserFromStorage();
        if (!this.currentUser) {
            // Si no hay usuario, redirigir al home
            window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        this.loadMockData();
        this.setupEventListeners();
        this.setupClientsManagement();
        this.setupAdminTabs();
        this.applyAdminTabState('acreditados', false);
        this.updateStats();
        this.renderReportInsights();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupUI() {
        // Actualizar nombre de usuario desde tabla de usuarios
        const userNameEl = document.getElementById('adminUserName');
        if (userNameEl) {
            this.fetchAndDisplayUserName(userNameEl);
        }
    },

    async fetchAndDisplayUserName(userNameEl) {
        const currentUser = this.currentUser || {};
        const email = (currentUser.email || '').trim().toLowerCase();

        if (!email) {
            userNameEl.textContent = this.getAdminDisplayName();
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_user_nombre',
                    email: email
                })
            });

            const result = await response.json();
            
            if (result.ok && result.nombre) {
                userNameEl.textContent = result.nombre.trim();
            } else {
                userNameEl.textContent = this.getAdminDisplayName();
            }
        } catch (error) {
            console.error('Error fetching user name from table:', error);
            userNameEl.textContent = this.getAdminDisplayName();
        }
    },

    getAdminDisplayName() {
        const currentUser = this.currentUser || {};
        const storedName = (currentUser.name || '').trim();
        const storedEmail = (currentUser.email || '').trim().toLowerCase();

        if (storedName && storedName !== storedEmail) {
            return storedName;
        }

        if (storedEmail === 'admin@hightest.com') {
            return 'Administrador HIGH TEST';
        }

        if (storedEmail) {
            const localPart = storedEmail.split('@')[0] || '';
            const readableName = localPart
                .replace(/[._-]+/g, ' ')
                .trim()
                .replace(/\b\w/g, (character) => character.toUpperCase());

            return readableName || 'Administrador HIGH TEST';
        }

        return 'Administrador HIGH TEST';
    },

    loadMockData() {
        // Datos simulados de certificados
        this.certificates = [
            {
                id: 'HT-R26-0001',
                client: 'Empresa 1 SAS',
                type: 'acreditado',
                status: 'recepcion',
                receptionDate: '2025-03-15',
                deliveryDate: '',
                finalizedDate: '',
                value: 2500000
            },
            {
                id: 'HT-R26-0002',
                client: 'Empresa 2 Ltda',
                type: 'no-acreditado',
                status: 'lavado',
                receptionDate: '2025-03-10',
                deliveryDate: '',
                finalizedDate: '',
                value: 1800000
            },
            {
                id: 'HT-R26-0003',
                client: 'Empresa 3 S.A.',
                type: 'acreditado',
                status: 'en-proceso-de-ensayo',
                receptionDate: '2025-03-08',
                deliveryDate: '',
                finalizedDate: '',
                value: 950000
            },
            {
                id: 'HT-R26-0004',
                client: 'Cliente Demo',
                type: 'no-acreditado',
                status: 'finalizado',
                receptionDate: '2025-03-05',
                deliveryDate: '2025-03-12',
                finalizedDate: '2025-03-14',
                value: 1200000
            }
        ];
    },

    setupEventListeners() {
        // Logout (desktop)
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Logout desde menú móvil
        const mobileLogoutBtn = document.getElementById('adminLogoutMobileBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.logout();
                // Cerrar menú móvil si está abierto
                if (typeof MobileMenu !== 'undefined') {
                    MobileMenu.close();
                }
            });
        }

        // Búsqueda y filtros - ACREDITADOS
        const searchInput = document.getElementById('adminSearchCertificates');
        const statusFilter = document.getElementById('adminFilterStatus');
        const typeFilter = document.getElementById('adminFilterType');
        const monthFilter = document.getElementById('adminFilterMonth');
        const dateFilter = document.getElementById('adminFilterDate');
        const finalizedSearchInput = document.getElementById('adminSearchFinalizedCertificates');
        const finalizedStatusFilter = document.getElementById('adminFilterFinalizedStatus');
        const finalizedTypeFilter = document.getElementById('adminFilterFinalizedType');
        const finalizedMonthFilter = document.getElementById('adminFilterFinalizedMonth');
        const finalizedDateFilter = document.getElementById('adminFilterFinalizedDate');
        const statsMonthFilter = document.getElementById('statsMonthFilter');
        const clearStatsMonthFilter = document.getElementById('clearStatsMonthFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterCertificates());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterCertificates());
        }
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterCertificates());
        }
        if (monthFilter) {
            monthFilter.addEventListener('change', () => this.filterCertificates());
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterCertificates());
        }
        if (finalizedSearchInput) {
            finalizedSearchInput.addEventListener('input', () => this.filterFinalizedCertificates());
        }
        if (finalizedStatusFilter) {
            finalizedStatusFilter.addEventListener('change', () => this.filterFinalizedCertificates());
        }
        if (finalizedTypeFilter) {
            finalizedTypeFilter.addEventListener('change', () => this.filterFinalizedCertificates());
        }
        if (finalizedMonthFilter) {
            finalizedMonthFilter.addEventListener('change', () => this.filterFinalizedCertificates());
        }
        if (finalizedDateFilter) {
            finalizedDateFilter.addEventListener('change', () => this.filterFinalizedCertificates());
        }
        if (statsMonthFilter) {
            statsMonthFilter.addEventListener('change', () => this.updateStats());
        }
        if (clearStatsMonthFilter) {
            clearStatsMonthFilter.addEventListener('click', () => {
                if (statsMonthFilter) {
                    statsMonthFilter.value = '';
                }
                this.updateStats();
            });
        }

        // Búsqueda y filtros - NO ACREDITADOS
        const searchInputNoAcreditados = document.getElementById('adminSearchCertificatesNoAcreditados');
        const statusFilterNoAcreditados = document.getElementById('adminFilterStatusNoAcreditados');
        const monthFilterNoAcreditados = document.getElementById('adminFilterMonthNoAcreditados');
        const dateFilterNoAcreditados = document.getElementById('adminFilterDateNoAcreditados');
        const finalizedSearchInputNoAcreditados = document.getElementById('adminSearchFinalizedCertificatesNoAcreditados');
        const finalizedStatusFilterNoAcreditados = document.getElementById('adminFilterFinalizedStatusNoAcreditados');
        const finalizedMonthFilterNoAcreditados = document.getElementById('adminFilterFinalizedMonthNoAcreditados');
        const finalizedDateFilterNoAcreditados = document.getElementById('adminFilterFinalizedDateNoAcreditados');
        const statsMonthFilterNoAcreditados = document.getElementById('statsMonthFilterNoAcreditados');
        const clearStatsMonthFilterNoAcreditados = document.getElementById('clearStatsMonthFilterNoAcreditados');

        if (searchInputNoAcreditados) {
            searchInputNoAcreditados.addEventListener('input', () => this.filterCertificatesNoAcreditados());
        }
        if (statusFilterNoAcreditados) {
            statusFilterNoAcreditados.addEventListener('change', () => this.filterCertificatesNoAcreditados());
        }
        if (monthFilterNoAcreditados) {
            monthFilterNoAcreditados.addEventListener('change', () => this.filterCertificatesNoAcreditados());
        }
        if (dateFilterNoAcreditados) {
            dateFilterNoAcreditados.addEventListener('change', () => this.filterCertificatesNoAcreditados());
        }
        if (finalizedSearchInputNoAcreditados) {
            finalizedSearchInputNoAcreditados.addEventListener('input', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (finalizedStatusFilterNoAcreditados) {
            finalizedStatusFilterNoAcreditados.addEventListener('change', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (finalizedMonthFilterNoAcreditados) {
            finalizedMonthFilterNoAcreditados.addEventListener('change', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (finalizedDateFilterNoAcreditados) {
            finalizedDateFilterNoAcreditados.addEventListener('change', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (statsMonthFilterNoAcreditados) {
            statsMonthFilterNoAcreditados.addEventListener('change', () => this.updateStatsNoAcreditados());
        }
        if (clearStatsMonthFilterNoAcreditados) {
            clearStatsMonthFilterNoAcreditados.addEventListener('click', () => {
                if (statsMonthFilterNoAcreditados) {
                    statsMonthFilterNoAcreditados.value = '';
                }
                this.updateStatsNoAcreditados();
            });
        }

        // Nuevo certificado
        const addCertBtn = document.getElementById('addCertificateBtn');
        if (addCertBtn) {
            addCertBtn.addEventListener('click', () => this.addNewCertificate());
        }

        const closeProcessModalBtn = document.getElementById('closeCertificateProcessModal');
        const cancelProcessModalBtn = document.getElementById('cancelCertificateProcessBtn');
        const saveProcessModalBtn = document.getElementById('saveCertificateProcessBtn');
        const processModal = document.getElementById('certificateProcessModal');

        if (closeProcessModalBtn) {
            closeProcessModalBtn.addEventListener('click', () => this.closeCertificateProcessModal());
        }
        if (cancelProcessModalBtn) {
            cancelProcessModalBtn.addEventListener('click', () => this.closeCertificateProcessModal());
        }
        if (saveProcessModalBtn) {
            saveProcessModalBtn.addEventListener('click', () => this.saveCertificateProcessFromModal());
        }
        if (processModal) {
            processModal.addEventListener('click', (event) => {
                if (event.target === processModal) {
                    this.closeCertificateProcessModal();
                }
            });
        }

        const closeStatusModalBtn = document.getElementById('closeCertificateStatusModal');
        const cancelStatusModalBtn = document.getElementById('cancelCertificateStatusBtn');
        const saveStatusModalBtn = document.getElementById('saveCertificateStatusBtn');
        const statusModal = document.getElementById('certificateStatusModal');

        if (closeStatusModalBtn) {
            closeStatusModalBtn.addEventListener('click', () => this.closeCertificateStatusModal());
        }
        if (cancelStatusModalBtn) {
            cancelStatusModalBtn.addEventListener('click', () => this.closeCertificateStatusModal());
        }
        if (saveStatusModalBtn) {
            saveStatusModalBtn.addEventListener('click', () => this.saveCertificateStatusFromModal());
        }
        if (statusModal) {
            statusModal.addEventListener('click', (event) => {
                if (event.target === statusModal) {
                    this.closeCertificateStatusModal();
                }
            });
        }

        this.renderCertificates();
    },

    setupAdminTabs() {
        const tabButtons = document.querySelectorAll('[data-admin-tab]');
        tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.applyAdminTabState(button.dataset.adminTab || 'acreditados');
            });
        });
    },

    applyAdminTabState(tabName, shouldScroll = true) {
        this.currentViewTab = tabName;

        const tabButtons = document.querySelectorAll('[data-admin-tab]');
        tabButtons.forEach((button) => {
            const isActive = button.dataset.adminTab === tabName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Obtener referencias a todas las secciones
        const certificatesSection = document.getElementById('certificates');
        const certificatesNoAcreditadosSection = document.getElementById('certificates-no-acreditados');
        const clientsSection = document.getElementById('clients');
        const statsSection = document.querySelector('.admin-stats-wrapper');
        const quickLinkSection = document.querySelector('.admin-quick-link');
        const reportsAcreditadosSection = document.getElementById('reports-acreditados');
        const reportsNoAcreditadosSection = document.getElementById('reports-no-acreditados');

        // Ocultar todas las secciones por defecto
        certificatesSection?.classList.add('is-hidden');
        certificatesNoAcreditadosSection?.classList.add('is-hidden');
        clientsSection?.classList.add('is-hidden');
        statsSection?.classList.add('is-hidden');
        reportsAcreditadosSection?.classList.add('is-hidden');
        reportsNoAcreditadosSection?.classList.add('is-hidden');
        quickLinkSection?.classList.add('is-hidden');

        // Mostrar solo lo necesario según la pestaña
        if (tabName === 'acreditados') {
            quickLinkSection?.classList.remove('is-hidden');
            statsSection?.classList.remove('is-hidden');
            reportsAcreditadosSection?.classList.remove('is-hidden');
            certificatesSection?.classList.remove('is-hidden');
            if (shouldScroll) {
                quickLinkSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            this.renderCertificates();
            this.updateStats();
            this.renderMonthlySummary();
        } else if (tabName === 'no-acreditados') {
            quickLinkSection?.classList.remove('is-hidden');
            reportsNoAcreditadosSection?.classList.remove('is-hidden');
            certificatesNoAcreditadosSection?.classList.remove('is-hidden');
            if (shouldScroll) {
                quickLinkSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
            this.renderMonthlySummaryNoAcreditados();
        } else if (tabName === 'clientes') {
            clientsSection?.classList.remove('is-hidden');
            if (shouldScroll) {
                clientsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },

    renderCertificates() {
        this.filterCertificates();
        this.filterFinalizedCertificates();
    },

    filterCertificates() {
        const searchTerm = document.getElementById('adminSearchCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterStatus')?.value || '';
        const typeFilter = document.getElementById('adminFilterType')?.value || '';
        const dateFilter = document.getElementById('adminFilterDate')?.value || '';
        const monthFilter = document.getElementById('adminFilterMonth')?.value || '';
        const tabType = this.currentCertificateTypeTab || '';

        const filtered = this.certificates.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm) ||
                this.getTypeText(cert.type).toLowerCase().includes(searchTerm);

            const matchesTabType = !tabType || cert.type === tabType;
            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesType = !typeFilter || cert.type === typeFilter;
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesSearch && matchesTabType && matchesStatus && matchesType && matchesDate && matchesMonth;
        });

        this.renderFilteredCertificates(filtered);
    },

    filterFinalizedCertificates() {
        const searchTerm = document.getElementById('adminSearchFinalizedCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterFinalizedStatus')?.value || '';
        const typeFilter = document.getElementById('adminFilterFinalizedType')?.value || '';
        const dateFilter = document.getElementById('adminFilterFinalizedDate')?.value || '';
        const monthFilter = document.getElementById('adminFilterFinalizedMonth')?.value || '';
        const tabType = this.currentCertificateTypeTab || '';

        const finalized = this.certificates.filter(cert => cert.status === 'finalizado');

        const filtered = finalized.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm) ||
                this.getTypeText(cert.type).toLowerCase().includes(searchTerm);

            const matchesTabType = !tabType || cert.type === tabType;
            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesType = !typeFilter || cert.type === typeFilter;
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesSearch && matchesTabType && matchesStatus && matchesType && matchesDate && matchesMonth;
        });

        this.renderFinalizedCertificates(filtered);
    },

    renderFilteredCertificates(filteredCerts) {
        const activeTbody = document.getElementById('certificatesTableBody');
        if (!activeTbody) return;

        activeTbody.innerHTML = '';

        const activeCerts = filteredCerts.filter(cert => cert.status !== 'finalizado');

        if (!activeCerts.length) {
            activeTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes activos</td></tr>';
        }

        activeCerts.forEach(cert => {
            activeTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    renderFinalizedCertificates(filteredCerts) {
        const finalizedTbody = document.getElementById('finalizedCertificatesTableBody');
        if (!finalizedTbody) return;

        finalizedTbody.innerHTML = '';

        if (!filteredCerts.length) {
            finalizedTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes finalizados</td></tr>';
            return;
        }

        filteredCerts.forEach(cert => {
            finalizedTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    buildCertificateRow(cert) {
        const row = document.createElement('tr');

        const statusClass = `status--${cert.status}`;
        const statusText = this.getStatusText(cert.status);
        const typeText = this.getTypeText(cert.type);

        row.innerHTML = `
            <td>${cert.id}</td>
            <td>${cert.client}</td>
            <td>${typeText}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
                <button class="btn btn--small btn--outline" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem;" onclick="AdminPanelManager.editCertificateStatus('${cert.id}')" title="Editar estado">✏️</button>
            </td>
            <td>${this.formatDate(cert.receptionDate)}</td>
            <td>${this.formatDate(cert.deliveryDate)}</td>
            <td>${this.formatDate(cert.finalizedDate)}</td>
            <td>
                <button class="btn btn--small btn--outline" style="padding: 0.25rem 0.5rem;" onclick="AdminPanelManager.editCertificate('${cert.id}')" title="Editar proceso">✏️</button>
                <button class="btn btn--small btn--error" style="padding: 0.25rem 0.5rem;" onclick="AdminPanelManager.deleteCertificate('${cert.id}')" title="Eliminar">🗑️</button>
            </td>
        `;

        return row;
    },

    getCertificateStatusOptions(currentStatus) {
        const statuses = [
            'recepcion',
            'lavado',
            'en-proceso-de-ensayo',
            'entrega-cliente',
            'informe-de-ensayo',
            'finalizado'
        ];

        return statuses.map((status) => {
            const selected = status === currentStatus ? 'selected' : '';
            return `<option value="${status}" ${selected}>${this.getStatusText(status)}</option>`;
        }).join('');
    },

    changeCertificateStatus(certId, newStatus) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        cert.status = newStatus;

        if (!cert.receptionDate) {
            cert.receptionDate = this.getTodayISO();
        }

        if (newStatus === 'entrega-cliente' && !cert.deliveryDate) {
            cert.deliveryDate = this.getTodayISO();
        }

        if (newStatus === 'finalizado' && !cert.finalizedDate) {
            cert.finalizedDate = this.getTodayISO();
        }

        // Renderizar correctamente según el tipo de certificado
        if (cert.type === 'acreditado') {
            this.renderCertificates();
            this.updateStats();
        } else if (cert.type === 'no-acreditado') {
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
        }
    },

    editCertificate(certId) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        this.populateCertificateClientOptions(cert.client);

        const title = document.getElementById('certificateProcessModalTitle');
        const editId = document.getElementById('processEditId');
        const processNumber = document.getElementById('processNumber');
        const client = document.getElementById('processClientSelect');
        const type = document.getElementById('processTypeSelect');
        const status = document.getElementById('processStatusSelect');
        const receptionDate = document.getElementById('processReceptionDate');
        const deliveryDate = document.getElementById('processDeliveryDate');
        const finalizedDate = document.getElementById('processFinalizedDate');

        if (!title || !editId || !processNumber || !client || !type || !status || !receptionDate || !deliveryDate || !finalizedDate) return;

        title.textContent = `Editar Proceso ${cert.id}`;
        editId.value = cert.id;
        processNumber.value = cert.id;
        client.value = cert.client;
        type.value = cert.type;
        status.value = cert.status;
        receptionDate.value = cert.receptionDate || '';
        deliveryDate.value = cert.deliveryDate || '';
        finalizedDate.value = cert.finalizedDate || '';

        this.openCertificateProcessModal();
    },

    editCertificateStatus(certId) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        const editId = document.getElementById('statusEditId');
        const processCode = document.getElementById('statusProcessCode');
        const status = document.getElementById('statusProcessSelect');
        if (!editId || !processCode || !status) return;

        editId.value = cert.id;
        processCode.value = `${cert.id} - ${cert.client}`;
        status.value = cert.status;

        this.openCertificateStatusModal();
    },

    deleteCertificate(certId) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        if (!confirm(`¿Eliminar el informe ${cert.id} de ${cert.client}?`)) {
            return;
        }

        this.certificates = this.certificates.filter((item) => item.id !== certId);
        // Renderizar correctamente según el tipo de certificado eliminado
        if (cert.type === 'acreditado') {
            this.renderCertificates();
            this.updateStats();
        } else if (cert.type === 'no-acreditado') {
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
        }
    },

    updateStats() {
        const statsMonthFilter = document.getElementById('statsMonthFilter');
        const statsPeriodLabel = document.getElementById('statsPeriodLabel');
        const monthFilter = statsMonthFilter?.value || '';
        const tabType = this.currentCertificateTypeTab || '';
        const scopedCertificates = monthFilter
            ? this.certificates.filter((cert) => (
                (!tabType || cert.type === tabType) && (
                    (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                    (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                    (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
                )
            ))
            : this.certificates.filter((cert) => !tabType || cert.type === tabType);

        const total = scopedCertificates.length;
        const completed = scopedCertificates.filter(c => c.status === 'finalizado').length;
        const pending = scopedCertificates.filter(c => c.status !== 'finalizado').length;

        const totalEl = document.getElementById('statTotalCerts');
        const completedEl = document.getElementById('statCompletedCerts');
        const pendingEl = document.getElementById('statPendingCerts');

        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;

        if (statsPeriodLabel) {
            statsPeriodLabel.textContent = monthFilter
                ? `Mostrando resumen de ${monthFilter}`
                : 'Mostrando totales generales';
        }

        this.renderReportInsights();
    },

    renderReportInsights() {
        this.renderMonthlySummary();
        this.renderKanbanBoard();
    },

    renderMonthlySummary() {
        const container = document.getElementById('monthlySummaryListAcreditados');
        if (!container) return;
        const tabType = this.currentCertificateTypeTab || '';

        const monthsMap = new Map();
        this.certificates.filter((cert) => cert.type === 'acreditado').forEach((cert) => {
            const baseDate = cert.receptionDate || cert.deliveryDate || cert.finalizedDate;
            if (!baseDate) return;
            const monthKey = baseDate.slice(0, 7);
            if (!monthsMap.has(monthKey)) {
                monthsMap.set(monthKey, { total: 0, completed: 0, pending: 0 });
            }
            const bucket = monthsMap.get(monthKey);
            bucket.total += 1;
            if (cert.status === 'finalizado') {
                bucket.completed += 1;
            } else {
                bucket.pending += 1;
            }
        });

        const entries = Array.from(monthsMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6);

        if (!entries.length) {
            container.innerHTML = '<div class="monthly-summary-item">No hay datos suficientes para mostrar resumen por mes.</div>';
            return;
        }

        const maxTotal = Math.max(...entries.map(([, data]) => data.total), 1);
        const monthNames = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio',
            '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };

        container.innerHTML = entries.map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-');
            const label = `${monthNames[month] || month} ${year}`;
            const percent = Math.max(8, Math.round((data.total / maxTotal) * 100));

            return `
                <div class="monthly-summary-item">
                    <div class="monthly-summary-item__top">
                        <div class="monthly-summary-item__month">${label}</div>
                        <div class="monthly-summary-item__count">${data.total}</div>
                    </div>
                    <div class="monthly-summary-item__bar">
                        <div class="monthly-summary-item__bar-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="monthly-summary-item__meta">
                        <span>Finalizados: ${data.completed}</span>
                        <span>Pendientes: ${data.pending}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderMonthlySummaryNoAcreditados() {
        const container = document.getElementById('monthlySummaryListNoAcreditados');
        if (!container) return;

        const monthsMap = new Map();
        this.certificates.filter((cert) => cert.type === 'no-acreditado').forEach((cert) => {
            const baseDate = cert.receptionDate || cert.deliveryDate || cert.finalizedDate;
            if (!baseDate) return;
            const monthKey = baseDate.slice(0, 7);
            if (!monthsMap.has(monthKey)) {
                monthsMap.set(monthKey, { total: 0, completed: 0, pending: 0 });
            }
            const bucket = monthsMap.get(monthKey);
            bucket.total += 1;
            if (cert.status === 'finalizado') {
                bucket.completed += 1;
            } else {
                bucket.pending += 1;
            }
        });

        const entries = Array.from(monthsMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6);

        if (!entries.length) {
            container.innerHTML = '<div class="monthly-summary-item">No hay datos suficientes para mostrar resumen por mes.</div>';
            return;
        }

        const maxTotal = Math.max(...entries.map(([, data]) => data.total), 1);
        const monthNames = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio',
            '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };

        container.innerHTML = entries.map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-');
            const label = `${monthNames[month] || month} ${year}`;
            const percent = Math.max(8, Math.round((data.total / maxTotal) * 100));

            return `
                <div class="monthly-summary-item">
                    <div class="monthly-summary-item__top">
                        <div class="monthly-summary-item__month">${label}</div>
                        <div class="monthly-summary-item__count">${data.total}</div>
                    </div>
                    <div class="monthly-summary-item__bar">
                        <div class="monthly-summary-item__bar-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="monthly-summary-item__meta">
                        <span>Finalizados: ${data.completed}</span>
                        <span>Pendientes: ${data.pending}</span>
                    </div>
                </div>
            `;
        }).join('');
    },
    renderKanbanBoard() {
        const container = document.getElementById('kanbanBoard');
        if (!container) return;
        const tabType = this.currentCertificateTypeTab || '';

        const columns = [
            { key: 'recepcion', title: 'Recepción' },
            { key: 'lavado', title: 'Lavado' },
            { key: 'en-proceso-de-ensayo', title: 'En proceso' },
            { key: 'entrega-cliente', title: 'Entrega cliente' },
            { key: 'informe-de-ensayo', title: 'Informe' },
            { key: 'finalizado', title: 'Finalizado' }
        ];

        container.innerHTML = columns.map((column) => {
            const items = this.certificates.filter((cert) => cert.status === column.key && (!tabType || cert.type === tabType));
            return `
                <div class="kanban-column">
                    <div class="kanban-column__header">
                        <div class="kanban-column__title">${column.title}</div>
                        <div class="kanban-column__count">${items.length}</div>
                    </div>
                    <div class="kanban-cards">
                        ${items.length ? items.map((cert) => `
                            <div class="kanban-card">
                                <div class="kanban-card__id">${cert.id}</div>
                                <div class="kanban-card__client">${cert.client}</div>
                                <div class="kanban-card__meta">
                                    <span>${this.getTypeText(cert.type)}</span>
                                    <span>${this.formatDate(cert.receptionDate)}</span>
                                </div>
                            </div>
                        `).join('') : '<div class="kanban-card"><div class="kanban-card__client">Sin procesos</div></div>'}
                    </div>
                </div>
            `;
        }).join('');
    },

    getStatusText(status) {
        const statusMap = {
            'recepcion': 'Recepción',
            'lavado': 'Lavado',
            'en-proceso-de-ensayo': 'Proceso de ensayo',
            'entrega-cliente': 'Entrega cliente',
            'informe-de-ensayo': 'Informe',
            'finalizado': 'Finalizado'
        };
        return statusMap[status] || status;
    },

    getTypeText(type) {
        const typeMap = {
            'acreditado': 'Acreditado',
			'no-acreditado': 'No acreditado'
        };
        return typeMap[type] || type;
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toISOString().split('T')[0];
    },

    getTodayISO() {
        return new Date().toISOString().split('T')[0];
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    },

    viewCertificate(certId) {
        alert(`Viendo detalles del certificado ${certId}`);
    },

    downloadCertificate(certId) {
        alert(`Descargando certificado ${certId}...`);
    },

    addNewCertificate() {
        const title = document.getElementById('certificateProcessModalTitle');
        const editId = document.getElementById('processEditId');
        const processNumber = document.getElementById('processNumber');
        const client = document.getElementById('processClientSelect');
        const type = document.getElementById('processTypeSelect');
        const status = document.getElementById('processStatusSelect');
        const receptionDate = document.getElementById('processReceptionDate');
        const deliveryDate = document.getElementById('processDeliveryDate');
        const finalizedDate = document.getElementById('processFinalizedDate');

        if (!title || !editId || !processNumber || !client || !type || !status || !receptionDate || !deliveryDate || !finalizedDate) return;

        this.populateCertificateClientOptions('');

        title.textContent = 'Nuevo Proceso';
        editId.value = '';
        processNumber.value = this.generateProcessId();
        client.value = '';
        type.value = 'acreditado';
        status.value = 'recepcion';
        receptionDate.value = this.getTodayISO();
        deliveryDate.value = '';
        finalizedDate.value = '';

        this.openCertificateProcessModal();
    },

    saveCertificateProcessFromModal() {
        const editId = document.getElementById('processEditId');
        const processNumber = document.getElementById('processNumber');
        const client = document.getElementById('processClientSelect');
        const type = document.getElementById('processTypeSelect');
        const status = document.getElementById('processStatusSelect');
        const receptionDate = document.getElementById('processReceptionDate');
        const deliveryDate = document.getElementById('processDeliveryDate');
        const finalizedDate = document.getElementById('processFinalizedDate');

        if (!editId || !processNumber || !client || !type || !status || !receptionDate || !deliveryDate || !finalizedDate) return;

        // Normalizar el valor del tipo
        const normalizedType = (type.value || '').trim().toLowerCase();
        
        // Validar que el tipo sea uno de los valores permitidos
        if (!normalizedType || !['acreditado', 'no-acreditado'].includes(normalizedType)) {
            alert('El campo "# Informe" debe ser "acreditado" o "no-acreditado"');
            type.focus();
            return;
        }

        if (!processNumber.value || !client.value || !status.value || !receptionDate.value) {
            alert('Completa los campos obligatorios: # Proceso, Cliente, # Informe, Estado y Fecha Recepción.');
            return;
        }

        const payload = {
            client: client.value,
            type: normalizedType,
            status: status.value,
            receptionDate: receptionDate.value,
            deliveryDate: deliveryDate.value,
            finalizedDate: finalizedDate.value
        };

        if (editId.value) {
            const cert = this.certificates.find((item) => item.id === editId.value);
            if (!cert) return;
            cert.id = processNumber.value;
            Object.assign(cert, payload);
            this.changeCertificateStatus(cert.id, payload.status);
        } else {
            const processNum = processNumber.value;
            this.certificates.unshift({ id: processNum, ...payload, value: 0 });
            this.changeCertificateStatus(processNum, payload.status);
        }

        this.closeCertificateProcessModal();
        // Renderizar correctamente según el tipo de certificado
        if (normalizedType === 'acreditado') {
            this.renderCertificates();
            this.updateStats();
            this.renderMonthlySummary();
        } else if (normalizedType === 'no-acreditado') {
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
            this.renderMonthlySummaryNoAcreditados();
        }
    },

    saveCertificateStatusFromModal() {
        const editId = document.getElementById('statusEditId');
        const status = document.getElementById('statusProcessSelect');
        if (!editId || !status || !editId.value) return;

        this.changeCertificateStatus(editId.value, status.value);
        this.closeCertificateStatusModal();
    },

    openCertificateProcessModal() {
        const modal = document.getElementById('certificateProcessModal');
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeCertificateProcessModal() {
        const modal = document.getElementById('certificateProcessModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    openCertificateStatusModal() {
        const modal = document.getElementById('certificateStatusModal');
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeCertificateStatusModal() {
        const modal = document.getElementById('certificateStatusModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    populateCertificateClientOptions(selectedValue) {
        const select = document.getElementById('processClientSelect');
        if (!select) return;

        const clients = this.clientsCatalog || [];
        const normalized = new Set();
        const uniqueClients = [];
        clients.forEach((item) => {
            const name = (item && item.nombre_empresa ? String(item.nombre_empresa).trim() : '');
            if (!name) return;
            const key = name.toUpperCase();
            if (normalized.has(key)) return;
            normalized.add(key);
            uniqueClients.push(name);
        });

        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        uniqueClients.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        if (selectedValue) {
            const hasOption = Array.from(select.options).some((option) => option.value === selectedValue);
            if (!hasOption) {
                const customOption = document.createElement('option');
                customOption.value = selectedValue;
                customOption.textContent = selectedValue;
                select.appendChild(customOption);
            }
            select.value = selectedValue;
        }
    },

    generateProcessId() {
        const lastId = this.certificates[0]?.id || 'HT-R26-0000';
        const match = lastId.match(/HT-R26-(\d{4})/);
        const lastNum = match ? parseInt(match[1], 10) : 0;
        const nextNum = String(lastNum + 1).padStart(4, '0');
        return `HT-R26-${nextNum}`;
    },

    // ===========================
    // GESTIÓN DE CLIENTES
    // ===========================

    setupClientsManagement() {
        const addClientBtn = document.getElementById('addClientBtn');
        const closeClientModalBtn = document.getElementById('closeClientModal');
        const cancelClientModalBtn = document.getElementById('cancelClientModalBtn');
        const saveClientModalBtn = document.getElementById('saveClientModalBtn');
        const clientModal = document.getElementById('clientModal');
        const clientModalTitle = document.getElementById('clientModalTitle');
        const clientEditId = document.getElementById('clientEditId');
        const clientForm = document.getElementById('clientForm');
        const searchInput = document.getElementById('clientSearchInput');

        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                if (clientModalTitle) clientModalTitle.textContent = 'Nuevo Cliente';
                if (clientEditId) clientEditId.value = '';
                if (clientForm) clientForm.reset();
                this.openClientModal();
            });
        }

        if (closeClientModalBtn) {
            closeClientModalBtn.addEventListener('click', () => this.closeClientModal());
        }

        if (cancelClientModalBtn) {
            cancelClientModalBtn.addEventListener('click', () => this.closeClientModal());
        }

        if (saveClientModalBtn) {
            saveClientModalBtn.addEventListener('click', async () => {
                await this.saveClient();
            });
        }

        if (clientModal) {
            clientModal.addEventListener('click', (event) => {
                if (event.target === clientModal) {
                    this.closeClientModal();
                }
            });
        }

        if (clientForm) {
            clientForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveClient();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterClientesTable(searchInput.value.toLowerCase());
            });
        }

        this.loadClientes();
    },

    async loadClientes() {
        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_clientes' })
            });

            const result = await response.json();
            
            if (result.ok && result.clientes) {
                this.clientsCatalog = result.clientes;
                this.populateCertificateClientOptions('');
                this.renderClientesTable(result.clientes);
            } else {
                console.error('❌ Error en respuesta:', result);
            }
        } catch (error) {
            console.error('❌ Error loading clientes:', error);
        }
    },

    renderClientesTable(clientes) {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        if (!Array.isArray(clientes) || clientes.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="5" style="text-align: center; padding: 2rem;">ℹ️ No hay clientes registrados</td></tr>';
            return;
        }

        const escapeHtml = (s) => {
            if (s === null || s === undefined) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        tbody.innerHTML = clientes.map((cliente, idx) => {
            const createdRaw = cliente.created_at || cliente.createdAt || '';
            let fecha = '';
            try {
                if (createdRaw) {
                    if (typeof createdRaw === 'string' && createdRaw.includes('T')) {
                        fecha = createdRaw.split('T')[0];
                    } else {
                        fecha = new Date(createdRaw).toISOString().split('T')[0];
                    }
                }
            } catch (e) {
                fecha = '';
            }

            const nombreEsc = escapeHtml(cliente.nombre_empresa);
            const emailEsc = escapeHtml(cliente.email);
            const pwd = cliente.password ? String(cliente.password) : '';
            const pwdEsc = escapeHtml(pwd);
            const idEsc = escapeHtml(cliente.id);

            // Escapes para pasar en onclick (single-quoted)
            const escForOnclick = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            return `
            <tr>
                <td><strong>${nombreEsc}</strong></td>
                <td>${emailEsc}</td>
                <td>
                    <div class="password-cell">
                        <span class="password-mask" data-password="${pwdEsc}">${pwd ? '*'.repeat(Math.max(6, pwd.length)) : ''}</span>
                        <button type="button" class="password-toggle-small" onclick="AdminPanelManager.toggleTablePasswordVisibility(this)" title="Ver contraseña">👁️</button>
                    </div>
                </td>
                <td>${fecha}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn--small btn--outline" onclick="AdminPanelManager.editCliente('${escForOnclick(idEsc)}', '${escForOnclick(cliente.nombre_empresa)}', '${escForOnclick(cliente.email)}', '${escForOnclick(pwd)}')">✏️</button>
                        <button class="btn btn--small btn--error" onclick="AdminPanelManager.deleteCliente('${escForOnclick(idEsc)}', '${escForOnclick(cliente.nombre_empresa)}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    },

    filterClientesTable(searchTerm) {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.classList.contains('empty-state'));
        let visibleCount = 0;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let matches = false;

            // Buscar en todas las celdas (empresa, email, contraseña, fecha)
            cells.forEach(cell => {
                const text = cell.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    matches = true;
                }
            });

            if (searchTerm === '' || matches) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Mostrar/ocultar mensaje de no hay resultados
        let emptyRow = tbody.querySelector('.empty-state');
        if (visibleCount === 0 && searchTerm !== '') {
            if (!emptyRow) {
                emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-state';
                emptyRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 2rem;">❌ No se encontraron clientes que coincidan con la búsqueda</td>';
                tbody.appendChild(emptyRow);
            } else {
                emptyRow.style.display = '';
                emptyRow.querySelector('td').textContent = '❌ No se encontraron clientes que coincidan con la búsqueda';
            }
        } else if (visibleCount === 0 && searchTerm === '') {
            if (emptyRow) {
                emptyRow.style.display = '';
                emptyRow.querySelector('td').textContent = 'ℹ️ No hay clientes registrados';
            }
        } else if (emptyRow) {
            emptyRow.style.display = 'none';
        }
    },

    async saveClient() {
        const editId = document.getElementById('clientEditId')?.value || '';
        let nombre = document.getElementById('clientNombre').value.trim().toUpperCase();
        let email = document.getElementById('clientEmail').value.trim().toLowerCase();
        const password = document.getElementById('clientPassword').value;

        if (!nombre || !email || !password) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            const action = editId ? 'update_cliente' : 'add_cliente';
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editId || undefined,
                    nombre_empresa: nombre,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (result.ok) {
                alert(editId ? '✅ Cliente actualizado exitosamente' : '✅ Cliente agregado exitosamente');
                document.getElementById('clientForm').reset();
                const clientEditIdField = document.getElementById('clientEditId');
                if (clientEditIdField) clientEditIdField.value = '';
                this.closeClientModal();
                await this.loadClientes();
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar el cliente');
        }
    },

    editCliente(id, nombre, email, password) {
        const title = document.getElementById('clientModalTitle');
        const editId = document.getElementById('clientEditId');
        const nombreInput = document.getElementById('clientNombre');
        const emailInput = document.getElementById('clientEmail');
        const passwordInput = document.getElementById('clientPassword');

        if (!title || !editId || !nombreInput || !emailInput || !passwordInput) return;

        title.textContent = 'Editar Cliente';
        editId.value = id;
        nombreInput.value = String(nombre || '').toUpperCase();
        emailInput.value = String(email || '').toLowerCase();
        passwordInput.value = String(password || '');

        this.openClientModal();
    },

    openClientModal() {
        const modal = document.getElementById('clientModal');
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeClientModal() {
        const modal = document.getElementById('clientModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    async updateCliente(id, nombre, email, password) {
        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_cliente',
                    id: id,
                    nombre_empresa: nombre,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (result.ok) {
                alert('✅ Cliente actualizado exitosamente');
                await this.loadClientes();
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Error al actualizar el cliente');
        }
    },

    deleteCliente(id, nombre) {
        if (!confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) {
            return;
        }

        this.executeDeleteCliente(id);
    },

    async executeDeleteCliente(id) {
        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_cliente',
                    id: id
                })
            });

            const result = await response.json();

            if (result.ok) {
                alert('✅ Cliente eliminado exitosamente');
                await this.loadClientes();
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Error al eliminar el cliente');
        }
    },

    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        if (field.type === 'password') {
            field.type = 'text';
        } else {
            field.type = 'password';
        }
    },

    toggleTablePasswordVisibility(button) {
        const mask = button.previousElementSibling;
        if (!mask) return;

        const password = mask.dataset.password || '';
        const isVisible = mask.dataset.visible === 'true';

        if (isVisible) {
            // Cambiar a asteriscos (ocultar)
            mask.textContent = password ? '*'.repeat(Math.max(6, password.length)) : '';
            mask.dataset.visible = 'false';
            button.textContent = '👁️';
            button.title = 'Ver contraseña';
            return;
        }

        // Cambiar a visible
        mask.textContent = password;
        mask.dataset.visible = 'true';
        button.textContent = '🙈';
        button.title = 'Ocultar contraseña';
    },

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('hightest_user');
            window.location.href = 'index.html';
        }
    },

    // ========== MÉTODOS PARA VISTA NO ACREDITADOS ==========

    renderCertificatesNoAcreditados() {
        this.filterCertificatesNoAcreditados();
        this.filterFinalizedCertificatesNoAcreditados();
    },

    filterCertificatesNoAcreditados() {
        const searchTerm = document.getElementById('adminSearchCertificatesNoAcreditados')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterStatusNoAcreditados')?.value || '';
        const monthFilter = document.getElementById('adminFilterMonthNoAcreditados')?.value || '';
        const dateFilter = document.getElementById('adminFilterDateNoAcreditados')?.value || '';

        const filtered = this.certificates.filter(cert => {
            const matchesType = cert.type === 'no-acreditado';
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesType && matchesSearch && matchesStatus && matchesDate && matchesMonth;
        });

        this.renderFilteredCertificatesNoAcreditados(filtered);
    },

    filterFinalizedCertificatesNoAcreditados() {
        const searchTerm = document.getElementById('adminSearchFinalizedCertificatesNoAcreditados')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterFinalizedStatusNoAcreditados')?.value || '';
        const monthFilter = document.getElementById('adminFilterFinalizedMonthNoAcreditados')?.value || '';
        const dateFilter = document.getElementById('adminFilterFinalizedDateNoAcreditados')?.value || '';

        const finalized = this.certificates.filter(cert => cert.type === 'no-acreditado' && cert.status === 'finalizado');

        const filtered = finalized.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesSearch && matchesStatus && matchesDate && matchesMonth;
        });

        this.renderFinalizedCertificatesNoAcreditados(filtered);
    },

    renderFilteredCertificatesNoAcreditados(filteredCerts) {
        const activeTbody = document.getElementById('certificatesTableBodyNoAcreditados');
        if (!activeTbody) return;

        activeTbody.innerHTML = '';

        const activeCerts = filteredCerts.filter(cert => cert.status !== 'finalizado');

        if (!activeCerts.length) {
            activeTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes activos</td></tr>';
            return;
        }

        activeCerts.forEach(cert => {
            activeTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    renderFinalizedCertificatesNoAcreditados(filteredCerts) {
        const finalizedTbody = document.getElementById('finalizedCertificatesTableBodyNoAcreditados');
        if (!finalizedTbody) return;

        finalizedTbody.innerHTML = '';

        if (!filteredCerts.length) {
            finalizedTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes finalizados</td></tr>';
            return;
        }

        filteredCerts.forEach(cert => {
            finalizedTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    updateStatsNoAcreditados() {
        const statsMonthFilter = document.getElementById('statsMonthFilterNoAcreditados');
        const statsPeriodLabel = document.getElementById('statsPeriodLabelNoAcreditados');
        const monthFilter = statsMonthFilter?.value || '';
        
        const scopedCertificates = monthFilter
            ? this.certificates.filter((cert) => (
                cert.type === 'no-acreditado' && (
                    (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                    (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                    (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
                )
            ))
            : this.certificates.filter((cert) => cert.type === 'no-acreditado');

        const total = scopedCertificates.length;
        const completed = scopedCertificates.filter(c => c.status === 'finalizado').length;
        const pending = scopedCertificates.filter(c => c.status !== 'finalizado').length;

        const totalEl = document.getElementById('statTotalCertsNoAcreditados');
        const completedEl = document.getElementById('statCompletedCertsNoAcreditados');
        const pendingEl = document.getElementById('statPendingCertsNoAcreditados');

        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;

        if (statsPeriodLabel) {
            statsPeriodLabel.textContent = monthFilter
                ? `Mostrando resumen de ${monthFilter}`
                : 'Mostrando totales generales';
        }
    }
};

// ===========================
// GESTOR DEL PORTAL DE CLIENTE
// ===========================

const ClientPortalManager = {
    currentClient: null,
    certificates: [],
    requests: [],

    init() {
        this.loadClientFromStorage();
        if (!this.currentClient) {
            // Si no hay cliente, redirigir al home
			window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        this.loadMockData();
        this.setupEventListeners();
    },

    loadClientFromStorage() {
        const stored = localStorage.getItem('hightest_client');
        if (stored) {
            this.currentClient = JSON.parse(stored);
        }
    },

    setupUI() {
        // Actualizar información del cliente
        const userNameEl = document.getElementById('clientUserName');
        const userCompanyEl = document.getElementById('clientUserCompany');
        const welcomeNameEl = document.getElementById('clientWelcomeName');
        const welcomeCompanyEl = document.getElementById('clientWelcomeCompany');

        if (userNameEl) userNameEl.textContent = this.currentClient.name;
        if (userCompanyEl) userCompanyEl.textContent = this.currentClient.company;
        if (welcomeNameEl) welcomeNameEl.textContent = this.currentClient.name;
        if (welcomeCompanyEl) welcomeCompanyEl.textContent = this.currentClient.company;

        // Información de la empresa
        this.renderCompanyInfo();
    },

    loadMockData() {
        // Certificados del cliente
        this.certificates = [
            {
                id: 'HT-2025-001',
                title: 'Certificado de Ensayo Eléctrico',
                product: 'Guantes aislantes Clase 2',
                date: '2025-03-15',
                status: 'completado',
                type: 'certificado'
            },
            {
                id: 'HT-2025-002',
                title: 'Reporte Técnico Detallado',
                product: 'Herramientas aislantes',
                date: '2025-03-15',
                status: 'completado',
                type: 'reporte'
            }
        ];

        // Historial de ensayos
        this.certificates.push(
            {
                id: 'HT-2025-003',
                title: 'Ensayo dieléctrico',
                product: 'Guantes aislantes',
                date: '2025-02-10',
                status: 'completado',
                type: 'historial'
            },
            {
                id: 'HT-2025-004',
                title: 'Ensayo de fuga de corriente',
                product: 'Herramientas',
                date: '2025-01-05',
                status: 'completado',
                type: 'historial'
            }
        );

        // Solicitudes pendientes
        this.requests = [
            {
                id: 'REQ-2025-001',
				type: 'Ensayo en equipos de medición',
                status: 'en-proceso',
                date: '2025-03-01',
				description: 'Ensayo funcional de multímetro digital en banco de pruebas'
            }
        ];
    },

    setupEventListeners() {
        // Logout (desktop)
        const logoutBtn = document.getElementById('clientLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Logout desde menú móvil
        const mobileLogoutBtn = document.getElementById('clientLogoutMobileBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.logout();
                if (typeof MobileMenu !== 'undefined') {
                    MobileMenu.close();
                }
            });
        }

        this.renderCertificates();
        this.renderHistory();
        this.renderRequests();
    },

    renderCertificates() {
        const container = document.getElementById('clientCertificates');
        if (!container) return;

        const certCards = this.certificates.filter(cert => cert.type !== 'historial');

        container.innerHTML = certCards.map(cert => `
            <div class="certificate-card">
                <div class="certificate-card__icon">${cert.type === 'certificado' ? '🎖️' : '📄'}</div>
                <div class="certificate-card__content">
                    <h3>${cert.title}</h3>
                    <p>${cert.product}</p>
                    <div class="certificate-card__meta">
                        <span class="meta__date">📅 ${this.formatDate(cert.date)}</span>
                        <span class="meta__status status--${cert.status}">${this.getStatusText(cert.status)}</span>
                    </div>
                </div>
                <div class="certificate-card__actions">
                    <button class="btn btn--primary btn--small" onclick="ClientPortalManager.downloadCertificate('${cert.id}')">
                        📥 Descargar
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderHistory() {
        const container = document.getElementById('clientHistory');
        if (!container) return;

        const historyItems = this.certificates.filter(cert => cert.type === 'historial');

        container.innerHTML = historyItems.map(cert => `
            <div class="history-item">
                <div class="history-item__date">${this.formatDate(cert.date)}</div>
                <div class="history-item__content">
                    <h4>${cert.title}</h4>
                    <p>${cert.product}</p>
                    <p>Estado: <span class="status--${cert.status}">${this.getStatusText(cert.status)}</span></p>
                </div>
            </div>
        `).join('');
    },

    renderRequests() {
        const container = document.getElementById('clientRequests');
        if (!container) return;

        container.innerHTML = this.requests.map(req => `
            <div class="request-card">
                <div class="request-card__header">
                    <h4>${req.type}</h4>
                    <span class="status-badge status--${req.status}">${this.getStatusText(req.status)}</span>
                </div>
                <p>${req.description}</p>
                <div class="request-card__meta">
                    <span>Solicitado: ${this.formatDate(req.date)}</span>
                </div>
            </div>
        `).join('');
    },

    renderCompanyInfo() {
        const container = document.getElementById('companyInfo');
        if (!container) return;

        container.innerHTML = `
            <div class="company-info__content">
                <div class="company-info__row">
                    <span class="company-info__label">Empresa:</span>
                    <span class="company-info__value">${this.currentClient.company}</span>
                </div>
                <div class="company-info__row">
                    <span class="company-info__label">Contacto:</span>
                    <span class="company-info__value">${this.currentClient.name}</span>
                </div>
                <div class="company-info__row">
                    <span class="company-info__label">Email:</span>
                    <span class="company-info__value">${this.currentClient.email}</span>
                </div>
                <div class="company-info__row">
                    <span class="company-info__label">Cliente desde:</span>
                    <span class="company-info__value">${this.formatDate(this.currentClient.loginTime.split(' ')[0])}</span>
                </div>
            </div>
        `;
    },

    // Las funciones de solicitud se han eliminado según requerimiento

    downloadCertificate(certId) {
        alert(`Descargando ${certId}...`);
    },

    getStatusText(status) {
        const statusMap = {
            'completado': '✅ Completado',
            'en-proceso': '⏳ En Proceso',
            'pendiente': '📋 Pendiente'
        };
        return statusMap[status] || status;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    },

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('hightest_client');
            window.location.href = 'index.html';
        }
    }
};

// ===========================
// GESTOR DE LISTA DE CHEQUEO (ADMIN)
// ===========================

const ChecklistEnsayosManager = {
    currentUser: null,

    init() {
        this.loadUserFromStorage();
        if (!this.currentUser) {
            // Si no hay usuario HIGH TEST autenticado, redirigir al home
            window.location.href = 'index.html';
            return;
        }
        this.setupPdfButton();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupPdfButton() {
        const btn = document.getElementById('btnChecklistPdf');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const section = document.querySelector('.admin-section');
            if (!section) return;

            if (typeof html2pdf === 'undefined') {
                alert('No se pudo generar el PDF en este momento.');
                return;
            }

            const today = new Date().toISOString().slice(0, 10);
            const filename = `FR-7.2-Checklist-${today}.pdf`;

            const opt = {
                margin:       10,
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.95 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(section).save();
        });
    }
};

// ===========================
// GESTOR DEL INFORME DE ENSAYOS (FR-7.8)
// ===========================

const InformeEnsayosManager = {
    currentUser: null,

    init() {
        this.loadUserFromStorage();
        if (!this.currentUser) {
            // Si no hay usuario HIGH TEST autenticado, redirigir al home
            window.location.href = 'index.html';
            return;
        }
        this.setupPdfButton();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupPdfButton() {
        const btn = document.getElementById('btnInformePdf');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const section = document.querySelector('.admin-section');
            if (!section) return;

            if (typeof html2pdf === 'undefined') {
                alert('No se pudo generar el PDF en este momento.');
                return;
            }

            const today = new Date().toISOString().slice(0, 10);
            const filename = `FR-7.8-Informe-Ensayos-${today}.pdf`;

            const opt = {
                margin:       10,
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.95 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(section).save();
        });
    }
};

// ===========================
// LECTURA DEL PARÁMETRO "inf" EN LA URL
// ===========================

function applyInfParamFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const infParam = params.get('inf');

        if (!infParam) {
            return; // No hay parámetro "inf", no hacemos nada
        }

        const input = document.getElementById('numeroInforme');

        if (!input) {
            console.error('❌ No se encontró el input con id="numeroInforme" para aplicar el parámetro "inf".');
            return;
        }

        input.value = infParam;

        // Si existe la función global validarInforme, la usamos;
        // de lo contrario intentamos simular el click en el botón.
        if (typeof window.validarInforme === 'function') {
            window.validarInforme();
        } else {
            const btn = document.getElementById('verifyReportBtn');
            if (btn) {
                btn.click();
            } else {
                console.warn('⚠️ No se encontró el botón con id="verifyReportBtn" ni la función validarInforme() para ejecutar la validación.');
            }
        }
    } catch (error) {
        console.error('❌ Error al procesar el parámetro "inf" desde la URL:', error);
    }
}

// ===========================
// INICIALIZACIÓN SEGÚN PÁGINA
// ===========================

// También inicializar el módulo principal por si el evento ya se disparó
if (document.readyState === 'loading') {
    console.log('📄 Estado: Documento aún se está cargando...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded: Iniciando aplicación...');
        initializePage();
    });
} else {
    console.log('📄 Estado: Documento ya está cargado - Inicializando...');
    initializePage();
}

// Función centralizada de inicialización
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop();
    console.log('🔍 Inicializando página:', currentPage);

    // Detección robusta basada en el DOM para evitar problemas
    // cuando la ruta cambia (por ejemplo, en móvil o hosting).
    const hasAdminPanel = document.getElementById('adminUserName');
    const hasChecklist = document.getElementById('btnChecklistPdf');
    const hasInforme = document.getElementById('btnInformePdf');
    const hasClientPortal = document.getElementById('clientPortal');
    const hasHomeMarkers = document.getElementById('authModal') || document.getElementById('loginBtn');

    if (hasAdminPanel) {
        console.log('🏢 Inicializando panel administrativo (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        AdminPanelManager.init();
    } else if (hasChecklist) {
        console.log('📋 Inicializando lista de chequeo de ensayos en sitio (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        ChecklistEnsayosManager.init();
    } else if (hasInforme) {
        console.log('📄 Inicializando informe de ensayos (FR-7.8) (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        InformeEnsayosManager.init();
    } else if (hasClientPortal) {
        console.log('👤 Inicializando portal de cliente (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        ClientPortalManager.init();
    } else if (hasHomeMarkers) {
        console.log('🏠 Inicializando página principal (por DOM)');
        verifyDOMElements();
        AuthManager.init();
        CertificatesAuthManager.init();
        CertificatesManager.init();
        PublicReportVerifier.init();
        App.init();
        // Aplicar automáticamente el parámetro "inf" de la URL si existe
        applyInfParamFromUrl();
    } else {
        // Fallback: al menos activar tema y menú para que
        // el header funcione aunque no se reconozca la vista.
        console.warn('⚠️ No se reconoció la página actual. Inicializando módulos básicos por defecto.');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
    }

    console.log('✅ Inicialización completada');
}

// ===========================
// UTILIDADES GLOBALES
// ===========================

/**
 * Función para hacer scroll hacia arriba
 */
window.scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

/**
 * Función para enfocar en un elemento
 */
window.focusElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// ===========================
// LOGGING Y DEBUGGING
// ===========================

// Log de eventos importantes
document.addEventListener('click', (e) => {
    if (e.target.closest('button, a')) {
        const element = e.target.closest('button, a');
        const label = element.textContent.trim().substring(0, 50);
        if (label && !label.includes('•')) {
            console.log('📌 Acción:', label);
        }
    }
});
