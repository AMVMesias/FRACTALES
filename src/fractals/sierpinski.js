/**
 * Sierpinski Triangle Fractal Implementation
 * Classic recursive triangle fractal
 */

class SierpinskiFractal extends BaseFractal {
    constructor(gl) {
        super(gl);
        
        this.parameters = {
            ...this.parameters,
            centerX: 0.0,
            centerY: 0.0,
            zoom: 1.0,
            recursionDepth: 6,
            colorScheme: 'classic',
            renderMode: 'filled', // 'filled' or 'outline'
            animateColors: false
        };
        
        this.triangles = [];
        this.vertexBuffer = null;
        this.vertexCount = 0;
    }

    /**
     * Initialize Sierpinski Triangle fractal
     */
    async initialize() {
        try {
            const success = this.setupShaders();
            if (success) {
                this.generateSierpinskiTriangle();
                console.log('Sierpinski Triangle fractal initialized successfully');
            }
            return success;
        } catch (error) {
            console.error('Failed to initialize Sierpinski Triangle fractal:', error);
            return false;
        }
    }

    /**
     * Get vertex shader for triangle rendering
     */
    getVertexShaderSource() {
        return `
            attribute vec2 a_position;
            attribute float a_depth;
            uniform vec2 u_center;
            uniform float u_zoom;
            uniform float u_rotation;
            uniform vec2 u_resolution;
            varying float v_depth;
            
            void main() {
                // Pass depth to fragment shader
                v_depth = a_depth;
                
                // Apply transformations
                vec2 pos = a_position;
                
                // Apply rotation
                if (u_rotation != 0.0) {
                    float cosR = cos(u_rotation);
                    float sinR = sin(u_rotation);
                    pos = vec2(
                        pos.x * cosR - pos.y * sinR,
                        pos.x * sinR + pos.y * cosR
                    );
                }
                
                // Apply zoom and center
                pos = pos * u_zoom + u_center;
                
                // Convert to clip space
                float aspect = u_resolution.x / u_resolution.y;
                pos.x /= aspect;
                
                gl_Position = vec4(pos, 0.0, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for triangle rendering
     */
    getFragmentShaderSource() {
        return `
            precision mediump float;
            uniform int u_colorScheme;
            uniform float u_time;
            uniform bool u_animateColors;
            varying float v_depth;
            
            vec3 getSierpinskiColor(int scheme, float depth) {
                float t = depth / 8.0; // Normalize depth
                
                if (scheme == 0) { // Classic rainbow
                    vec3 color1 = vec3(1.0, 0.0, 0.0); // Red
                    vec3 color2 = vec3(0.0, 1.0, 0.0); // Green
                    vec3 color3 = vec3(0.0, 0.0, 1.0); // Blue
                    
                    if (t < 0.5) {
                        return mix(color1, color2, t * 2.0);
                    } else {
                        return mix(color2, color3, (t - 0.5) * 2.0);
                    }
                } else if (scheme == 1) { // Fire
                    vec3 color1 = vec3(1.0, 1.0, 0.0); // Yellow
                    vec3 color2 = vec3(1.0, 0.5, 0.0); // Orange
                    vec3 color3 = vec3(1.0, 0.0, 0.0); // Red
                    
                    if (t < 0.5) {
                        return mix(color1, color2, t * 2.0);
                    } else {
                        return mix(color2, color3, (t - 0.5) * 2.0);
                    }
                } else if (scheme == 2) { // Ocean
                    vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
                    vec3 color2 = vec3(0.0, 0.5, 1.0); // Blue
                    vec3 color3 = vec3(0.0, 0.0, 0.5); // Dark blue
                    
                    if (t < 0.5) {
                        return mix(color1, color2, t * 2.0);
                    } else {
                        return mix(color2, color3, (t - 0.5) * 2.0);
                    }
                } else { // Purple
                    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
                    vec3 color2 = vec3(0.5, 0.0, 1.0); // Purple
                    vec3 color3 = vec3(0.2, 0.0, 0.5); // Dark purple
                    
                    if (t < 0.5) {
                        return mix(color1, color2, t * 2.0);
                    } else {
                        return mix(color2, color3, (t - 0.5) * 2.0);
                    }
                }
            }
            
            void main() {
                float animatedDepth = v_depth;
                
                if (u_animateColors) {
                    animatedDepth += sin(u_time * 2.0) * 2.0;
                }
                
                vec3 color = getSierpinskiColor(u_colorScheme, animatedDepth);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    /**
     * Get uniform names for Sierpinski Triangle
     */
    getUniformNames() {
        return [
            'u_resolution',
            'u_center',
            'u_zoom',
            'u_rotation',
            'u_colorScheme',
            'u_time',
            'u_animateColors'
        ];
    }

    /**
     * Generate Sierpinski Triangle vertices
     */
    generateSierpinskiTriangle() {
        this.triangles = [];
        
        // Start with equilateral triangle
        const size = 0.8;
        const height = size * Math.sqrt(3) / 2;
        
        const p1 = [0, height / 2];          // Top
        const p2 = [-size / 2, -height / 2]; // Bottom left
        const p3 = [size / 2, -height / 2];  // Bottom right
        
        // Generate Sierpinski triangle recursively
        this.generateSierpinskiRecursive(p1, p2, p3, this.parameters.recursionDepth, 0);
        
        // Convert triangles to vertex array
        this.createVertexBuffer();
    }

    /**
     * Generate Sierpinski triangle recursively
     */
    generateSierpinskiRecursive(p1, p2, p3, depth, currentDepth) {
        if (depth === 0) {
            // Base case: add triangle
            this.triangles.push({
                vertices: [p1, p2, p3],
                depth: currentDepth
            });
            return;
        }
        
        // Calculate midpoints
        const m1 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]; // Midpoint of p1-p2
        const m2 = [(p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2]; // Midpoint of p2-p3
        const m3 = [(p3[0] + p1[0]) / 2, (p3[1] + p1[1]) / 2]; // Midpoint of p3-p1
        
        // Recursively generate three smaller triangles
        this.generateSierpinskiRecursive(p1, m1, m3, depth - 1, currentDepth + 1);
        this.generateSierpinskiRecursive(m1, p2, m2, depth - 1, currentDepth + 1);
        this.generateSierpinskiRecursive(m3, m2, p3, depth - 1, currentDepth + 1);
    }

    /**
     * Create vertex buffer from triangles
     */
    createVertexBuffer() {
        const vertices = [];
        
        this.triangles.forEach(triangle => {
            const [p1, p2, p3] = triangle.vertices;
            const depth = triangle.depth;
            
            // Add triangle vertices with depth information
            vertices.push(p1[0], p1[1], depth);
            vertices.push(p2[0], p2[1], depth);
            vertices.push(p3[0], p3[1], depth);
        });
        
        this.vertexCount = vertices.length / 3;
        
        const gl = this.gl;
        
        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
        }
        
        const vertexData = new Float32Array(vertices);
        this.vertexBuffer = WebGLUtils.createBuffer(gl, vertexData);
    }

    /**
     * Render the Sierpinski Triangle
     */
    render(width, height, time = 0) {
        if (!this.isInitialized || !this.program || !this.vertexBuffer) {
            return;
        }

        const gl = this.gl;
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Set uniforms
        this.setUniforms(width, height, time);
        
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        
        // Setup position attribute
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        const depthLocation = gl.getAttribLocation(this.program, 'a_depth');
        
        if (positionLocation !== -1) {
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 12, 0);
        }
        
        if (depthLocation !== -1) {
            gl.enableVertexAttribArray(depthLocation);
            gl.vertexAttribPointer(depthLocation, 1, gl.FLOAT, false, 12, 8);
        }
        
        // Draw triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
        
        // Check for errors
        WebGLUtils.checkError(gl, 'Sierpinski triangle render');
    }

