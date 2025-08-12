/**
 * UI Controls Manager
 * Handles all user interface interactions and parameter updates
 */

class UIControls {
    constructor(app) {
        this.app = app;
        this.fractalSelector = null;
        this.parameterControls = new Map();
        this.isUpdating = false;
        
        this.initialize();
    }

    /**
     * Initialize UI controls
     */
    initialize() {
        this.setupFractalSelector();
        this.setupParameterControls();
        this.setupTransformControls();
        this.setupQualityControls();
        this.setupHeaderButtons();
        this.setupJuliaControls();
    // Color controls removed
        
        // Setup fullscreen listeners
        this.setupFullscreenListeners();
        
        console.log('UI Controls initialized');
    }

    /**
     * Setup fractal type selector
     */
    setupFractalSelector() {
        this.fractalSelector = document.getElementById('fractalSelector');
        if (!this.fractalSelector) return;

        // Add click handlers to fractal options
        const options = this.fractalSelector.querySelectorAll('.fractal-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                options.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                option.classList.add('active');
                
                // Get fractal type and switch
                const fractalType = option.getAttribute('data-fractal');
                if (fractalType) {
                    this.app.setFractal(fractalType);
                    this.updateParameterVisibility(fractalType);
                }
            });
        });
    }

    /**
     * Setup parameter controls (sliders and inputs)
     */
    setupParameterControls() {
        this.setupSliderControl('iterations', 'iter-val', 'iter-input', val => val);
        this.setupSliderControl('radius', 'radius-val', 'radius-input', val => parseFloat(val).toFixed(1));
        this.setupSliderControl('zoom', 'zoom-val', 'zoom-input', val => {
            const zoom = Math.pow(10, val);
            return this.formatScientific(zoom);
        });
    this.setupSliderControl('depth', 'depth-val', 'depth-input', val => val);
        this.setupSliderControl('rotation', 'rotation-val', 'rotation-input', val => val);
        
        // Setup center coordinate inputs
        this.setupCenterControls();
    }

    /**
     * Setup a slider control with synchronized input field
     */
    setupSliderControl(sliderId, displayId, inputId, formatter) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        const input = document.getElementById(inputId);
        
        if (!slider || !display || !input) return;

        // Store references
        this.parameterControls.set(sliderId, { slider, display, input, formatter });

        // Slider change handler
        slider.addEventListener('input', () => {
            if (this.isUpdating) return;
            
            const value = this.getSliderValue(sliderId, slider.value);
            const formattedValue = formatter(slider.value);
            
            display.textContent = formattedValue;
            input.value = formattedValue;
            
            this.updateFractalParameter(sliderId, value);
        });

        // Input field change handler
        input.addEventListener('change', () => {
            if (this.isUpdating) return;
            
            const value = this.parseInputValue(sliderId, input.value);
            if (value !== null) {
                this.updateSliderFromValue(sliderId, value);
                this.updateFractalParameter(sliderId, value);
            }
        });

        // Input field focus/blur for better UX
        input.addEventListener('focus', () => {
            input.select();
        });
    }

    /**
     * Get actual value from slider based on parameter type
     */
    getSliderValue(paramType, sliderValue) {
        switch (paramType) {
            case 'iterations':
            case 'depth':
            case 'rotation':
                return parseInt(sliderValue);
            case 'radius':
                return parseFloat(sliderValue);
            case 'zoom':
                return Math.pow(10, parseFloat(sliderValue));
            default:
                return parseFloat(sliderValue);
        }
    }

    /**
     * Parse input value and validate
     */
    parseInputValue(paramType, inputValue) {
        let value;
        
        try {
            if (paramType === 'iterations' || paramType === 'depth' || paramType === 'rotation') {
                value = parseInt(inputValue);
            } else {
                value = parseFloat(inputValue);
            }
            
            if (isNaN(value)) return null;
            
            const fractalType = this.app.getCurrentFractal()?.getName()?.toLowerCase() || 'mandelbrot';
            const isGeometric = ['fractaltree', 'kochcurve', 'sierpinski'].includes(fractalType);
            
            // Validate ranges based on fractal type
            switch (paramType) {
                case 'iterations':
                    if (isGeometric) {
                        return Math.max(3, Math.min(12, value)); // Recursion depth 3-12 for geometric
                    } else {
                        return Math.max(1, Math.min(4000, value)); // Iterations for mathematical
                    }
                case 'radius':
                    return Math.max(1, Math.min(10, value));
                case 'zoom':
                    if (isGeometric) {
                        return Math.max(0.1, Math.min(100, value)); // Limited zoom for geometric
                    } else {
                        return Math.max(0.00001, value); // Unlimited zoom for mathematical
                    }
                case 'depth':
                    // Allow depth up to 30 as per updated requirement
                    return Math.max(1, Math.min(30, value));
                case 'rotation':
                    return value % 360;
                default:
                    return value;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Update slider position from value
     */
    updateSliderFromValue(paramType, value) {
        const control = this.parameterControls.get(paramType);
        if (!control) return;

        this.isUpdating = true;

        let sliderValue;
        switch (paramType) {
            case 'zoom':
                sliderValue = Math.log10(value);
                break;
            default:
                sliderValue = value;
        }

        control.slider.value = sliderValue;
        const formattedValue = control.formatter(sliderValue);
        control.display.textContent = formattedValue;
        control.input.value = formattedValue;

        this.isUpdating = false;
    }

    /**
     * Update fractal parameter
     */
    updateFractalParameter(paramType, value) {
        const fractal = this.app.getCurrentFractal();
        if (!fractal) return;

        const updates = {};
        
        switch (paramType) {
            case 'iterations':
                // Usar el método específico para iteraciones manuales
                fractal.updateIterations(value);
                break;
            case 'radius':
                updates.escapeRadius = value;
                break;
            case 'zoom':
                this.app.getViewport().setTarget(
                    this.app.getViewport().targetCenterX,
                    this.app.getViewport().targetCenterY,
                    value,
                    this.app.getViewport().targetRotation
                );
                return; // Viewport handles this, not fractal parameters
            case 'rotation':
                const radians = value * Math.PI / 180;
                this.app.getViewport().setTarget(
                    this.app.getViewport().targetCenterX,
                    this.app.getViewport().targetCenterY,
                    this.app.getViewport().targetZoom,
                    radians
                );
                return; // Viewport handles this
            case 'depth':
                updates.recursionDepth = value;
                break;
        }

        if (Object.keys(updates).length > 0) {
            fractal.updateParameters(updates);
        }
    }

    /**
     * Setup center coordinate controls
     */
    setupCenterControls() {
        const centerXInput = document.getElementById('center-x');
        const centerYInput = document.getElementById('center-y');
        
        if (!centerXInput || !centerYInput) return;

        const updateCenter = () => {
            if (this.isUpdating) return;
            
            const x = parseFloat(centerXInput.value) || 0;
            const y = parseFloat(centerYInput.value) || 0;
            
            this.app.getViewport().setTarget(
                x, y,
                this.app.getViewport().targetZoom,
                this.app.getViewport().targetRotation
            );
        };

        centerXInput.addEventListener('change', updateCenter);
        centerYInput.addEventListener('change', updateCenter);
        
        // Update display periodically
        setInterval(() => {
            if (!this.isUpdating) {
                const viewport = this.app.getViewport();
                centerXInput.value = viewport.centerX.toFixed(6);
                centerYInput.value = viewport.centerY.toFixed(6);
            }
        }, 100);
    }

    /**
     * Setup transform matrix controls
     */
    setupTransformControls() {
        const matrixButtons = document.querySelectorAll('.matrix-btn');
        
        matrixButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const direction = button.getAttribute('data-dir');
                
                if (action === 'reset') {
                    this.app.getViewport().reset();
                } else if (action === 'move' && direction) {
                    this.handleDirectionalMove(direction);
                }
                
                // Visual feedback
                button.style.background = 'rgba(137, 180, 250, 0.3)';
                setTimeout(() => {
                    button.style.background = '';
                }, 200);
            });
        });
    }

    /**
     * Handle directional movement
     */
    handleDirectionalMove(direction) {
        const viewport = this.app.getViewport();
        const panSpeed = 0.1 / viewport.zoom;
        
        let deltaX = 0, deltaY = 0;
        
        switch (direction) {
            case 'n': deltaY = panSpeed; break;
            case 's': deltaY = -panSpeed; break;
            case 'e': deltaX = panSpeed; break;
            case 'w': deltaX = -panSpeed; break;
            case 'ne': deltaX = panSpeed; deltaY = panSpeed; break;
            case 'nw': deltaX = -panSpeed; deltaY = panSpeed; break;
            case 'se': deltaX = panSpeed; deltaY = -panSpeed; break;
            case 'sw': deltaX = -panSpeed; deltaY = -panSpeed; break;
        }
        
        viewport.setTarget(
            viewport.targetCenterX + deltaX,
            viewport.targetCenterY + deltaY,
            viewport.targetZoom,
            viewport.targetRotation
        );
    }

    /**
     * Setup header button handlers
     */
    setupHeaderButtons() {
        const captureBtn = document.getElementById('captureBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        // Botón de captura de imagen
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.app.captureImage();
                this.showToast('Imagen guardada correctamente');
            });
        }
        
        // Botón de modo pantalla completa
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Setup fullscreen floating controls
        this.setupFullscreenControls();
    }
    
    /**
     * Setup fullscreen floating controls
     */
    setupFullscreenControls() {
        const captureFullscreenBtn = document.getElementById('captureFullscreenBtn');
        const resetFullscreenBtn = document.getElementById('resetFullscreenBtn');
        const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
        const toggleIterationsBtn = document.getElementById('toggleIterationsBtn');
        const toggleParamsBtn = document.getElementById('toggleParamsBtn');
        
        // Botón de captura en fullscreen
        if (captureFullscreenBtn) {
            captureFullscreenBtn.addEventListener('click', () => {
                this.app.captureImage();
                this.showToast('Imagen guardada en modo pantalla completa');
            });
        }
        
        // Botón de reset en fullscreen
        if (resetFullscreenBtn) {
            resetFullscreenBtn.addEventListener('click', () => {
                this.app.getViewport().reset();
                this.showToast('Vista reiniciada');
            });
        }
        
        // Botón para salir de fullscreen
        if (fullscreenToggleBtn) {
            fullscreenToggleBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Botón de iteraciones rápidas
        if (toggleIterationsBtn) {
            toggleIterationsBtn.addEventListener('click', () => {
                const fractal = this.app.getCurrentFractal();
                if (fractal) {
                    const current = fractal.parameters.maxIterations;
                    const newValue = current < 500 ? 1000 : current < 1000 ? 2000 : current < 2000 ? 4000 : 100;
                    fractal.updateIterations(newValue);
                    this.updateIterationDisplay(newValue);
                    this.showToast(`Iteraciones: ${newValue}`);
                }
            });
        }
        
        // Botón para mostrar/ocultar parámetros
        if (toggleParamsBtn) {
            toggleParamsBtn.addEventListener('click', () => {
                const paramsPanel = document.getElementById('fullscreenParams');
                if (paramsPanel) {
                    const isVisible = paramsPanel.style.display === 'block';
                    paramsPanel.style.display = isVisible ? 'none' : 'block';
                }
            });
        }
        
        // Setup fullscreen parameters panel
        this.setupFullscreenParams();
    }
    
    /**
     * Setup fullscreen parameters panel
     */
    setupFullscreenParams() {
        const fsIterations = document.getElementById('fs-iterations');
        const fsZoom = document.getElementById('fs-zoom');
        const fsQuality = document.getElementById('fs-quality');
        
        if (fsIterations) {
            fsIterations.addEventListener('input', () => {
                const value = parseInt(fsIterations.value);
                document.getElementById('fs-iter-val').textContent = value;
                const fractal = this.app.getCurrentFractal();
                if (fractal) {
                    fractal.updateIterations(value);
                }
            });
        }
        
        if (fsZoom) {
            fsZoom.addEventListener('input', () => {
                const value = parseFloat(fsZoom.value);
                const zoom = Math.pow(10, value);
                document.getElementById('fs-zoom-val').textContent = this.formatScientific(zoom);
                this.app.getViewport().setTarget(
                    this.app.getViewport().targetCenterX,
                    this.app.getViewport().targetCenterY,
                    zoom,
                    this.app.getViewport().targetRotation
                );
            });
        }
        
        if (fsQuality) {
            fsQuality.addEventListener('change', () => {
                const value = parseFloat(fsQuality.value);
                const qualityText = fsQuality.options[fsQuality.selectedIndex].text;
                document.getElementById('fs-quality-val').textContent = qualityText.split(' ')[0];
                this.app.updateQualitySettings({ renderScale: value });
                this.app.resize();
            });
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    /**
     * Enter fullscreen on the main layout (preferred) falling back to body
     */
    enterFullscreen() {
        const appLayout = document.querySelector('.app-layout');
        const target = appLayout || document.documentElement;
        if (!target) return;

        // Add helper class for CSS fallback
        if (appLayout) appLayout.classList.add('fullscreen');

        const request = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen || target.msRequestFullscreen;
        if (request) {
            request.call(target).then(() => {
                this.showFullscreenControls();
                this.showToast('Pantalla completa activada (ESC para salir)');
                // Force a resize to adapt canvas
                setTimeout(() => this.app.resize(true), 50);
            }).catch(err => {
                console.warn('Error fullscreen:', err);
                this.showToast('No se pudo activar fullscreen');
                if (appLayout) appLayout.classList.remove('fullscreen');
            });
        } else {
            this.showToast('Fullscreen no soportado');
        }
    }

    /**
     * Exit fullscreen and remove helper class
     */
    exitFullscreen() {
        const appLayout = document.querySelector('.app-layout');
        if (appLayout) appLayout.classList.remove('fullscreen');

        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exit && (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement)) {
            exit.call(document).catch(()=>{});
        }
        this.hideFullscreenControls();
        this.showToast('Pantalla completa desactivada');
        setTimeout(()=> this.app.resize(true), 50);
    }
    
    /**
     * Show fullscreen controls
     */
    showFullscreenControls() {
        const controls = document.getElementById('fullscreenControls');
        if (controls) {
            controls.style.display = 'flex';
            controls.style.visibility = 'visible';
        }
        
        // Update button text
        const headerBtn = document.getElementById('fullscreenBtn');
        const toggleBtn = document.getElementById('fullscreenToggleBtn');
        if (headerBtn) headerBtn.innerHTML = '🔲 Salir Pantalla Completa';
        if (toggleBtn) toggleBtn.innerHTML = '🔲 Salir Fullscreen';
        
        console.log('Controles fullscreen mostrados'); // Debug
    }
    
    /**
     * Hide fullscreen controls
     */
    hideFullscreenControls() {
        const controls = document.getElementById('fullscreenControls');
        const params = document.getElementById('fullscreenParams');
        
        if (controls) {
            controls.style.display = 'none';
            controls.style.visibility = 'hidden';
        }
        if (params) {
            params.style.display = 'none';
        }
        
        // Update button text
        const headerBtn = document.getElementById('fullscreenBtn');
        const toggleBtn = document.getElementById('fullscreenToggleBtn');
        if (headerBtn) headerBtn.innerHTML = '🔳 Pantalla Completa';
        if (toggleBtn) toggleBtn.innerHTML = '🔳 Pantalla Completa';
        
        console.log('Controles fullscreen ocultados'); // Debug
    }
    
    /**
     * Update iteration display
     */
    updateIterationDisplay(value) {
        const iterControl = this.parameterControls.get('iterations');
        if (iterControl) {
            iterControl.slider.value = value;
            iterControl.display.textContent = value;
            iterControl.input.value = value;
        }
        
        // Update fullscreen display too
        const fsIterVal = document.getElementById('fs-iter-val');
        const fsIterSlider = document.getElementById('fs-iterations');
        if (fsIterVal) fsIterVal.textContent = value;
        if (fsIterSlider) fsIterSlider.value = value;
    }
    
    /**
     * Setup fullscreen change listeners
     */
    setupFullscreenListeners() {
        const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                const isFullscreen = document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement ||
                                   document.msFullscreenElement;
                
                if (isFullscreen) {
                    this.showFullscreenControls();
                } else {
                    this.hideFullscreenControls();
                }
                
                // Force resize after fullscreen change
                setTimeout(() => {
                    if (this.app && this.app.resize) {
                        this.app.resize(true);
                    }
                }, 100);
            });
        });
    }
    
    /**
     * Setup color controls for geometric fractals
     */
    setupColorControls() {
        const primaryColor = document.getElementById('fractalColorPrimary');
        const secondaryColor = document.getElementById('fractalColorSecondary');
        
        if (primaryColor) {
            primaryColor.addEventListener('change', () => {
                this.updateFractalColors();
                this.showToast('Color principal actualizado');
            });
        }
        
        if (secondaryColor) {
            secondaryColor.addEventListener('change', () => {
                this.updateFractalColors();
                this.showToast('Color secundario actualizado');
            });
        }
    }
    
    /**
     * Update fractal colors
     */
    updateFractalColors() {
        const fractal = this.app.getCurrentFractal();
        if (!fractal) return;
        
        const primaryColor = document.getElementById('fractalColorPrimary');
        const secondaryColor = document.getElementById('fractalColorSecondary');
        
        if (primaryColor) {
            const primary = this.hexToRgb(primaryColor.value);
            
            // Para fractales que solo usan un color (Koch, Sierpinski)
            if (fractal.updateColor) {
                fractal.updateColor(primary);
            }
            
            // Para fractales que usan dos colores (Árbol)
            if (secondaryColor && fractal.updateColors) {
                const secondary = this.hexToRgb(secondaryColor.value);
                fractal.updateColors(primary, secondary);
            }
            
            // Para fractales que usan el método setColor genérico
            if (fractal.setColor) {
                fractal.setColor(primary);
            }
            
            // Forzar re-render del fractal - no es necesario porque el renderLoop ya está activo
            console.log('Color actualizado:', primary);
        }
    }
    
    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    }

    /**
     * Setup Julia set specific controls
     */
    setupJuliaControls() {
        const juliaParams = document.getElementById('juliaParams');
        const cRealInput = document.getElementById('julia-c-real');
        const cImagInput = document.getElementById('julia-c-imag');
        
        if (!cRealInput || !cImagInput) return;

        const updateJuliaConstant = () => {
            const fractal = this.app.getCurrentFractal();
            if (fractal && fractal.getName() === 'Julia') {
                const cReal = parseFloat(cRealInput.value) || 0;
                const cImag = parseFloat(cImagInput.value) || 0;
                fractal.updateConstant(cReal, cImag);
            }
        };

        cRealInput.addEventListener('change', updateJuliaConstant);
        cImagInput.addEventListener('change', updateJuliaConstant);
    }

    /**
     * Update parameter visibility based on fractal type
     */
    updateParameterVisibility(fractalType) {
        const juliaParams = document.getElementById('juliaParams');
        const iterationsControl = document.getElementById('iterationsControl');
        const depthControl = document.getElementById('depthControl'); 
        const radiusControl = document.getElementById('radiusControl');
    // Color section removed
        const qualityControl = document.getElementById('quality').parentElement;
        
        // Julia parameters - only for Julia set
        if (juliaParams) {
            juliaParams.style.display = fractalType === 'julia' ? 'block' : 'none';
        }
        
        // Determine fractal type categories
        const isGeometric = ['fractal-tree', 'koch-curve', 'sierpinski'].includes(fractalType);
        const isMathematical = ['mandelbrot', 'julia'].includes(fractalType);
        
        // Show/hide controls based on fractal type
        if (iterationsControl) {
            iterationsControl.style.display = isMathematical ? 'block' : 'none';
        }
        
        if (depthControl) {
            depthControl.style.display = isGeometric ? 'block' : 'none';
        }
        
        if (radiusControl) {
            radiusControl.style.display = isMathematical ? 'block' : 'none';
        }
        
        // Color section - only for geometric fractals
    // (Color controls removed)
        
        // Configure zoom control based on fractal type
    const zoomSlider = document.getElementById('zoom');
        if (zoomSlider) {
            if (isGeometric) {
                // Limit zoom for geometric fractals
                zoomSlider.max = '2'; // Limit to 100x zoom max
                zoomSlider.style.opacity = '0.7';
                zoomSlider.parentElement.title = 'Zoom limitado para fractales geométricos';
            } else {
                // Unlimited zoom for mathematical fractals (Mandelbrot, Julia)
                zoomSlider.max = '15'; // Up to 10^15 zoom
                zoomSlider.style.opacity = '1';
                zoomSlider.parentElement.title = 'Zoom infinito disponible';
            }
        }
        
        // Configure quality control
        if (qualityControl) {
            if (isGeometric) {
                qualityControl.style.opacity = '0.7';
                qualityControl.title = 'Calidad menos crítica en fractales geométricos';
            } else {
                qualityControl.style.opacity = '1';
                qualityControl.title = 'Calidad crítica para zoom extremo sin pixelación';
            }
        }
        
        this.showToast(`Cambiado a: ${this.getFractalDisplayName(fractalType)}`);
        
        // Reset recursion depth to 1 when switching to geometric fractal
        if (isGeometric) {
            const depthSlider = document.getElementById('depth');
            const depthInput = document.getElementById('depth-input');
            const depthVal = document.getElementById('depth-val');
            if (depthSlider && depthInput && depthVal) {
                depthSlider.max = '30';
                depthSlider.value = '1';
                depthInput.value = '1';
                depthVal.textContent = '1';
            }
        }
    }
    
    /**
     * Get display name for fractal type
     */
    getFractalDisplayName(fractalType) {
        const names = {
            'mandelbrot': 'Conjunto de Mandelbrot',
            'julia': 'Conjunto de Julia',
            'koch-curve': 'Curva de Koch',
            'sierpinski': 'Triángulo de Sierpinski',
            'fractal-tree': 'Árbol Fractal'
        };
        return names[fractalType] || fractalType;
    }

    /**
     * Update UI for new fractal (sync sliders with fractal parameters)
     */
    updateForFractal(fractal) {
        if (!fractal) return;
        this.isUpdating = true;
        try {
            const params = fractal.parameters;
            // Iterations (math fractals)
            if (params.maxIterations !== undefined) {
                const iter = this.parameterControls.get('iterations');
                if (iter) {
                    iter.slider.value = params.maxIterations;
                    iter.display.textContent = params.maxIterations;
                    iter.input.value = params.maxIterations;
                }
            }
            // Depth (geometric)
            if (params.recursionDepth !== undefined) {
                const depthCtrl = this.parameterControls.get('depth');
                if (depthCtrl) {
                    depthCtrl.slider.value = params.recursionDepth;
                    depthCtrl.display.textContent = params.recursionDepth;
                    depthCtrl.input.value = params.recursionDepth;
                }
            }
            // Radius
            if (params.escapeRadius !== undefined) {
                const rad = this.parameterControls.get('radius');
                if (rad) {
                    rad.slider.value = params.escapeRadius;
                    rad.display.textContent = params.escapeRadius.toFixed(1);
                    rad.input.value = params.escapeRadius.toFixed(1);
                }
            }
            // Zoom
            if (params.zoom !== undefined) {
                const zoomCtrl = this.parameterControls.get('zoom');
                if (zoomCtrl) {
                    const logZoom = Math.log10(params.zoom);
                    zoomCtrl.slider.value = logZoom;
                    const formatted = this.formatScientific(params.zoom);
                    zoomCtrl.display.textContent = formatted;
                    zoomCtrl.input.value = formatted;
                }
            }
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(137, 180, 250, 0.9);
            color: #1e1e2e;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 1000;
            font-family: 'Source Code Pro', monospace;
            font-size: 0.8rem;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Format number similar to BaseFractal.formatScientific for UI usage
     */
    formatScientific(value) {
        if (value === 0) return '0.0';
        const exponent = Math.floor(Math.log10(Math.abs(value)));
        const mantissa = value / Math.pow(10, exponent);
        if (exponent >= -2 && exponent <= 3) {
            return value.toFixed(Math.max(0, 3 - exponent));
        }
        return `${mantissa.toFixed(2)}e${exponent >= 0 ? '+' : ''}${exponent}`;
    }

    /**
     * Get current parameter values
     */
    getParameterValues() {
        const values = {};
        
        this.parameterControls.forEach((control, paramType) => {
            const sliderValue = control.slider.value;
            values[paramType] = this.getSliderValue(paramType, sliderValue);
        });
        
        return values;
    }

    /**
     * Set parameter values
     */
    setParameterValues(values) {
        this.isUpdating = true;
        
        Object.entries(values).forEach(([paramType, value]) => {
            this.updateSliderFromValue(paramType, value);
        });
        
        this.isUpdating = false;
    }

    /**
     * Setup quality controls
     */
    setupQualityControls() {
        // Quality selector
        const qualitySelect = document.getElementById('quality');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                const scale = parseFloat(e.target.value);
                this.app.updateQualitySettings({ renderScale: scale });
                
                // Update display value
                const qualityVal = document.getElementById('quality-val');
                if (qualityVal) {
                    const options = {
                        0.25: 'Muy Bajo',
                        0.5: 'Bajo',
                        0.6: 'Bajo+',
                        0.75: 'Medio-', 
                        0.8: 'Medio',
                        0.9: 'Medio+',
                        1.0: 'Alto',
                        1.1: 'Alto+',
                        1.25: 'Super',
                        1.4: 'Super+',
                        1.5: 'Ultra',
                        1.6: 'Ultra+',
                        1.75: 'Ultra++',
                        2.0: 'Extremo',
                        2.5: 'Extremo+',
                        3.0: 'Máximo',
                        3.5: 'Máximo+',
                        4.0: 'Insano',
                        5.0: 'Overkill',
                        6.0: 'Anti-Pixel',
                        8.0: 'Zoom Extremo',
                        10.0: 'Zoom Insano'
                    };
                    qualityVal.textContent = options[scale] || 'Alto';
                }
            });
        }

        // Precision selector
        const precisionSelect = document.getElementById('precision');
        if (precisionSelect) {
            precisionSelect.addEventListener('change', (e) => {
                const precision = e.target.value;
                this.app.updateQualitySettings({ precisionMode: precision });
                
                // Update display value
                const precisionVal = document.getElementById('precision-val');
                if (precisionVal) {
                    const options = {
                        'float': 'Estándar',
                        'double': 'Alta Precisión',
                        'arbitrary': 'Precisión Arbitraria'
                    };
                    precisionVal.textContent = options[precision] || 'Estándar';
                }
            });
        }

        // Anti-aliasing selector
        const antialiasingSelect = document.getElementById('antialiasing');
        if (antialiasingSelect) {
            antialiasingSelect.addEventListener('change', (e) => {
                const level = parseInt(e.target.value);
                this.app.updateQualitySettings({ antialiasingLevel: level });
                
                // Update display value
                const antialiasingVal = document.getElementById('antialiasing-val');
                if (antialiasingVal) {
                    const options = {
                        0: 'Desactivado',
                        2: '2x MSAA',
                        4: '4x MSAA',
                        8: '8x MSAA'
                    };
                    antialiasingVal.textContent = options[level] || 'Desactivado';
                }
            });
        }
    }

    /**
     * Update UI controls from current fractal parameters (como en ejemplo.html)
     */
    updateFromFractal(fractal) {
        if (!fractal || this.isUpdating) return;
        
        this.isUpdating = true;
        
        try {
        // Update iterations display
        const iterControl = this.parameterControls.get('iterations');
        if (iterControl) {
            iterControl.slider.value = fractal.parameters.maxIterations;
            iterControl.display.textContent = fractal.parameters.maxIterations;
            iterControl.input.value = fractal.parameters.maxIterations;
        }
        
        // Update zoom display and show tips for high zoom
        const zoomControl = this.parameterControls.get('zoom');
        if (zoomControl) {
            const logZoom = Math.log10(fractal.parameters.zoom);
            zoomControl.slider.value = logZoom;
            const formattedZoom = this.formatScientific(fractal.parameters.zoom);
            zoomControl.display.textContent = formattedZoom;
            zoomControl.input.value = formattedZoom;
            
            // Show tip for infinite zoom capability
            if (fractal.parameters.zoom > 1000) {
                console.log(`💡 Tip: Para ver más detalles en zoom ${formattedZoom}, aumenta las iteraciones manualmente`);
            }
        }            // Update radius display
            const radiusControl = this.parameterControls.get('radius');
            if (radiusControl) {
                radiusControl.slider.value = fractal.parameters.escapeRadius;
                radiusControl.display.textContent = fractal.parameters.escapeRadius.toFixed(1);
                radiusControl.input.value = fractal.parameters.escapeRadius.toFixed(1);
            }
            
            // Update center coordinates
            const centerXInput = document.getElementById('center-x');
            const centerYInput = document.getElementById('center-y');
            if (centerXInput && centerYInput) {
                centerXInput.value = fractal.parameters.centerX.toFixed(10);
                centerYInput.value = fractal.parameters.centerY.toFixed(10);
            }
            
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Configurar controles del modo pantalla completa
     */
    setupFullscreenControls() {
        const captureFullscreenBtn = document.getElementById('captureFullscreenBtn');
        const resetFullscreenBtn = document.getElementById('resetFullscreenBtn');
        const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');

        if (captureFullscreenBtn) {
            captureFullscreenBtn.addEventListener('click', () => {
                this.app.captureImage();
                this.showToast('Imagen guardada en modo pantalla completa');
            });
        }

        if (resetFullscreenBtn) {
            resetFullscreenBtn.addEventListener('click', () => {
                this.app.viewport.reset();
                this.showToast('Vista reiniciada');
            });
        }

        if (fullscreenToggleBtn) {
            fullscreenToggleBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    }

}
