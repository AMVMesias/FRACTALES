/**
 * Mandelbrot Set Fractal Implementation
 * Classic fractal defined by z_{n+1} = z_n^2 + c
 */

class MandelbrotFractal extends BaseFractal {
    constructor(gl) {
        super(gl);
        
        // Mandelbrot-specific parameters
        this.parameters = {
            ...this.parameters,
            centerX: -0.5,
            centerY: 0.0,
            zoom: 1.0,
            maxIterations: 1000,
            escapeRadius: 2.0,
            colorScheme: 'classic',
            smoothColoring: true,
            juliaMode: false
        };
    }

    /**
     * Initialize Mandelbrot fractal
     */
    async initialize() {
        try {
            const success = this.setupShaders();
            if (success) {
                console.log('Mandelbrot fractal initialized successfully');
            }
            return success;
        } catch (error) {
            console.error('Failed to initialize Mandelbrot fractal:', error);
            return false;
        }
    }

    /**
     * Get fragment shader source for Mandelbrot set
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
            uniform int u_colorScheme;
            uniform bool u_smoothColoring;
            uniform bool u_highPrecision;
            uniform float u_qualityScale;
            
            varying vec2 v_texCoord;
            
            // Double precision simulation using two floats
            struct vec2d {
                vec2 hi;
                vec2 lo;
            };
            
            vec2d split(vec2 a) {
                vec2 c = a * 134217729.0; // 2^27 + 1
                vec2 abig = c - a;
                vec2 ahi = c - abig;
                vec2 alo = a - ahi;
                return vec2d(ahi, alo);
            }
            
            vec2d add(vec2d a, vec2d b) {
                vec2 s = a.hi + b.hi;
                vec2 v = s - a.hi;
                vec2 e = (a.hi - (s - v)) + (b.hi - v);
                return vec2d(s, e + a.lo + b.lo);
            }
            
            vec2d mul(vec2d a, vec2d b) {
                vec2 c11 = a.hi * b.hi;
                vec2d cc11 = split(a.hi);
                vec2d cc22 = split(b.hi);
                vec2 c21 = cc11.hi * cc22.hi - c11;
                c21 = c21 + cc11.hi * cc22.lo + cc11.lo * cc22.hi;
                vec2 c2 = a.hi * b.lo + a.lo * b.hi;
                vec2 t1 = c11 + c2;
                vec2 e = t1 - c11;
                vec2 t2 = ((c2 - e) + (c11 - (t1 - e))) + c21 + a.lo * b.lo;
                return vec2d(t1, t2);
            }
            
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
            
            // High precision complex multiplication
            vec2d complexMulDP(vec2d a, vec2d b) {
                vec2d real_part = add(mul(vec2d(vec2(a.hi.x, a.lo.x), vec2(0.0)), vec2d(vec2(b.hi.x, b.lo.x), vec2(0.0))), 
                                     mul(vec2d(vec2(-a.hi.y, -a.lo.y), vec2(0.0)), vec2d(vec2(b.hi.y, b.lo.y), vec2(0.0))));
                vec2d imag_part = add(mul(vec2d(vec2(a.hi.x, a.lo.x), vec2(0.0)), vec2d(vec2(b.hi.y, b.lo.y), vec2(0.0))), 
                                     mul(vec2d(vec2(a.hi.y, a.lo.y), vec2(0.0)), vec2d(vec2(b.hi.x, b.lo.x), vec2(0.0))));
                return vec2d(vec2(real_part.hi.x, imag_part.hi.x), vec2(real_part.lo.x, imag_part.lo.x));
            }
            
            // Color schemes
            vec3 getColor(float t, int scheme) {
                t = fract(t); // Ensure t is in [0,1]
                
                if (scheme == 0) { // Classic
                    // Blue to red gradient with smooth transitions
                    vec3 color1 = vec3(0.0, 0.0, 0.5);
                    vec3 color2 = vec3(0.0, 0.5, 1.0);
                    vec3 color3 = vec3(1.0, 1.0, 0.0);
                    vec3 color4 = vec3(1.0, 0.0, 0.0);
                    
                    if (t < 0.33) {
                        return mix(color1, color2, t * 3.0);
                    } else if (t < 0.66) {
                        return mix(color2, color3, (t - 0.33) * 3.0);
                    } else {
                        return mix(color3, color4, (t - 0.66) * 3.0);
                    }
                } else if (scheme == 1) { // Fire
                    vec3 color1 = vec3(0.0, 0.0, 0.0);
                    vec3 color2 = vec3(1.0, 0.0, 0.0);
                    vec3 color3 = vec3(1.0, 1.0, 0.0);
                    vec3 color4 = vec3(1.0, 1.0, 1.0);
                    
                    if (t < 0.33) {
                        return mix(color1, color2, t * 3.0);
                    } else if (t < 0.66) {
                        return mix(color2, color3, (t - 0.33) * 3.0);
                    } else {
                        return mix(color3, color4, (t - 0.66) * 3.0);
                    }
                } else if (scheme == 2) { // Ice
                    vec3 color1 = vec3(0.0, 0.0, 0.1);
                    vec3 color2 = vec3(0.0, 0.5, 1.0);
                    vec3 color3 = vec3(0.5, 0.8, 1.0);
                    vec3 color4 = vec3(1.0, 1.0, 1.0);
                    
                    if (t < 0.33) {
                        return mix(color1, color2, t * 3.0);
                    } else if (t < 0.66) {
                        return mix(color2, color3, (t - 0.33) * 3.0);
                    } else {
                        return mix(color3, color4, (t - 0.66) * 3.0);
                    }
                } else { // HSV rainbow
                    float hue = t * 6.0;
                    float c = 1.0;
                    float x = c * (1.0 - abs(mod(hue, 2.0) - 1.0));
                    
                    vec3 rgb;
                    if (hue < 1.0) rgb = vec3(c, x, 0.0);
                    else if (hue < 2.0) rgb = vec3(x, c, 0.0);
                    else if (hue < 3.0) rgb = vec3(0.0, c, x);
                    else if (hue < 4.0) rgb = vec3(0.0, x, c);
                    else if (hue < 5.0) rgb = vec3(x, 0.0, c);
                    else rgb = vec3(c, 0.0, x);
                    
                    return rgb;
                }
            }
            
            void main() {
                // Convert screen coordinates to complex plane
                vec2 uv = v_texCoord;
                float aspect = u_resolution.x / u_resolution.y;
                
                // Apply zoom and centering
                vec2 c;
                if (u_zoom > 50.0) {
                    // High precision mode
                    float precisionScale = 4.0 / u_zoom;
                    vec2 adjustedUV = uv;
                    adjustedUV.x *= aspect;
                    
                    float offsetX = u_center.x - precisionScale * 0.5;
                    float offsetY = u_center.y - precisionScale * 0.5;
                    
                    c = vec2(
                        offsetX + adjustedUV.x * precisionScale,
                        offsetY + adjustedUV.y * precisionScale
                    );
                } else {
                    // Standard precision
                    vec2 scaled = (uv - 0.5) * (4.0 / u_zoom);
                    scaled.x *= aspect;
                    c = scaled + u_center;
                }
                
                // Apply rotation if needed
                if (u_rotation != 0.0) {
                    float cosR = cos(u_rotation);
                    float sinR = sin(u_rotation);
                    vec2 rotated = vec2(
                        c.x * cosR - c.y * sinR,
                        c.x * sinR + c.y * cosR
                    );
                    c = rotated;
                }
                
                // Anti-aliasing by slight jitter for high zoom
                if (u_zoom > 100.0 && u_qualityScale > 2.0) {
                    float jitter = sin(gl_FragCoord.x * 12.9898 + gl_FragCoord.y * 78.233) * 43758.5453;
                    jitter = (fract(jitter) - 0.5) * 0.001 / u_zoom;
                    c += vec2(jitter, -jitter);
                }
                
                // Calculate Mandelbrot iterations
                float iterations = 0.0;
                float escapeRadiusSquared = u_escapeRadius * u_escapeRadius;
                
                if (u_highPrecision && u_zoom > 100.0) {
                    // High precision mode for deep zooms
                    vec2d z = vec2d(vec2(0.0), vec2(0.0));
                    vec2d c_dp = vec2d(c, vec2(0.0));
                    
                    int maxIter = u_maxIterations;
                    if (maxIter > 4000) maxIter = 4000;
                    
                    for (int i = 0; i < 4000; i++) {
                        if (i >= maxIter) break;
                        
                        float magnitudeSquared = z.hi.x * z.hi.x + z.hi.y * z.hi.y;
                        
                        if (magnitudeSquared > escapeRadiusSquared) {
                            iterations = float(i);
                            if (u_smoothColoring) {
                                float logMag = log(magnitudeSquared) * 0.5;
                                iterations += 1.0 - log(logMag / log(u_escapeRadius)) / log(2.0);
                            }
                            break;
                        }
                        
                        vec2d z_squared = complexMulDP(z, z);
                        z = add(z_squared, c_dp);
                        iterations = float(i + 1);
                    }
                } else {
                    // Standard precision mode
                    vec2 z = vec2(0.0, 0.0);
                    int maxIter = u_maxIterations;
                    if (maxIter > 4000) maxIter = 4000;
                    
                    for (int i = 0; i < 4000; i++) {
                        if (i >= maxIter) break;
                        
                        float magnitudeSquared = complexMagnitudeSquared(z);
                        
                        if (magnitudeSquared > escapeRadiusSquared) {
                            if (u_smoothColoring) {
                                float logMag = log(magnitudeSquared) * 0.5;
                                iterations = float(i) + 1.0 - log(logMag / log(u_escapeRadius)) / log(2.0);
                            } else {
                                iterations = float(i);
                            }
                            break;
                        }
                        
                        z = complexSquare(z) + c;
                        iterations = float(i + 1);
                    }
                }
                
                // Generate color
                if (iterations >= float(u_maxIterations)) {
                    // Point is in the Mandelbrot set
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    // Point escaped, calculate color
                    float normalizedIterations = iterations / float(u_maxIterations);
                    
                    // Enhanced coloring
                    vec3 color = getColor(normalizedIterations, u_colorScheme);
                    
                    // Additional dithering for high zooms to reduce pixelation
                    if (u_zoom > 5.0) {
                        float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.01;
                        color = clamp(color + vec3(dither), 0.0, 1.0);
                    }
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            }
        `;
    }

    /**
     * Get uniform names specific to Mandelbrot
     */
    getUniformNames() {
        return [
            ...super.getUniformNames(),
            'u_colorScheme',
            'u_smoothColoring',
            'u_highPrecision',
            'u_qualityScale'
        ];
    }

