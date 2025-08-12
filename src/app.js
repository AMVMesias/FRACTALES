/**
 * FractalLab - Visualizador Interactivo de Fractales
 * 
 * Aplicación principal que coordina todos los componentes del visualizador:
 * - Renderizado WebGL de alta calidad
 * - Interfaz de usuario intuitiva
 * - Modo pantalla completa para exploración inmersiva
 * - Controles de zoom infinito con optimización automática
 * - Guardado de imágenes en alta resolución
 * 
 * Coordina todos los componentes y maneja el bucle de renderizado principal.
 */

class FractalApp {
    constructor() {
        // Elementos principales del canvas y WebGL
        this.canvas = null;
        this.gl = null;
        this.viewport = null;
        
        // Gestores de entrada y controles
        this.inputHandler = null;
        this.keyboardHandler = null;
        
        // Sistema de fractales
        this.currentFractal = null;
        this.fractals = new Map();
        
        // Control de renderizado y rendimiento
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Componentes de la interfaz
        this.performanceMonitor = null;
        this.uiControls = null;
        this.consoleManager = null;
        
        // Flag para prevenir descargas múltiples de imágenes
        this.isCapturing = false;
        
        // Configuración de calidad de renderizado
        this.qualitySettings = {
            renderScale: 1.0,        // Escala de resolución (1.0 = resolución nativa)
            precisionMode: 'float',  // Precisión de punto flotante
            antialiasingLevel: 0,    // Nivel de antialiasing
            highPrecision: false     // Modo alta precisión para zooms extremos
        };
        
        // Control de animación y tiempo
        this.animationId = null;
        this.startTime = performance.now();
        
        // Flag de inicialización
        this.isInitialized = false;
    }

