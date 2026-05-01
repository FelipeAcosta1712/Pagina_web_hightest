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
        AuthManager.init();
        CertificatesManager.init();
        PublicCertificatesManager.init();
        CertificatesAuthManager.init();
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

    /**
     * Inicializar el gestor de autenticación
     */
    init() {
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
        const form = e.target;
        const email = form.querySelector('input[name="email"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;

        // Validaciones básicas
        if (!email || !password) {
            alert('Por favor, completa todos los campos');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Correo electrónico inválido');
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
                return;
            }

            const remember = !!form.querySelector('input[name="remember"]')?.checked;
            const user = resultado?.user;
            const userName = user?.name || email;

            // Login exitoso - Usuario HIGH TEST
            this.currentUser = {
                id: user?.id || Date.now(),
                name: userName,
                email: user?.email || email,
                company: 'HIGH TEST SAS',
                loginTime: new Date().toLocaleString(),
                userType: 'hightest',
                remember
            };

            this.saveUserToStorage();
            this.closeAuthModal();

            // Redirigir al panel administrativo
            alert(`¡Bienvenido ${this.currentUser.name}! Redirigiendo al panel administrativo...`);
            window.location.href = 'admin-panel.html';
        } catch (error) {
            console.error('Error en el sistema de acceso:', error);
            alert('Error en el sistema de acceso. Intente nuevamente.');
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

    /**
     * Inicializar el gestor de autenticación de certificados
     */
    init() {
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
        const certificatesForm = document.getElementById('certificatesForm');

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
            certificatesForm.addEventListener('submit', (e) => this.handleCertificatesAuth(e));
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
    handleCertificatesAuth(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[name="email"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;

        // Validaciones básicas
        if (!email || !password) {
            alert('Por favor, completa todos los campos');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Correo electrónico inválido');
            return;
        }

        // Credenciales válidas para clientes
        const validClientCredentials = [
            { email: 'cliente@empresa1.com', password: 'cert123', name: 'Cliente Empresa 1', company: 'Empresa 1 SAS' },
            { email: 'juan.perez@empresa2.com', password: 'juan456', name: 'Juan Pérez', company: 'Empresa 2 Ltda' },
            { email: 'maria.garcia@empresa3.com', password: 'maria789', name: 'María García', company: 'Empresa 3 S.A.' },
            { email: 'cliente@hightestcliente.com', password: 'cliente123', name: 'Cliente Demo', company: 'Cliente Demo' }
        ];

        // Verificar credenciales de cliente
        const clientCredential = validClientCredentials.find(cred => cred.email === email && cred.password === password);

        if (!clientCredential) {
            alert('Credenciales incorrectas. Si no recuerda sus datos o aún no tiene acceso, contacte a nuestro equipo de HIGH TEST.');
            return;
        }

        // Autenticación exitosa - Guardar como usuario cliente
        this.currentClient = {
            id: Date.now(),
            name: clientCredential.name,
            email: clientCredential.email,
            company: clientCredential.company,
            loginTime: new Date().toLocaleString(),
            userType: 'client'
        };

        // Guardar en localStorage con clave diferente
        localStorage.setItem('hightest_client', JSON.stringify(this.currentClient));

        this.closeCertificatesModal();

        // Redirigir al portal de cliente
        alert(`¡Bienvenido ${this.currentClient.name}! Estamos ingresando a su portal de cliente HIGH TEST.`);
        window.location.href = 'client-portal.html';
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
// GESTOR DEL PANEL ADMINISTRATIVO
// ===========================

const AdminPanelManager = {
    currentUser: null,
    certificates: [],

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
        this.updateStats();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupUI() {
        // Actualizar nombre de usuario
        const userNameEl = document.getElementById('adminUserName');
        if (userNameEl) userNameEl.textContent = this.currentUser.name;
    },

    loadMockData() {
        // Datos simulados de certificados
        this.certificates = [
            {
                id: 'HT-2025-001',
                client: 'Empresa 1 SAS',
                product: 'Guantes aislantes Clase 2',
                type: 'reporte',
                status: 'completado',
                date: '2025-03-15',
                value: 2500000
            },
            {
                id: 'HT-2025-002',
                client: 'Empresa 2 Ltda',
                product: 'Herramientas aislantes',
                type: 'certificado',
                status: 'en-proceso',
                date: '2025-03-10',
                value: 1800000
            },
            {
                id: 'HT-2025-003',
                client: 'Empresa 3 S.A.',
				product: 'Ensayo funcional de equipos',
				type: 'reporte',
                status: 'completado',
                date: '2025-03-08',
                value: 950000
            },
            {
                id: 'HT-2025-004',
                client: 'Cliente Demo',
				product: 'Informe de ensayo adicional',
				type: 'reporte',
                status: 'pendiente',
                date: '2025-03-05',
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

        // Búsqueda y filtros
        const searchInput = document.getElementById('adminSearchCertificates');
        const statusFilter = document.getElementById('adminFilterStatus');
        const typeFilter = document.getElementById('adminFilterType');
        const dateFilter = document.getElementById('adminFilterDate');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterCertificates());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterCertificates());
        }
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterCertificates());
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterCertificates());
        }

        // Nuevo certificado
        const addCertBtn = document.getElementById('addCertificateBtn');
        if (addCertBtn) {
            addCertBtn.addEventListener('click', () => this.addNewCertificate());
        }

        this.renderCertificates();
    },

    renderCertificates() {
        const tbody = document.getElementById('certificatesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.certificates.forEach(cert => {
            const row = document.createElement('tr');

            const statusClass = `status--${cert.status}`;
            const statusText = this.getStatusText(cert.status);
            const typeText = this.getTypeText(cert.type);

            row.innerHTML = `
                <td>${cert.id}</td>
                <td>${cert.client}</td>
                <td>${cert.product}</td>
                <td>${typeText}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${this.formatDate(cert.date)}</td>
                <td>
                    <button class="btn btn--small btn--outline" onclick="AdminPanelManager.viewCertificate('${cert.id}')">👁️ Ver</button>
                    <button class="btn btn--small btn--primary" onclick="AdminPanelManager.downloadCertificate('${cert.id}')">📥 Descargar</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    filterCertificates() {
        const searchTerm = document.getElementById('adminSearchCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterStatus')?.value || '';
        const typeFilter = document.getElementById('adminFilterType')?.value || '';
        const dateFilter = document.getElementById('adminFilterDate')?.value || '';

        const filtered = this.certificates.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm) ||
                cert.product.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesType = !typeFilter || cert.type === typeFilter;
            const matchesDate = !dateFilter || cert.date === dateFilter;

            return matchesSearch && matchesStatus && matchesType && matchesDate;
        });

        this.renderFilteredCertificates(filtered);
    },

    renderFilteredCertificates(filteredCerts) {
        const tbody = document.getElementById('certificatesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        filteredCerts.forEach(cert => {
            const row = document.createElement('tr');

            const statusClass = `status--${cert.status}`;
            const statusText = this.getStatusText(cert.status);
            const typeText = this.getTypeText(cert.type);

            row.innerHTML = `
                <td>${cert.id}</td>
                <td>${cert.client}</td>
                <td>${cert.product}</td>
                <td>${typeText}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${this.formatDate(cert.date)}</td>
                <td>
                    <button class="btn btn--small btn--outline" onclick="AdminPanelManager.viewCertificate('${cert.id}')">👁️ Ver</button>
                    <button class="btn btn--small btn--primary" onclick="AdminPanelManager.downloadCertificate('${cert.id}')">📥 Descargar</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    updateStats() {
        const total = this.certificates.length;
        const completed = this.certificates.filter(c => c.status === 'completado').length;
        const pending = this.certificates.filter(c => c.status === 'pendiente').length;

        document.getElementById('statTotalCerts').textContent = total;
        document.getElementById('statCompletedCerts').textContent = completed;
        document.getElementById('statPendingCerts').textContent = pending;
    },

    getStatusText(status) {
        const statusMap = {
            'completado': '✅ Completado',
            'en-proceso': '⏳ En Proceso',
            'pendiente': '📋 Pendiente',
            'cancelado': '❌ Cancelado'
        };
        return statusMap[status] || status;
    },

    getTypeText(type) {
        const typeMap = {
            'reporte': '📄 Informe de ensayo',
			'certificado': '🎖️ Informe de verificación'
        };
        return typeMap[type] || type;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
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
        alert('Funcionalidad para agregar nuevo certificado - próximamente');
    },

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('hightest_user');
            window.location.href = 'index.html';
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