    /**
     * Set uniforms specific to Mandelbrot
     */
    setUniforms(width, height, time) {
        super.setUniforms(width, height, time);
        
        const gl = this.gl;
        
        if (this.uniforms.u_colorScheme) {
            const schemeIndex = this.getColorSchemeIndex(this.parameters.colorScheme);
            gl.uniform1i(this.uniforms.u_colorScheme, schemeIndex);
        }
        
        if (this.uniforms.u_smoothColoring) {
            gl.uniform1i(this.uniforms.u_smoothColoring, this.parameters.smoothColoring ? 1 : 0);
        }
        
        if (this.uniforms.u_highPrecision) {
            gl.uniform1i(this.uniforms.u_highPrecision, this.parameters.highPrecision ? 1 : 0);
        }
        
        if (this.uniforms.u_qualityScale) {
            const qualityScale = this.qualityScale || 1.0;
            gl.uniform1f(this.uniforms.u_qualityScale, qualityScale);
        }
    }

    /**
     * Get color scheme index
     */
    getColorSchemeIndex(schemeName) {
        const schemes = {
            'classic': 0,
            'fire': 1,
            'ice': 2,
            'rainbow': 3
        };
        return schemes[schemeName] || 0;
    }

    /**
     * Get available color schemes
     */
    getColorSchemes() {
        return ['classic', 'fire', 'ice', 'rainbow'];
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
        return "z_{n+1} = z_n^2 + c";
    }

