/**
 * Koch Curve Fractal Implementation
 * Classic recursive geometric fractal
 */

class KochCurveFractal extends BaseFractal {
    constructor(gl) {
        super(gl);
        
        this.parameters = {
            ...this.parameters,
            centerX: 0.0,
            centerY: 0.0,
            zoom: 1.0,
            recursionDepth: 4,
            lineWidth: 2.0,
            colorScheme: 'classic',
            showConstruction: false
        };
        
        this.vertices = [];
        this.vertexBuffer = null;
        this.vertexCount = 0;
    }

    /**
     * Initialize Koch Curve fractal
     */
    async initialize() {
        try {
            const success = this.setupShaders();
            if (success) {
                this.generateKochCurve();
                console.log('Koch Curve fractal initialized successfully');
            }
            return success;
        } catch (error) {
            console.error('Failed to initialize Koch Curve fractal:', error);
            return false;
        }
    }

    /**
     * Get vertex shader for line rendering
     */
    getVertexShaderSource() {
        return `
            attribute vec2 a_position;
            uniform vec2 u_center;
            uniform float u_zoom;
            uniform float u_rotation;
            uniform vec2 u_resolution;
            
            void main() {
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
     * Get fragment shader for line rendering
     */
    getFragmentShaderSource() {
        return `
            precision mediump float;
            uniform int u_colorScheme;
            uniform float u_time;
            
            vec3 getKochColor(int scheme) {
                if (scheme == 0) { // Classic blue
                    return vec3(0.2, 0.6, 1.0);
                } else if (scheme == 1) { // Fire
                    return vec3(1.0, 0.4, 0.1);
                } else if (scheme == 2) { // Green
                    return vec3(0.2, 0.8, 0.3);
                } else { // Purple
                    return vec3(0.7, 0.3, 0.9);
                }
            }
            
            void main() {
                vec3 color = getKochColor(u_colorScheme);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    /**
     * Get uniform names for Koch Curve
     */
    getUniformNames() {
        return [
            'u_resolution',
            'u_center',
            'u_zoom',
            'u_rotation',
            'u_colorScheme',
            'u_time'
        ];
    }

    /**
     * Generate Koch Curve vertices
     */
    generateKochCurve() {
        this.vertices = [];
        
        // Start with equilateral triangle
        const side = 0.8;
        const height = side * Math.sqrt(3) / 2;
        
        const p1 = [-side/2, -height/3];
        const p2 = [side/2, -height/3];
        const p3 = [0, 2*height/3];
        
        // Generate three sides of Koch snowflake
        this.generateKochSide(p1, p2, this.parameters.recursionDepth);
        this.generateKochSide(p2, p3, this.parameters.recursionDepth);
        this.generateKochSide(p3, p1, this.parameters.recursionDepth);
        
        this.vertexCount = this.vertices.length / 2;
        
        // Update vertex buffer
        this.updateVertexBuffer();
    }

    /**
     * Generate one side of Koch curve recursively
     */
    generateKochSide(start, end, depth) {
        if (depth === 0) {
            // Base case: draw straight line
            this.vertices.push(start[0], start[1]);
            this.vertices.push(end[0], end[1]);
            return;
        }
        
        // Calculate the four points of Koch curve
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        
        // First third point
        const p1 = [
            start[0] + dx / 3,
            start[1] + dy / 3
        ];
        
        // Second third point
        const p2 = [
            start[0] + 2 * dx / 3,
            start[1] + 2 * dy / 3
        ];
        
        // Peak point (equilateral triangle)
        const px = start[0] + dx / 2 - dy * Math.sqrt(3) / 6;
        const py = start[1] + dy / 2 + dx * Math.sqrt(3) / 6;
        const peak = [px, py];
        
        // Recursively generate the four segments
        this.generateKochSide(start, p1, depth - 1);
        this.generateKochSide(p1, peak, depth - 1);
        this.generateKochSide(peak, p2, depth - 1);
        this.generateKochSide(p2, end, depth - 1);
    }

    /**
     * Update vertex buffer with new data
     */
    updateVertexBuffer() {
        const gl = this.gl;
        
        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
        }
        
        const vertexData = new Float32Array(this.vertices);
        this.vertexBuffer = WebGLUtils.createBuffer(gl, vertexData);
    }

    /**
     * Render the Koch Curve
     */
    render(width, height, time = 0) {
        if (!this.isInitialized || !this.program || !this.vertexBuffer) {
            return;
        }

        const gl = this.gl;
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Set line width
        gl.lineWidth(this.parameters.lineWidth);
        
        // Set uniforms
        this.setUniforms(width, height, time);
        
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        
        // Setup position attribute
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        if (positionLocation !== -1) {
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        }
        
        // Draw lines
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
        
        // Check for errors
        WebGLUtils.checkError(gl, 'Koch curve render');
    }

    /**
     * Set uniforms for Koch Curve
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
    }

    /**
     * Update parameters and regenerate if needed
     */
    updateParameters(newParams) {
        const oldDepth = this.parameters.recursionDepth;
        super.updateParameters(newParams);
        
        // Regenerate if recursion depth changed
        if (this.parameters.recursionDepth !== oldDepth) {
            this.generateKochCurve();
        }
    }

    /**
     * Get color scheme index
     */
    getColorSchemeIndex(schemeName) {
        const schemes = {
            'classic': 0,
            'fire': 1,
            'green': 2,
            'purple': 3
        };
        return schemes[schemeName] || 0;
    }

    /**
     * Get available color schemes
     */
    getColorSchemes() {
        return ['classic', 'fire', 'green', 'purple'];
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
        return "L → L+R++R-L--LL-R+";
    }

    /**
     * Get fractal description
     */
    getDescription() {
        return "The Koch curve is a mathematical curve and one of the earliest fractal curves to have been described.";
    }

    /**
     * Calculate statistics for Koch curve
     */
    calculateStatistics() {
        const depth = this.parameters.recursionDepth;
        
        // Koch curve specific properties
        this.stats.convergenceRatio = 1.0; // Always converges
        this.stats.boundaryPoints = Math.pow(4, depth) * 3; // 4^n segments per side, 3 sides
        this.stats.fractalDimension = Math.log(4) / Math.log(3); // ≈ 1.26
        this.stats.areaRatio = 0.6 + depth * 0.05; // Approximate
    }

    /**
     * Get default parameters
     */
    getDefaultParameters() {
        return {
            centerX: 0.0,
            centerY: 0.0,
            zoom: 1.0,
            recursionDepth: 4,
            rotation: 0.0,
            lineWidth: 2.0,
            colorScheme: 'classic',
            showConstruction: false
        };
    }

    /**
     * Update iterations (maps to recursion depth for Koch curve)
     */
    updateIterations(value) {
        const newDepth = Math.max(1, Math.min(8, Math.round(value)));
        if (newDepth !== this.parameters.recursionDepth) {
            this.parameters.recursionDepth = newDepth;
            this.generateKochCurve();
        }
    }

    /**
     * Reset to default parameters
     */
    reset() {
        this.parameters = { ...this.getDefaultParameters() };
        this.generateKochCurve();
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