    /**
     * Set uniforms for Sierpinski Triangle
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
        
        if (this.uniforms.u_colorScheme) {
            const schemeIndex = this.getColorSchemeIndex(this.parameters.colorScheme);
            gl.uniform1i(this.uniforms.u_colorScheme, schemeIndex);
        }
        
        if (this.uniforms.u_time) {
            gl.uniform1f(this.uniforms.u_time, time);
        }
        
        if (this.uniforms.u_animateColors) {
            gl.uniform1i(this.uniforms.u_animateColors, this.parameters.animateColors ? 1 : 0);
        }
    }

    /**
     * Update parameters and regenerate if needed
     */
    updateParameters(newParams) {
        const oldDepth = this.parameters.recursionDepth;
        super.updateParameters(newParams);
        
        // Regenerate if recursion depth changed
        if (this.parameters.recursionDepth !== oldDepth) {
            this.generateSierpinskiTriangle();
        }
    }

    /**
     * Get color scheme index
     */
    getColorSchemeIndex(schemeName) {
        const schemes = {
            'classic': 0,
            'fire': 1,
            'ocean': 2,
            'purple': 3
        };
        return schemes[schemeName] || 0;
    }

    /**
     * Get available color schemes
     */
    getColorSchemes() {
        return ['classic', 'fire', 'ocean', 'purple'];
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
        return "T → T₁ + T₂ + T₃ (recursive subdivision)";
    }

    /**
     * Get fractal description
     */
    getDescription() {
        return "The Sierpinski triangle is a fractal attractive fixed set with the overall shape of an equilateral triangle.";
    }

    /**
     * Calculate statistics for Sierpinski triangle
     */
    calculateStatistics() {
        const depth = this.parameters.recursionDepth;
        
        // Sierpinski triangle specific properties
        this.stats.convergenceRatio = 1.0; // Always converges
        this.stats.boundaryPoints = Math.pow(3, depth); // 3^n triangles
        this.stats.fractalDimension = Math.log(3) / Math.log(2); // ≈ 1.585
        this.stats.areaRatio = Math.pow(3, depth) / Math.pow(4, depth); // (3/4)^n
    }

    /**
     * Get default parameters
     */
    getDefaultParameters() {
        return {
            centerX: 0.0,
            centerY: 0.0,
            zoom: 1.0,
            recursionDepth: 6,
            rotation: 0.0,
            colorScheme: 'classic',
            renderMode: 'filled',
            animateColors: false
        };
    }

    /**
     * Update iterations (maps to recursion depth for Sierpinski triangle)
     */
    updateIterations(value) {
        const newDepth = Math.max(1, Math.min(10, Math.round(value)));
        if (newDepth !== this.parameters.recursionDepth) {
            this.parameters.recursionDepth = newDepth;
            this.generateSierpinskiTriangle();
        }
    }

    /**
     * Reset to default parameters
     */
    reset() {
        this.parameters = { ...this.getDefaultParameters() };
        this.generateSierpinskiTriangle();
    }

    /**
     * Cleanup resources
     */
    dispose() {
        super.dispose();
        
        if (this.vertexBuffer) {
            this.gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }
    }
}
