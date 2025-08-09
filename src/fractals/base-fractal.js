/**
 * Base Fractal Class
 * Abstract base class for all fractal implementations
 */

class BaseFractal {
    constructor(gl) {
        if (new.target === BaseFractal) {
            throw new Error("BaseFractal is an abstract class and cannot be instantiated directly");
        }
        
        this.gl = gl;
        this.program = null;
        this.uniforms = {};
        this.quad = null;
        this.isInitialized = false;
        this.renderTime = 0;
        this.lastFrameTime = 0;
        
        // Default parameters
        this.parameters = {
            maxIterations: 256,
            escapeRadius: 2.0,
            zoom: 1.0,
            centerX: 0.0,
            centerY: 0.0,
            rotation: 0.0,
            highPrecision: false,
            adaptiveIterations: false, // Desactivado por defecto - usuario controla iteraciones
            baseIterations: 256
        };
        
        // Statistics for analysis
        this.stats = {
            convergenceRatio: 0.0,
            boundaryPoints: 0,
            fractalDimension: 0.0,
            areaRatio: 0.0
        };
    }

    /**
     * Initialize the fractal (must be implemented by subclasses)
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        throw new Error("initialize() must be implemented by subclass");
    }

    /**
     * Get vertex shader source (common for most fractals)
     * @returns {string} Vertex shader source code
     */
    getVertexShaderSource() {
        return `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
    }

    /**
     * Get fragment shader source (must be implemented by subclasses)
     * @returns {string} Fragment shader source code
     */
    getFragmentShaderSource() {
        throw new Error("getFragmentShaderSource() must be implemented by subclass");
    }

    /**
     * Setup shader program and uniforms
     * @returns {boolean} Success status
     */
    setupShaders() {
        const vertexSource = this.getVertexShaderSource();
        const fragmentSource = this.getFragmentShaderSource();
        
        this.program = WebGLUtils.createProgram(this.gl, vertexSource, fragmentSource);
        
        if (!this.program) {
            console.error('Failed to create shader program for', this.constructor.name);
            return false;
        }
        
        // Get uniform locations
        const uniformNames = this.getUniformNames();
        this.uniforms = WebGLUtils.getUniformLocations(this.gl, this.program, uniformNames);
        
        // Create full-screen quad
        this.quad = WebGLUtils.createFullScreenQuad(this.gl);
        
        this.isInitialized = true;
        return true;
    }

    /**
     * Get list of uniform names (should be overridden by subclasses)
     * @returns {string[]} Array of uniform names
     */
    getUniformNames() {
        return [
            'u_resolution',
            'u_center',
            'u_zoom',
            'u_rotation',
            'u_maxIterations',
            'u_escapeRadius',
            'u_time'
        ];
    }

    /**
     * Update fractal parameters
     * @param {Object} newParams - New parameter values
     */
    updateParameters(newParams) {
        // Use the infinite zoom method if available, otherwise fallback to basic update
        if (this.updateParametersForInfiniteZoom) {
            this.updateParametersForInfiniteZoom(newParams);
        } else {
            Object.assign(this.parameters, newParams);
        }
    }

    /**
     * Render the fractal
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} time - Current time in seconds
     */
    render(width, height, time = 0) {
        if (!this.isInitialized || !this.program) {
            console.warn('Fractal not initialized');
            return;
        }

        const startTime = performance.now();
        
        const gl = this.gl;
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Set up vertex attributes
        WebGLUtils.setupVertexAttributes(gl, this.program, this.quad.vertexBuffer);
        
        // Set uniforms
        this.setUniforms(width, height, time);
        
        // Bind index buffer and draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quad.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.quad.vertexCount, gl.UNSIGNED_SHORT, 0);
        
        // Calculate render time
        this.renderTime = performance.now() - startTime;
        
        // Check for WebGL errors
        WebGLUtils.checkError(gl, 'fractal render');
    }

    /**
     * Set shader uniforms (should be overridden by subclasses for additional uniforms)
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} time - Current time
     */
    setUniforms(width, height, time) {
        const gl = this.gl;
        
        if (this.uniforms.u_resolution) {
            gl.uniform2f(this.uniforms.u_resolution, width, height);
        }
        
        if (this.uniforms.u_center) {
            gl.uniform2f(this.uniforms.u_center, this.parameters.centerX, this.parameters.centerY);
        }
        
        if (this.uniforms.u_zoom) {
            gl.uniform1f(this.uniforms.u_zoom, this.parameters.zoom);
        }
        
        if (this.uniforms.u_rotation) {
            gl.uniform1f(this.uniforms.u_rotation, this.parameters.rotation);
        }
        
        if (this.uniforms.u_maxIterations) {
            gl.uniform1i(this.uniforms.u_maxIterations, this.parameters.maxIterations);
        }
        
        if (this.uniforms.u_escapeRadius) {
            gl.uniform1f(this.uniforms.u_escapeRadius, this.parameters.escapeRadius);
        }
        
        if (this.uniforms.u_time) {
            gl.uniform1f(this.uniforms.u_time, time);
        }
    }

    /**
     * Calculate statistics about the fractal (should be implemented by subclasses)
     * This method should update this.stats object
     */
    calculateStatistics() {
        // Default implementation - subclasses should override
        this.stats.convergenceRatio = Math.random() * 0.3 + 0.7; // Mock data
        this.stats.boundaryPoints = Math.floor(Math.random() * 50000);
        this.stats.fractalDimension = 1.8 + Math.random() * 0.4;
        this.stats.areaRatio = Math.random() * 0.8 + 0.1;
    }

    /**
     * Get fractal name
     * @returns {string} Fractal name
     */
    getName() {
        return this.constructor.name.replace('Fractal', '');
    }

    /**
     * Get fractal equation as LaTeX string (should be overridden by subclasses)
     * @returns {string} LaTeX equation
     */
    getEquation() {
        return "f(z) = z";
    }

    /**
     * Get fractal description
     * @returns {string} Description
     */
    getDescription() {
        return "A mathematical fractal";
    }

    /**
     * Get current parameter values formatted for display
     * @returns {Object} Formatted parameters
     */
    getFormattedParameters() {
        return {
            'Max Iterations': this.parameters.maxIterations.toString(),
            'Escape Radius': this.parameters.escapeRadius.toFixed(2),
            'Zoom Level': this.formatScientific(this.parameters.zoom),
            'Center': `(${this.parameters.centerX.toFixed(6)}, ${this.parameters.centerY.toFixed(6)})`,
            'Rotation': `${(this.parameters.rotation * 180 / Math.PI).toFixed(1)}°`
        };
    }

    /**
     * Format number in scientific notation
     * @param {number} value - Number to format
     * @returns {string} Formatted string
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
     * Export fractal data
     * @returns {Object} Exportable data
     */
    exportData() {
        return {
            type: this.getName(),
            parameters: { ...this.parameters },
            stats: { ...this.stats },
            renderTime: this.renderTime,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import fractal data
     * @param {Object} data - Imported data
     */
    importData(data) {
        if (data.type === this.getName()) {
            this.updateParameters(data.parameters);
        }
    }

    /**
     * Reset to default parameters
     */
    reset() {
        this.parameters = {
            maxIterations: 256,
            escapeRadius: 2.0,
            zoom: 1.0,
            centerX: 0.0,
            centerY: 0.0,
            rotation: 0.0
        };
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
        
        if (this.quad) {
            if (this.quad.vertexBuffer) {
                this.gl.deleteBuffer(this.quad.vertexBuffer);
            }
            if (this.quad.indexBuffer) {
                this.gl.deleteBuffer(this.quad.indexBuffer);
            }
            this.quad = null;
        }
        
        this.isInitialized = false;
    }

    /**
     * Validate parameters before rendering
     * @returns {boolean} True if parameters are valid
     */
    validateParameters() {
        const p = this.parameters;
        
        if (p.maxIterations < 1 || p.maxIterations > 10000) {
            console.warn('Invalid maxIterations:', p.maxIterations);
            return false;
        }
        
        if (p.escapeRadius <= 0 || p.escapeRadius > 1000) {
            console.warn('Invalid escapeRadius:', p.escapeRadius);
            return false;
        }
        
        if (p.zoom <= 0 || !isFinite(p.zoom)) {
            console.warn('Invalid zoom:', p.zoom);
            return false;
        }
        
        if (!isFinite(p.centerX) || !isFinite(p.centerY)) {
            console.warn('Invalid center coordinates:', p.centerX, p.centerY);
            return false;
        }
        
        return true;
    }

    /**
     * Get color scheme options (can be overridden by subclasses)
     * @returns {string[]} Array of color scheme names
     */
    getColorSchemes() {
        return ['Classic', 'Fire', 'Ice', 'Electric', 'Sunset', 'Ocean'];
    }

    /**
     * Set color scheme (should be implemented by subclasses if supported)
     * @param {string} scheme - Color scheme name
     */
    setColorScheme(scheme) {
        console.log(`Color scheme ${scheme} not implemented for ${this.getName()}`);
    }

    /**
     * Calculate adaptive iterations based on zoom level
     * @param {number} zoom - Current zoom level
     * @returns {number} Recommended iteration count
     */
    calculateAdaptiveIterations(zoom) {
        if (!this.parameters.adaptiveIterations) {
            return this.parameters.baseIterations;
        }

        // Más agresivo: las iteraciones aumentan significativamente con el zoom
        const baseIterations = this.parameters.baseIterations;
        
        // Fórmula similar al ejemplo: aumentar iteraciones cuando hay más zoom
        let adaptiveIterations;
        
        if (zoom <= 1) {
            adaptiveIterations = baseIterations;
        } else if (zoom <= 10) {
            // Zoom bajo: incremento suave
            adaptiveIterations = Math.floor(baseIterations * (1 + Math.log10(zoom) * 0.5));
        } else if (zoom <= 100) {
            // Zoom medio: incremento moderado
            adaptiveIterations = Math.floor(baseIterations * (1.5 + Math.log10(zoom) * 0.7));
        } else if (zoom <= 1000) {
            // Zoom alto: incremento fuerte
            adaptiveIterations = Math.floor(baseIterations * (2 + Math.log10(zoom) * 1.0));
        } else if (zoom <= 10000) {
            // Zoom muy alto: incremento muy fuerte
            adaptiveIterations = Math.floor(baseIterations * (3 + Math.log10(zoom) * 1.5));
        } else {
            // Zoom extremo: máximo incremento
            adaptiveIterations = Math.floor(baseIterations * (4 + Math.log10(zoom) * 2.0));
        }
        
        // Asegurar mínimo de iteraciones para zoom alto
        if (zoom > 100) {
            adaptiveIterations = Math.max(adaptiveIterations, baseIterations * 2);
        }
        if (zoom > 1000) {
            adaptiveIterations = Math.max(adaptiveIterations, baseIterations * 3);
        }
        if (zoom > 10000) {
            adaptiveIterations = Math.max(adaptiveIterations, baseIterations * 4);
        }
        
        // Cap máximo para evitar problemas de rendimiento
        return Math.min(adaptiveIterations, 8000);
    }

    /**
     * Determine if high precision mode should be enabled
     * @param {number} zoom - Current zoom level
     * @returns {boolean} Whether to use high precision
     */
    shouldUseHighPrecision(zoom) {
        // Enable high precision very early to prevent pixelation - like ejemplo.html
        return zoom > 20 || this.parameters.highPrecision; // Reduced from 50 to 20
    }

    /**
     * Check if we need complete recalculation (like ejemplo.html does)
     * @param {number} zoom - Current zoom level
     * @returns {boolean} Whether to force complete recalculation
     */
    needsCompleteRecalculation(zoom) {
        // Para zooms extremos, necesitamos recalculo completo como en ejemplo.html
        return zoom > 1000000;
    }

    /**
     * Update parameters for infinite zoom capability
     * @param {Object} newParams - New parameters to update
     */
    updateParametersForInfiniteZoom(newParams) {
        // Guardar iteraciones actuales para no cambiarlas automáticamente
        const currentIterations = this.parameters.maxIterations;
        
        // Update basic parameters
        Object.assign(this.parameters, newParams);
        
        // NO cambiar iteraciones automáticamente - solo el usuario las controla
        // Restaurar las iteraciones si no se especificaron explícitamente
        if (!newParams.hasOwnProperty('maxIterations')) {
            this.parameters.maxIterations = currentIterations;
        }
        
        // Activar alta precisión automáticamente para evitar pixelación (como ejemplo.html)
        if (newParams.zoom) {
            const needsHighPrecision = this.shouldUseHighPrecision(newParams.zoom);
            const needsRecalc = this.needsCompleteRecalculation(newParams.zoom);
            
            this.parameters.highPrecision = needsHighPrecision || needsRecalc;
            
            // Update escape radius based on zoom level for better precision
            this.parameters.escapeRadius = this.getAdaptiveEscapeRadius(newParams.zoom);
            
            // Log solo para zoom y precisión (SIN iteraciones automáticas)
            if (Math.log10(newParams.zoom) % 1 < 0.1) { // Log cada orden de magnitud
                console.log(`🔍 Zoom: ${newParams.zoom.toExponential(2)}x | Iteraciones: ${this.parameters.maxIterations} (manual) | Alta Precisión: ${this.parameters.highPrecision ? 'Sí' : 'No'}${needsRecalc ? ' | Recálculo completo' : ''}`);
            }
        }
        
        // Si se especifican iteraciones explícitamente, usar el método manual
        if (newParams.hasOwnProperty('maxIterations')) {
            this.updateIterations(newParams.maxIterations);
        }
    }

    /**
     * Force recalculation of adaptive parameters (útil para refresco inmediato)
     */
    recalculateAdaptiveParameters() {
        if (this.parameters.zoom) {
            this.updateParametersForInfiniteZoom({ zoom: this.parameters.zoom });
        }
    }

    /**
     * Update iterations manually (usuario controla - como en ejemplo.html)
     * @param {number} iterations - Nueva cantidad de iteraciones
     */
    updateIterations(iterations) {
        this.parameters.maxIterations = Math.max(1, Math.min(8000, iterations));
        console.log(`🎯 Iteraciones actualizadas manualmente: ${this.parameters.maxIterations} | Zoom actual: ${this.parameters.zoom?.toExponential(2) || '1.00e+0'}x`);
    }

    /**
     * Get zoom-dependent escape radius
     * @param {number} zoom - Current zoom level
     * @returns {number} Adjusted escape radius
     */
    getAdaptiveEscapeRadius(zoom) {
        // For very high zooms, we might need a larger escape radius to capture fine details
        const baseRadius = this.parameters.escapeRadius;
        if (zoom > 10000) {
            return Math.min(baseRadius * 1.5, 10.0);
        }
        return baseRadius;
    }
}
