import { BaseFractal } from './base-fractal.js';

export class MandelbrotFractal extends BaseFractal {
    constructor(gl) {
        super(gl);
        this.name = 'Mandelbrot';
        this.defaultParameters = {
            center: { x: -0.5, y: 0.0 },
            zoom: 1.0,
            maxIterations: 256,
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
            
            // Double precision operations
            vec2d add(vec2d a, vec2d b) {
                vec2 s = a.hi + b.hi;
                vec2 e = s - a.hi;
                vec2 t = ((b.hi - e) + (a.hi - (s - e))) + a.lo + b.lo;
                return vec2d(s, t);
            }
            
            vec2d mul(vec2d a, vec2d b) {
                vec2 c11 = a.hi * b.hi;
                vec2 c21 = a.lo * b.hi + a.hi * b.lo;
                vec2 c2 = a.hi * b.hi;
                vec2 e = c11 - c2;
                vec2 t1 = c11 - e;
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
                } else { // Ocean
                    vec3 color1 = vec3(0.0, 0.1, 0.4);
                    vec3 color2 = vec3(0.0, 0.5, 0.8);
                    vec3 color3 = vec3(0.4, 0.9, 1.0);
                    vec3 color4 = vec3(1.0, 1.0, 1.0);
                    
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
                
                // Simple anti-aliasing: calculate multiple samples per pixel for high zoom
                vec3 finalColor = vec3(0.0);
                float samples = 1.0;
                
                // Increase samples for high zoom levels based on quality
                if (u_zoom > 100.0 && u_qualityScale > 2.0) {
                    samples = 2.0; // 2x2 = 4 samples
                }
                if (u_zoom > 10000.0 && u_qualityScale > 4.0) {
                    samples = 3.0; // 3x3 = 9 samples  
                }
                if (u_zoom > 100000.0 && u_qualityScale > 6.0) {
                    samples = 4.0; // 4x4 = 16 samples
                }
                
                float totalSamples = samples * samples;
                
                for (float x = 0.0; x < samples; x++) {
                    for (float y = 0.0; y < samples; y++) {
                        // Sub-pixel offset
                        vec2 offset = vec2(x, y) / samples - 0.5;
                        vec2 sampleUV = uv + offset / u_resolution;
                        
                        // Apply zoom and centering
                        vec2 c;
                        if (u_zoom > 50.0) {
                            // High precision mode
                            float precisionScale = 4.0 / u_zoom;
                            vec2 adjustedUV = sampleUV;
                            adjustedUV.x *= aspect;
                            
                            float offsetX = u_center.x - precisionScale * 0.5;
                            float offsetY = u_center.y - precisionScale * 0.5;
                            
                            c = vec2(
                                offsetX + adjustedUV.x * precisionScale,
                                offsetY + adjustedUV.y * precisionScale
                            );
                        } else {
                            // Standard precision
                            vec2 scaled = (sampleUV - 0.5) * (4.0 / u_zoom);
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
                        
                        // Generate color for this sample
                        vec3 sampleColor;
                        if (iterations >= float(u_maxIterations)) {
                            // Point is in the Mandelbrot set
                            sampleColor = vec3(0.0, 0.0, 0.0);
                        } else {
                            // Point escaped, calculate color
                            float normalizedIterations = iterations / float(u_maxIterations);
                            
                            // Enhanced coloring for HD clarity
                            sampleColor = getColor(normalizedIterations, u_colorScheme);
                            
                            // Additional dithering for high zooms
                            if (u_zoom > 5.0) {
                                float dither = (fract(sin(dot(gl_FragCoord.xy + offset, vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.01;
                                sampleColor = clamp(sampleColor + vec3(dither), 0.0, 1.0);
                            }
                        }
                        
                        finalColor += sampleColor;
                    }
                }
                
                // Average all samples
                finalColor /= totalSamples;
                
                gl_FragColor = vec4(finalColor, 1.0);
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
    getColorSchemeIndex(scheme) {
        const schemes = {
            'classic': 0,
            'fire': 1,
            'ocean': 2
        };
        return schemes[scheme] || 0;
    }

    /**
     * Get name of the fractal
     */
    getName() {
        return 'Mandelbrot Set';
    }

    /**
     * Check if fractal supports Julia mode
     */
    supportsJuliaMode() {
        return true;
    }
}
