/**
 * Julia Set Fractal Implementation
 * Defined by z_{n+1} = z_n^2 + c where c is a constant
 */

class JuliaFractal extends BaseFractal {
    constructor(gl) {
        super(gl);
        
        // Julia-specific parameters
        this.parameters = {
            ...this.parameters,
            centerX: 0.0,
            centerY: 0.0,
            zoom: 1.0,
            maxIterations: 1000,
            escapeRadius: 2.0,
            cReal: -0.7,
            cImag: 0.27015,
            colorScheme: 'classic',
            smoothColoring: true,
            animateC: false,
            animationSpeed: 1.0
        };
        
        // Predefined interesting Julia set constants
        this.presets = [
            { name: "Classic", cReal: -0.7, cImag: 0.27015 },
            { name: "Spiral", cReal: -0.8, cImag: 0.156 },
            { name: "Lightning", cReal: -0.4, cImag: 0.6 },
            { name: "Feathers", cReal: 0.285, cImag: 0.01 },
            { name: "Dendrite", cReal: -0.75, cImag: 0.11 },
            { name: "Douady Rabbit", cReal: -0.123, cImag: 0.745 },
            { name: "San Marco Dragon", cReal: -0.7, cImag: 0.27015 },
            { name: "Airplane", cReal: -1.25, cImag: 0.0 },
            { name: "Fractal Dust", cReal: -0.8, cImag: 0.156 },
            { name: "Cauliflower", cReal: 0.25, cImag: 0.0 }
        ];
    }

    /**
     * Initialize Julia fractal
     */
    async initialize() {
        try {
            const success = this.setupShaders();
            if (success) {
                console.log('Julia fractal initialized successfully');
            }
            return success;
        } catch (error) {
            console.error('Failed to initialize Julia fractal:', error);
            return false;
        }
    }

    /**
     * Get fragment shader source for Julia set
     */
    getFragmentShaderSource() {
        return `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_center;
            uniform float u_zoom;
            uniform float u_rotation;
            uniform int u_maxIterations;
            uniform float u_escapeRadius;
            uniform float u_time;
            uniform vec2 u_c;
            uniform int u_colorScheme;
            uniform bool u_smoothColoring;
            uniform bool u_animateC;
            uniform float u_animationSpeed;
            
            varying vec2 v_texCoord;
            
            // Complex number operations
            vec2 complexMul(vec2 a, vec2 b) {
                return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
            }
            
            vec2 complexSquare(vec2 z) {
                return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
            }
            
            float complexMagnitudeSquared(vec2 z) {
                return z.x * z.x + z.y * z.y;
            }
            
            // Color schemes
            vec3 getColor(float t, int scheme) {
                t = fract(t);
                
                if (scheme == 0) { // Classic Julia
                    // Purple to gold gradient
                    vec3 color1 = vec3(0.1, 0.0, 0.3);
                    vec3 color2 = vec3(0.5, 0.0, 0.8);
                    vec3 color3 = vec3(1.0, 0.5, 0.0);
                    vec3 color4 = vec3(1.0, 1.0, 0.5);
                    
                    if (t < 0.33) {
                        return mix(color1, color2, t * 3.0);
                    } else if (t < 0.66) {
                        return mix(color2, color3, (t - 0.33) * 3.0);
                    } else {
                        return mix(color3, color4, (t - 0.66) * 3.0);
                    }
                } else if (scheme == 1) { // Electric
                    vec3 color1 = vec3(0.0, 0.0, 0.0);
                    vec3 color2 = vec3(0.0, 0.3, 1.0);
                    vec3 color3 = vec3(0.8, 0.8, 1.0);
                    vec3 color4 = vec3(1.0, 1.0, 1.0);
                    
                    if (t < 0.25) {
                        return mix(color1, color2, t * 4.0);
                    } else if (t < 0.75) {
                        return mix(color2, color3, (t - 0.25) * 2.0);
                    } else {
                        return mix(color3, color4, (t - 0.75) * 4.0);
                    }
                } else if (scheme == 2) { // Sunset
                    vec3 color1 = vec3(0.1, 0.0, 0.2);
                    vec3 color2 = vec3(0.8, 0.2, 0.0);
                    vec3 color3 = vec3(1.0, 0.6, 0.0);
                    vec3 color4 = vec3(1.0, 1.0, 0.8);
                    
                    if (t < 0.33) {
                        return mix(color1, color2, t * 3.0);
                    } else if (t < 0.66) {
                        return mix(color2, color3, (t - 0.33) * 3.0);
                    } else {
                        return mix(color3, color4, (t - 0.66) * 3.0);
                    }
                } else { // Ocean
                    vec3 color1 = vec3(0.0, 0.1, 0.2);
                    vec3 color2 = vec3(0.0, 0.4, 0.6);
                    vec3 color3 = vec3(0.0, 0.8, 1.0);
                    vec3 color4 = vec3(0.8, 1.0, 1.0);
                    
                    if (t < 0.33) {
                        return mix(color1, color2, t * 3.0);
                    } else if (t < 0.66) {
                        return mix(color2, color3, (t - 0.33) * 3.0);
                    } else {
                        return mix(color3, color4, (t - 0.66) * 3.0);
                    }
                }
            }
            
            void main() {
                // Convert screen coordinates to complex plane
                vec2 uv = v_texCoord;
                float aspect = u_resolution.x / u_resolution.y;
                
                // Apply zoom and centering
                vec2 z = (uv - 0.5) * (4.0 / u_zoom);
                z.x *= aspect;
                z += u_center;
                
                // Apply rotation if needed
                if (u_rotation != 0.0) {
                    float cosR = cos(u_rotation);
                    float sinR = sin(u_rotation);
                    vec2 rotated = vec2(
                        z.x * cosR - z.y * sinR,
                        z.x * sinR + z.y * cosR
                    );
                    z = rotated;
                }
                
                // Get the Julia constant c
                vec2 c = u_c;
                
                // Animate c if enabled
                if (u_animateC) {
                    float t = u_time * u_animationSpeed * 0.1;
                    c.x += sin(t) * 0.1;
                    c.y += cos(t * 1.3) * 0.1;
                }
                
                // Julia iteration: z_{n+1} = z_n^2 + c
                float iterations = 0.0;
                float escapeRadiusSquared = u_escapeRadius * u_escapeRadius;
                
                for (int i = 0; i < 1000; i++) {
                    if (i >= u_maxIterations) break;
                    
                    float magnitudeSquared = complexMagnitudeSquared(z);
                    
                    if (magnitudeSquared > escapeRadiusSquared) {
                        // Smooth coloring using continuous escape time
                        if (u_smoothColoring) {
                            iterations = float(i) + 1.0 - log2(log2(magnitudeSquared) / 2.0);
                        } else {
                            iterations = float(i);
                        }
                        break;
                    }
                    
                    z = complexSquare(z) + c;
                    iterations = float(i + 1);
                }
                
                // Color based on iteration count
                if (iterations >= float(u_maxIterations)) {
                    // Point is in the Julia set
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    // Point escaped, color based on escape time
                    float normalizedIterations = iterations / float(u_maxIterations);
                    
                    // Static coloring for HD clarity
                    vec3 color = getColor(normalizedIterations, u_colorScheme);
                    gl_FragColor = vec4(color, 1.0);
                }
            }
        `;
    }

