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
                    return Math.max(1, Math.min(12, value));
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
        const exportBtn = document.getElementById('exportBtn');
        const saveBtn = document.getElementById('saveBtn');
        const captureBtn = document.getElementById('captureBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = this.app.exportData();
                if (data) {
                    console.log('Exported data:', data);
                    // Copy to clipboard
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    this.showToast('Data exported to clipboard');
                }
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.app.saveSession();
                this.showToast('Session saved');
            });
        }
        
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.app.captureImage();
                this.showToast('Image captured');
            });
        }
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
        const zoomControl = document.getElementById('zoom').parentElement;
        const iterationsControl = document.getElementById('iterations').parentElement;
        const depthControl = document.getElementById('depth').parentElement;
        const qualityControl = document.getElementById('quality').parentElement;
        
        // Julia parameters
        if (juliaParams) {
            juliaParams.style.display = fractalType === 'julia' ? 'block' : 'none';
        }
        
        // Determine fractal type
        const isGeometric = ['fractal-tree', 'koch-curve', 'sierpinski'].includes(fractalType);
        
        // Show/hide appropriate controls for geometric vs mathematical fractals
        if (iterationsControl) {
            iterationsControl.style.display = isGeometric ? 'none' : 'block';
        }
        
        if (depthControl) {
            depthControl.style.display = isGeometric ? 'block' : 'none';
        }
        
        // Configure zoom control based on fractal type
        if (zoomControl) {
            if (isGeometric) {
                // Limit zoom for geometric fractals
                const zoomSlider = document.getElementById('zoom');
                zoomSlider.max = '2'; // Limit to 100x zoom max
                zoomSlider.style.opacity = '0.7';
                zoomControl.title = 'Zoom limitado para fractales geométricos';
            } else {
                // Unlimited zoom for mathematical fractals (Mandelbrot, Julia)
                const zoomSlider = document.getElementById('zoom');
                zoomSlider.max = '15'; // Up to 10^15 zoom
                zoomSlider.style.opacity = '1';
                zoomControl.title = 'Zoom infinito disponible';
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
    }

    /**
     * Update UI for new fractal
     */
    updateForFractal(fractal) {
        if (!fractal) return;

        this.isUpdating = true;

        // Update parameter values from fractal
        const params = fractal.parameters;
        const fractalName = fractal.getName().toLowerCase();
        const isGeometric = ['fractaltree', 'kochcurve', 'sierpinski'].includes(fractalName);
        
        if (isGeometric) {
            // For geometric fractals, use depth parameter
            if (params.depth !== undefined) {
                this.updateSliderFromValue('depth', params.depth);
            }
        } else {
            // For mathematical fractals, use maxIterations
            if (params.maxIterations !== undefined) {
                this.updateSliderFromValue('iterations', params.maxIterations);
            }
        }
        
        if (params.escapeRadius !== undefined) {
            this.updateSliderFromValue('radius', params.escapeRadius);
        }
        
        // Update Julia-specific parameters
        if (fractal.getName() === 'Julia') {
            const cRealInput = document.getElementById('julia-c-real');
            const cImagInput = document.getElementById('julia-c-imag');
            
            if (cRealInput && params.cReal !== undefined) {
                cRealInput.value = params.cReal.toFixed(6);
            }
            
            if (cImagInput && params.cImag !== undefined) {
                cImagInput.value = params.cImag.toFixed(6);
            }
        }

        this.isUpdating = false;
    }

    /**
     * Format number in scientific notation
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
     * Show toast notification
     */
    showToast(message) {
        // Create toast element
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
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
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
}