    /**
     * Inicializar la aplicación FractalLab
     * 
     * Configura todos los componentes necesarios:
     * - Contexto WebGL con configuración optimizada
     * - Sistema de viewport y controles de entrada
     * - Interfaz de usuario y controles
     * - Carga inicial de fractales disponibles
     * 
     * @returns {boolean} true si la inicialización fue exitosa
     */
    async initialize() {
        try {
            this.log('info', 'Initializing FractalLab application...');
            
            // Get canvas element
            this.canvas = document.getElementById('fractalCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            // Initialize WebGL with quality settings
            const webglOptions = {
                qualityScale: this.qualitySettings.renderScale,
                antialias: this.qualitySettings.antialiasingLevel > 0,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            };
            
            this.gl = WebGLUtils.initWebGL(this.canvas, webglOptions);
            if (!this.gl) {
                throw new Error('Failed to initialize WebGL');
            }
            
            // Log WebGL info and update UI
            const glInfo = WebGLUtils.getContextInfo(this.gl);
            this.log('debug', `WebGL initialized: ${glInfo.renderer}`);
            this.updateGPUInfo(glInfo);
            
            // Initialize viewport and input handling
            this.viewport = new TransformUtils.Viewport();
            this.inputHandler = new TransformUtils.InputHandler(this.canvas, this.viewport, this);
            
            // Initialize UI components first
            this.initializeUI();
            
            // Initialize keyboard handler with UI controls reference
            this.keyboardHandler = new TransformUtils.KeyboardHandler(this.viewport, this.uiControls);
            // Hook reset view button
            const resetBtn = document.getElementById('resetViewBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.viewport.reset();
                });
            }
            
            // Initialize fractals
            await this.initializeFractals();
            
            // Set initial fractal
            this.setFractal('mandelbrot');
            
            // Setup resize handling
            this.setupResizeHandler();
            
            // Initial render
            this.resize();
            
            this.isInitialized = true;
            this.log('info', 'FractalLab initialized successfully');
            
            return true;
            
        } catch (error) {
            this.log('error', `Initialization failed: ${error.message}`);
            this.showError(error.message);
            return false;
        }
    }

    /**
     * Initialize all fractal types
     */
    async initializeFractals() {
        console.log('Initializing fractals...');
        
        // Check if fractal classes are available
        const availableClasses = {
            MandelbrotFractal: typeof MandelbrotFractal !== 'undefined',
            JuliaFractal: typeof JuliaFractal !== 'undefined',
            KochCurveFractal: typeof KochCurveFractal !== 'undefined',
            SierpinskiFractal: typeof SierpinskiFractal !== 'undefined',
            FractalTreeFractal: typeof FractalTreeFractal !== 'undefined'
        };
        console.log('Available fractal classes:', availableClasses);
        
        const fractalTypes = [
            { name: 'mandelbrot', class: MandelbrotFractal },
            { name: 'julia', class: JuliaFractal },
            { name: 'koch-curve', class: KochCurveFractal },
            { name: 'sierpinski', class: SierpinskiFractal },
            { name: 'fractal-tree', class: FractalTreeFractal }
        ];
        
        for (const { name, class: FractalClass } of fractalTypes) {
            try {
                if (typeof FractalClass === 'undefined') {
                    this.log('error', `${name} fractal class not found - check script loading order`);
                    continue;
                }
                
                const fractal = new FractalClass(this.gl);
                const success = await fractal.initialize();
                
                if (success) {
                    this.fractals.set(name, fractal);
                    this.log('debug', `${name} fractal initialized successfully`);
                } else {
                    this.log('error', `Failed to initialize ${name} fractal`);
                }
            } catch (error) {
                this.log('error', `Error initializing ${name} fractal: ${error.message}`);
                console.error(`Stack trace for ${name}:`, error);
            }
        }
        
        console.log('Fractals initialized:', Array.from(this.fractals.keys()));
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Initialize console manager
        this.consoleManager = new ConsoleManager();
        
        // Initialize performance monitor
        this.performanceMonitor = new PerformanceMonitor();
        
        // Initialize controls
        this.uiControls = new UIControls(this);
        
        this.log('debug', 'UI components initialized');
    }

    /**
     * Set active fractal
     */
    setFractal(fractalName) {
        const fractal = this.fractals.get(fractalName);
        if (fractal) {
            this.currentFractal = fractal;
            
            // Set quality scale for anti-pixelation
            this.currentFractal.qualityScale = this.qualitySettings.renderScale;
            
            this.log('info', `Switched to ${fractal.getName()} fractal`);
            
            // Update UI to reflect new fractal
            this.uiControls.updateForFractal(fractal);
            
            // Update equation display
            this.updateEquationDisplay();
            
            // Reset viewport if needed
            if (fractalName === 'julia') {
                this.viewport.setTarget(0, 0, 1, 0);
            } else if (fractalName === 'mandelbrot') {
                this.viewport.setTarget(-0.5, 0, 1, 0);
            }
            
            return true;
        } else {
            this.log('error', `Fractal '${fractalName}' not found`);
            return false;
        }
    }

    /**
     * Start the render loop
     */
    start() {
        if (!this.isInitialized) {
            this.log('error', 'Cannot start: application not initialized');
            return;
        }
        
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        this.log('info', 'Starting render loop');
        this.renderLoop();
    }

    /**
     * Stop the render loop
     */
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.log('info', 'Render loop stopped');
    }

    /**
     * Handle canvas resize (normal y fullscreen)
     * @param {boolean} force - Forzar actualización de viewport
     */
    resize(force = false) {
        if (!this.canvas || !this.gl) return;

        try {
            // Si estamos en fullscreen sobre .viewport, ajustar canvas a pantalla completa
            const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
            if (isFullscreen) {
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                if (force || this.canvas.width !== vw || this.canvas.height !== vh) {
                    this.canvas.style.width = vw + 'px';
                    this.canvas.style.height = vh + 'px';
                    this.canvas.width = vw * (window.devicePixelRatio || 1);
                    this.canvas.height = vh * (window.devicePixelRatio || 1);
                    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                    this.log('debug', `Fullscreen resize -> ${this.canvas.width}x${this.canvas.height}`);
                    if (this.currentFractal) this.currentFractal.markDirty();
                }
                return;
            }

            const resized = WebGLUtils.resizeCanvasToDisplaySize(this.canvas, this.gl);
            if (resized) {
                this.log('debug', `Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
                if (this.currentFractal) this.currentFractal.markDirty();
            } else if (force) {
                // Forzar viewport aunque no cambie dimensiones lógicas
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        } catch (error) {
            this.log('error', `Resize failed: ${error.message}`);
        }
    }

    /**
     * Main render loop
     */
    renderLoop() {
        if (!this.isRunning) return;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        const time = (currentTime - this.startTime) / 1000;
        
        // Update FPS calculation
        this.frameCount++;
        if (deltaTime >= 1000) { // Update FPS every second
            this.fps = Math.round(this.frameCount * 1000 / deltaTime);
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            // Update FPS display
            const fpsElement = document.getElementById('fpsCounter');
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
        }
        
        // Update viewport animation
        const viewportChanged = this.viewport.update();
        
        // Update keyboard input
        this.keyboardHandler.update();
        
        // Update performance monitoring
        this.performanceMonitor.update(deltaTime);
        
        // Render current fractal
        if (this.currentFractal) {
            this.render(time);
            
            // Update statistics periodically
            if (this.frameCount % 60 === 0) { // Every ~1 second at 60fps
                this.updateStatistics();
            }
        }
        
        // Schedule next frame
    this.animationId = requestAnimationFrame(() => this.renderLoop());
    }

    /**
     * Render current fractal
     */
    render(time) {
        const gl = this.gl;
        
        // Mark render start for performance measurement
        performance.mark('render-start');
        
        // Update canvas size if needed
        const resized = WebGLUtils.resizeCanvasToDisplaySize(this.canvas, gl, this.qualitySettings.renderScale);
        if (resized) {
            this.log('debug', `Canvas resized to ${this.canvas.width}x${this.canvas.height} (Quality: ${this.qualitySettings.renderScale}x)`);
            // Update viewport to maintain aspect ratio
            if (this.viewport) {
                this.viewport.updateAspectRatio(this.canvas.width / this.canvas.height);
            }
        }
        
        // Clear canvas
        WebGLUtils.clearCanvas(gl, 0, 0, 0, 1);
        
        // Update fractal parameters from viewport
        const params = this.viewport.getShaderParams(this.canvas.width, this.canvas.height);
        
        // Solo actualizar parámetros de viewport (SIN iteraciones)
        this.currentFractal.updateParameters({
            centerX: params.center[0],
            centerY: params.center[1],
            zoom: params.zoom,
            rotation: params.rotation
        });
        
        // Update UI only on significant zoom changes (para reflejar zoom en UI)
        const currentZoom = this.currentFractal.parameters.zoom;
        const newZoom = params.zoom;
        const zoomChanged = !currentZoom || Math.abs(Math.log10(newZoom) - Math.log10(currentZoom)) > 0.1;
        
        if (zoomChanged && this.uiControls) {
            this.uiControls.updateFromFractal(this.currentFractal);
        }
        
        // Render fractal
        const renderStartTime = performance.now();
        
        // Show performance warning for extreme zooms (like ejemplo.html gets slow)
        const zoom = this.currentFractal.parameters.zoom;
        const iterations = this.currentFractal.parameters.maxIterations;
        
        if (zoom > 1000000) {
            const warningElement = document.getElementById('performanceWarning');
            if (warningElement) {
                warningElement.style.display = 'block';
                warningElement.textContent = `⚠️ Zoom extremo (${zoom.toExponential(1)}x) - El renderizado puede ser lento pero sin pixelación`;
            }
        } else {
            const warningElement = document.getElementById('performanceWarning');
            if (warningElement) {
                warningElement.style.display = 'none';
            }
        }
        
        // Show zoom tips for high zoom with low iterations + suggest iterations
        if (zoom > 100 && iterations < zoom / 50) {
            const tipsElement = document.getElementById('zoomTips');
            if (tipsElement) {
                tipsElement.style.display = 'block';
                
                // Calculate recommended iterations based on zoom and quality
                const quality = this.qualitySettings.renderScale;
                let recommendedIterations;
                
                if (zoom < 1000) {
                    recommendedIterations = Math.floor(zoom * 3 * quality);
                } else if (zoom < 10000) {
                    recommendedIterations = Math.floor(zoom * 1.5 * quality);
                } else {
                    recommendedIterations = Math.floor(zoom * 0.8 * quality);
                }
                
                recommendedIterations = Math.min(recommendedIterations, 15000);
                
                // Update tip text with specific recommendation
                const tipText = tipsElement.querySelector('.tip-text');
                if (tipText) {
                    tipText.innerHTML = `
                        <strong>⚠️ Zoom alto detectado!</strong><br>
                        • Zoom actual: ${zoom.toFixed(1)}x<br>
                        • Iteraciones actuales: ${iterations}<br>
                        • <strong>Recomendado: ${recommendedIterations} iteraciones</strong><br>
                        • Usa el control manual de iteraciones para eliminar pixelación
                    `;
                }
            }
        } else {
            const tipsElement = document.getElementById('zoomTips');
            if (tipsElement) {
                tipsElement.style.display = 'none';
            }
        }
        
        this.currentFractal.render(this.canvas.width, this.canvas.height, time);
        const renderTime = performance.now() - renderStartTime;
        
        // Mark render end and measure
        performance.mark('render-end');
        performance.measure('render-time', 'render-start', 'render-end');
        
        // Update performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.recordRenderTime(renderTime);
            this.performanceMonitor.estimateGPUUsage(
                renderTime,
                this.currentFractal.parameters.maxIterations,
                this.currentFractal.parameters.zoom
            );
        }
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        if (!this.currentFractal) return;
        
        this.currentFractal.calculateStatistics();
        const stats = this.currentFractal.stats;
        
        // Update convergence
        const convergenceElement = document.getElementById('convergence');
        if (convergenceElement) {
            convergenceElement.textContent = `${(stats.convergenceRatio * 100).toFixed(1)}%`;
        }
        
        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${stats.convergenceRatio * 100}%`;
        }
        
        // Update fractal dimension
        const dimensionElement = document.getElementById('fractalDimension');
        if (dimensionElement) {
            dimensionElement.textContent = stats.fractalDimension.toFixed(3);
        }
        
        // Update boundary points
        const boundaryElement = document.getElementById('boundaryPoints');
        if (boundaryElement) {
            boundaryElement.textContent = stats.boundaryPoints.toLocaleString();
        }
        
        // Update area ratio
        const areaElement = document.getElementById('areaRatio');
        if (areaElement) {
            areaElement.textContent = stats.areaRatio.toFixed(3);
        }
    }

    /**
     * Update equation display
     */
    updateEquationDisplay() {
        if (!this.currentFractal) return;
        
        const equationElement = document.querySelector('.preview-equation');
        if (equationElement) {
            equationElement.textContent = this.currentFractal.getEquation();
        }
        
        const statsElement = document.querySelector('.preview-stats');
        if (statsElement) {
            const params = this.currentFractal.getFormattedParameters();
            statsElement.textContent = 
                `${this.currentFractal.getDescription().substring(0, 50)}... | ${params['Max Iterations']} iterations`;
        }
    }

    /**
     * Setup window resize handler
     */
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resize(), 100);
        });
    }

    /**
     * Handle window resize
     */
    resize() {
        if (this.canvas && this.gl) {
            const resized = WebGLUtils.resizeCanvasToDisplaySize(this.canvas, this.gl);
            if (resized) {
                this.log('debug', `Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
                // Update viewport to maintain aspect ratio
                if (this.viewport) {
                    this.viewport.updateAspectRatio(this.canvas.width / this.canvas.height);
                }
            }
        }
    }

    /**
     * Capturar imagen actual del fractal
     * Función mejorada que evita descargas duplicadas
     */
    captureImage() {
        if (!this.canvas) {
            this.log('error', 'No hay canvas para capturar');
            return;
        }
        
        try {
            // Prevenir múltiples descargas simultáneas
            if (this.isCapturing) {
                this.log('warning', 'Captura ya en progreso...');
                return;
            }
            
            this.isCapturing = true;
            
            // Crear nombre de archivo descriptivo
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const fractalName = this.currentFractal ? this.currentFractal.getName().toLowerCase() : 'fractal';
            const zoom = this.viewport ? this.viewport.zoom.toExponential(2) : '1e0';
            
            const filename = `fractal_${fractalName}_zoom_${zoom}_${timestamp}.png`;
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.download = filename;
            link.href = this.canvas.toDataURL('image/png', 1.0); // Máxima calidad
            
            // Descargar archivo
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.log('info', `Imagen capturada: ${filename}`);
            
            // Liberar flag después de un pequeño delay
            setTimeout(() => {
                this.isCapturing = false;
            }, 1000);
            
        } catch (error) {
            this.log('error', `Error al capturar imagen: ${error.message}`);
            this.isCapturing = false;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create error overlay
        const errorDiv = document.createElement('div');
        errorDiv.className = 'webgl-error';
        errorDiv.innerHTML = `
            <h3>❌ Error</h3>
            <p>${message}</p>
            <p>Please check the console for more details.</p>
        `;
        
        // Replace canvas content
        const canvasArea = document.querySelector('.canvas-area');
        if (canvasArea) {
            canvasArea.innerHTML = '';
            canvasArea.appendChild(errorDiv);
        }
    }

    /**
     * Log message to console
     */
    log(level, message) {
        console[level](`[FractalApp] ${message}`);
        
        if (this.consoleManager) {
            this.consoleManager.addLogEntry(level, message);
        }
    }

    /**
     * Update GPU information in the UI
     * @param {Object} glInfo - WebGL context information
     */
    updateGPUInfo(glInfo) {
        // This will be handled by the performance monitor
        // which has more sophisticated GPU detection
        if (this.performanceMonitor) {
            this.performanceMonitor.detectGPUInfo();
        }
    }

    /**
     * Update quality settings
     */
    updateQualitySettings(newSettings) {
        const oldSettings = { ...this.qualitySettings };
        this.qualitySettings = { ...this.qualitySettings, ...newSettings };
        
        // Update fractal quality scale for shader anti-pixelation
        if (this.currentFractal) {
            this.currentFractal.qualityScale = this.qualitySettings.renderScale;
        }
        
        // Check if we need to reinitialize WebGL
        const needsReinit = 
            oldSettings.renderScale !== this.qualitySettings.renderScale ||
            oldSettings.antialiasingLevel !== this.qualitySettings.antialiasingLevel;
            
        if (needsReinit) {
            this.reinitializeWebGL();
        }
        
        // Update precision for current fractal
        if (this.currentFractal && oldSettings.precisionMode !== this.qualitySettings.precisionMode) {
            this.updateFractalPrecision();
        }
        
        this.log('info', `Quality updated: ${JSON.stringify(this.qualitySettings)}`);
    }

    /**
     * Reinitialize WebGL with new quality settings
     */
    reinitializeWebGL() {
        try {
            const webglOptions = {
                qualityScale: this.qualitySettings.renderScale,
                antialias: this.qualitySettings.antialiasingLevel > 0,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            };
            
            // Store current context
            const oldGL = this.gl;
            
            // Create new context
            this.gl = WebGLUtils.initWebGL(this.canvas, webglOptions);
            
            if (this.gl) {
                // Reinitialize all fractals with new context
                for (const [name, fractal] of this.fractals.entries()) {
                    fractal.gl = this.gl;
                    fractal.initialize();
                }
                
                this.log('info', `WebGL reinitialized with quality scale: ${this.qualitySettings.renderScale}`);
            } else {
                this.gl = oldGL; // Fallback to old context
                this.log('error', 'Failed to reinitialize WebGL');
            }
        } catch (error) {
            this.log('error', `Failed to reinitialize WebGL: ${error.message}`);
        }
    }

    /**
     * Update fractal precision settings
     */
    updateFractalPrecision() {
        if (!this.currentFractal) return;
        
        const highPrecision = this.qualitySettings.precisionMode !== 'float';
        
        if (this.currentFractal.updateParameters) {
            this.currentFractal.updateParameters({
                highPrecision: highPrecision
            });
        }
    }

    /**
     * Update GPU information display
     */
    updateGPUInfo(glInfo) {
        const gpuInfoElement = document.getElementById('gpuInfo');
        if (gpuInfoElement && glInfo) {
            // Extract GPU name from renderer string
            let gpuName = glInfo.renderer || 'GPU Desconocida';
            
            // Clean up common GPU vendor prefixes
            gpuName = gpuName.replace(/^ANGLE \(/, '').replace(/\)$/, '');
            gpuName = gpuName.replace(/^Direct3D11 vs_5_0 ps_5_0, /, '');
            gpuName = gpuName.replace(/^OpenGL ES 3.0 /, '');
            
            // Truncate if too long
            if (gpuName.length > 25) {
                gpuName = gpuName.substring(0, 22) + '...';
            }
            
            gpuInfoElement.textContent = gpuName;
            gpuInfoElement.title = glInfo.renderer; // Full name in tooltip
        }
    }

    /**
     * Get current fractal instance
     */
    getCurrentFractal() {
        return this.currentFractal;
    }

    /**
     * Get viewport instance
     */
    getViewport() {
        return this.viewport;
    }

    /**
     * Update quality settings
     * @param {Object} newSettings - New quality settings
     */
    updateQualitySettings(newSettings) {
        this.qualitySettings = { ...this.qualitySettings, ...newSettings };
        
        // Apply precision mode to current fractal
        if (this.currentFractal && newSettings.precisionMode !== undefined) {
            this.currentFractal.parameters.highPrecision = (newSettings.precisionMode !== 'float');
            this.log('info', `Precision mode changed to: ${newSettings.precisionMode}`);
        }
        
        // Apply render scale
        if (newSettings.renderScale !== undefined) {
            this.log('info', `Render scale changed to: ${newSettings.renderScale}x`);
        }
        
        // If antialiasing changed, we need to reinitialize WebGL
        if (newSettings.antialiasingLevel !== undefined) {
            this.log('info', `Antialiasing changed to: ${newSettings.antialiasingLevel}x`);
        }
    }

    /**
     * Reinitialize WebGL context with new settings
     */
    async reinitializeWebGL() {
        try {
            this.log('info', 'Reinitializing WebGL context...');
            
            // Stop current rendering
            const wasRunning = this.isRunning;
            this.stop();
            
            // Dispose current fractals
            for (const fractal of this.fractals.values()) {
                fractal.dispose();
            }
            this.fractals.clear();
            
            // Reinitialize WebGL with new settings
            const webglOptions = {
                qualityScale: this.qualitySettings.renderScale,
                antialias: this.qualitySettings.antialiasingLevel > 0,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            };
            
            this.gl = WebGLUtils.initWebGL(this.canvas, webglOptions);
            if (!this.gl) {
                throw new Error('Failed to reinitialize WebGL');
            }
            
            // Reinitialize fractals
            await this.initializeFractals();
            
            // Set current fractal again
            const currentFractalName = Object.keys([...this.fractals.entries()]).find(key => 
                this.fractals.get(key) === this.currentFractal
            ) || 'mandelbrot';
            
            this.setFractal(currentFractalName);
            
            // Restart rendering if it was running
            if (wasRunning) {
                this.start();
            }
            
            this.log('info', 'WebGL context reinitialized successfully');
            
        } catch (error) {
            this.log('error', `Failed to reinitialize WebGL: ${error.message}`);
        }
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.stop();
        
        // Dispose all fractals
        for (const fractal of this.fractals.values()) {
            fractal.dispose();
        }
        this.fractals.clear();
        
        this.log('info', 'Application disposed');
    }
}

// Global app instance
let fractalApp = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    fractalApp = new FractalApp();
    
    const success = await fractalApp.initialize();
    if (success) {
        fractalApp.start();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (fractalApp) {
        fractalApp.dispose();
    }
});