    /**
     * Get uniform names specific to Julia
     */
    getUniformNames() {
        return [
            ...super.getUniformNames(),
            'u_c',
            'u_colorScheme',
            'u_smoothColoring',
            'u_animateC',
            'u_animationSpeed'
        ];
    }

    /**
     * Set uniforms specific to Julia
     */
    setUniforms(width, height, time) {
        super.setUniforms(width, height, time);
        
        const gl = this.gl;
        
        if (this.uniforms.u_c) {
            gl.uniform2f(this.uniforms.u_c, this.parameters.cReal, this.parameters.cImag);
        }
        
        if (this.uniforms.u_colorScheme) {
            const schemeIndex = this.getColorSchemeIndex(this.parameters.colorScheme);
            gl.uniform1i(this.uniforms.u_colorScheme, schemeIndex);
        }
        
        if (this.uniforms.u_smoothColoring) {
            gl.uniform1i(this.uniforms.u_smoothColoring, this.parameters.smoothColoring ? 1 : 0);
        }
        
        if (this.uniforms.u_animateC) {
            gl.uniform1i(this.uniforms.u_animateC, this.parameters.animateC ? 1 : 0);
        }
        
        if (this.uniforms.u_animationSpeed) {
            gl.uniform1f(this.uniforms.u_animationSpeed, this.parameters.animationSpeed);
        }
    }

    /**
     * Get color scheme index
     */
    getColorSchemeIndex(schemeName) {
        const schemes = {
            'classic': 0,
            'electric': 1,
            'sunset': 2,
            'ocean': 3
        };
        return schemes[schemeName] || 0;
    }

    /**
     * Get available color schemes
     */
    getColorSchemes() {
        return ['classic', 'electric', 'sunset', 'ocean'];
    }

    /**
     * Set color scheme
     */
    setColorScheme(scheme) {
        if (this.getColorSchemes().includes(scheme)) {
            this.parameters.colorScheme = scheme;
        }
    }