    /**
     * Get fractal description
     */
    getDescription() {
        return "The Mandelbrot set is the set of complex numbers c for which the function f(z) = z² + c does not diverge when iterated from z = 0.";
    }

    /**
     * Calculate statistics specific to Mandelbrot
     */
    calculateStatistics() {
        // For Mandelbrot set, we can estimate some properties
        const zoom = this.parameters.zoom;
        const iterations = this.parameters.maxIterations;
        
        // Rough estimates based on zoom level and iteration count
        this.stats.convergenceRatio = Math.min(0.95, 0.6 + iterations / 1000);
        this.stats.boundaryPoints = Math.floor(15000 + zoom * 1000);
        this.stats.fractalDimension = 2.0; // Mandelbrot boundary has dimension 2
        this.stats.areaRatio = Math.max(0.1, 0.7 - Math.log10(zoom) * 0.1);
    }

    /**
     * Get interesting points in the Mandelbrot set
     */
    getInterestingPoints() {
        return [
            { name: "Main Body", x: -0.5, y: 0.0, zoom: 1.0 },
            { name: "Seahorse Valley", x: -0.7463, y: 0.1102, zoom: 100 },
            { name: "Lightning", x: -1.25066, y: 0.02012, zoom: 2000 },
            { name: "Spiral", x: -0.7269, y: 0.1889, zoom: 8000 },
            { name: "Mini Mandelbrot", x: -0.16, y: 1.0405, zoom: 50 },
            { name: "Feather", x: -0.7463, y: 0.1102, zoom: 5000 },
            { name: "Tendrils", x: 0.3245046418497685, y: 0.04855101129280834, zoom: 1000 }
        ];
    }