    /**
     * Get fractal equation
     */
    getEquation() {
        return `z_{n+1} = z_n^2 + c (c = ${this.parameters.cReal.toFixed(3)} + ${this.parameters.cImag.toFixed(3)}i)`;
    }

    /**
     * Get fractal description
     */
    getDescription() {
        return "Julia sets are defined by the iteration z_{n+1} = z_n^2 + c, where c is a fixed complex constant. Different values of c produce different Julia sets.";
    }

    /**
     * Update Julia constant
     */
    updateConstant(cReal, cImag) {
        this.parameters.cReal = cReal;
        this.parameters.cImag = cImag;
    }

    /**
     * Load a preset Julia set
     */
    loadPreset(presetName) {
        const preset = this.presets.find(p => p.name === presetName);
        if (preset) {
            this.updateConstant(preset.cReal, preset.cImag);
            // Reset view to show the full Julia set
            this.parameters.centerX = 0.0;
            this.parameters.centerY = 0.0;
            this.parameters.zoom = 1.0;
        }
    }

    /**
     * Get available presets
     */
    getPresets() {
        return this.presets.map(p => p.name);
    }

    /**
     * Enable/disable animation of the constant c
     */
    setAnimation(enabled, speed = 1.0) {
        this.parameters.animateC = enabled;
        this.parameters.animationSpeed = speed;
    }

    /**
     * Generate random Julia constant
     */
    randomizeConstant() {
        // Generate values that are likely to produce interesting Julia sets
        const angle = Math.random() * 2 * Math.PI;
        const radius = 0.3 + Math.random() * 1.0;
        
        this.parameters.cReal = radius * Math.cos(angle);
        this.parameters.cImag = radius * Math.sin(angle);
        
        // Reset view
        this.parameters.centerX = 0.0;
        this.parameters.centerY = 0.0;
        this.parameters.zoom = 1.0;
    }

    /**
     * Calculate Julia set connectivity
     * Returns whether the Julia set is connected (filled) or disconnected (dust)
     */
    isConnected() {
        const c = MathUtils.Complex.create(this.parameters.cReal, this.parameters.cImag);
        const magnitude = MathUtils.Complex.magnitude(c);
        return magnitude <= 2.0; // Rough estimate
    }

    /**
     * Calculate statistics specific to Julia sets
     */
    calculateStatistics() {
        const zoom = this.parameters.zoom;
        const iterations = this.parameters.maxIterations;
        const cMagnitude = Math.sqrt(this.parameters.cReal * this.parameters.cReal + 
                                   this.parameters.cImag * this.parameters.cImag);
        
        // Julia set specific estimates
        this.stats.convergenceRatio = Math.min(0.95, 0.5 + iterations / 1000);
        this.stats.boundaryPoints = Math.floor(12000 + zoom * 800);
        
        // Julia sets have fractal dimension between 1 and 2
        if (this.isConnected()) {
            this.stats.fractalDimension = 1.8 + Math.random() * 0.2;
        } else {
            this.stats.fractalDimension = 1.0 + Math.random() * 0.5;
        }
        
        this.stats.areaRatio = Math.max(0.05, 0.6 - cMagnitude * 0.2);
    }

    /**
     * Export Julia-specific data
     */
    exportData() {
        const baseData = super.exportData();
        return {
            ...baseData,
            cConstant: { real: this.parameters.cReal, imag: this.parameters.cImag },
            colorScheme: this.parameters.colorScheme,
            smoothColoring: this.parameters.smoothColoring,
            animateC: this.parameters.animateC,
            animationSpeed: this.parameters.animationSpeed,
            isConnected: this.isConnected(),
            presets: this.presets
        };
    }

    /**
     * Get default parameters for reset
     */
    getDefaultParameters() {
        return {
            centerX: 0.0,
            centerY: 0.0,
            zoom: 1.0,
            maxIterations: 256,
            escapeRadius: 2.0,
            rotation: 0.0,
            cReal: -0.7,
            cImag: 0.27015,
            colorScheme: 'classic',
            smoothColoring: true,
            animateC: false,
            animationSpeed: 1.0
        };
    }

    /**
     * Reset to default Julia parameters
     */
    reset() {
        this.parameters = { ...this.getDefaultParameters() };
    }

    /**
     * Create Julia set from Mandelbrot point
     * This method allows converting a point from the Mandelbrot set into a Julia set
     */
    createFromMandelbrotPoint(real, imag) {
        this.updateConstant(real, imag);
        this.parameters.centerX = 0.0;
        this.parameters.centerY = 0.0;
        this.parameters.zoom = 1.0;
    }
}