    /**
     * Navigate to an interesting point
     */
    navigateToPoint(pointName) {
        const points = this.getInterestingPoints();
        const point = points.find(p => p.name === pointName);
        
        if (point) {
            this.updateParameters({
                centerX: point.x,
                centerY: point.y,
                zoom: point.zoom
            });
        }
    }

    /**
     * Enable Julia set mode (converts to Julia set fractal)
     */
    enableJuliaMode(cReal = -0.7, cImag = 0.27015) {
        this.parameters.juliaMode = true;
        this.parameters.juliaC = { real: cReal, imag: cImag };
    }

    /**
     * Disable Julia set mode
     */
    disableJuliaMode() {
        this.parameters.juliaMode = false;
        delete this.parameters.juliaC;
    }

    /**
     * Export Mandelbrot-specific data
     */
    exportData() {
        const baseData = super.exportData();
        return {
            ...baseData,
            colorScheme: this.parameters.colorScheme,
            smoothColoring: this.parameters.smoothColoring,
            interestingPoints: this.getInterestingPoints()
        };
    }

    /**
     * Get default parameters for reset
     */
    getDefaultParameters() {
        return {
            centerX: -0.5,
            centerY: 0.0,
            zoom: 1.0,
            maxIterations: 256,
            escapeRadius: 2.0,
            rotation: 0.0,
            colorScheme: 'classic',
            smoothColoring: true
        };
    }

    /**
     * Reset to default Mandelbrot parameters
     */
    reset() {
        this.parameters = { ...this.getDefaultParameters() };
    }
}
