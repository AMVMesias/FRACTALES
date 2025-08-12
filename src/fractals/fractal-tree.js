/**
 * Fractal Tree Implementation
 * Recursive tree fractal with branching
 */

class FractalTreeFractal extends BaseFractal {
    constructor(gl) {
        super(gl);
        
        this.parameters = {
            ...this.parameters,
            centerX: 0.0,
            centerY: -0.3,
            zoom: 1.0,
            recursionDepth: 1,
            branchAngle: 30,  // degrees
            lengthRatio: 0.7,
            branchCount: 2,
            colorScheme: 'classic',
            lineWidth: 1.5,
            leafSize: 3.0,
            randomSeed: 12345  // Fixed seed for consistent randomness
        };
        
        this.branches = [];
        this.vertexBuffer = null;
        this.vertexCount = 0;
        this.seedValue = this.parameters.randomSeed;
    }

    /**
     * Seeded random number generator (deterministic)
     */
    seededRandom() {
        this.seedValue = (this.seedValue * 1664525 + 1013904223) % 4294967296;
        return this.seedValue / 4294967296;
    }

    /**
     * Reset seed for consistent generation
     */
    resetSeed() {
        this.seedValue = this.parameters.randomSeed;
    }

    /**
     * Initialize Fractal Tree
     */
    async initialize() {
        try {
            const success = this.setupShaders();
            if (success) {
                this.generateFractalTree();
                console.log('Fractal Tree initialized successfully');
            }
            return success;
        } catch (error) {
            console.error('Failed to initialize Fractal Tree:', error);
            return false;
        }
    }

    /**
     * Get vertex shader for tree rendering
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
                v_depth = a_depth;
                
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
     * Get fragment shader for tree rendering
     */
    getFragmentShaderSource() {
        return `
            precision mediump float;
            uniform int u_colorScheme;
            uniform float u_time;
            varying float v_depth;
            
            vec3 getTreeColor(int scheme, float depth) {
                float t = depth / 12.0; // Normalize depth
                
                if (scheme == 0) { // Classic brown to green
                    vec3 trunk = vec3(0.4, 0.2, 0.1); // Brown
                    vec3 leaves = vec3(0.1, 0.7, 0.1); // Green
                    return mix(trunk, leaves, t);
                } else if (scheme == 1) { // Autumn
                    vec3 trunk = vec3(0.3, 0.15, 0.05);
                    vec3 orange = vec3(1.0, 0.5, 0.0);
                    vec3 red = vec3(1.0, 0.2, 0.0);
                    
                    if (t < 0.5) {
                        return mix(trunk, orange, t * 2.0);
                    } else {
                        return mix(orange, red, (t - 0.5) * 2.0);
                    }
                } else if (scheme == 2) { // Spring
                    vec3 trunk = vec3(0.4, 0.2, 0.1);
                    vec3 lightGreen = vec3(0.5, 1.0, 0.3);
                    vec3 darkGreen = vec3(0.1, 0.6, 0.1);
                    
                    if (t < 0.5) {
                        return mix(trunk, lightGreen, t * 2.0);
                    } else {
                        return mix(lightGreen, darkGreen, (t - 0.5) * 2.0);
                    }
                } else { // Winter (blue tones)
                    vec3 trunk = vec3(0.2, 0.2, 0.3);
                    vec3 ice = vec3(0.7, 0.9, 1.0);
                    return mix(trunk, ice, t);
                }
            }
            
            void main() {
                vec3 color = getTreeColor(u_colorScheme, v_depth);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    /**
     * Get uniform names
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
     * Generate fractal tree
     */
    generateFractalTree() {
        this.branches = [];
        this.resetSeed(); // Reset seed for consistent generation
        
    // Start with trunk at bottom center (Y increases upward)
    const trunkLength = 0.45;
    const startX = 0.0;
    const startY = -0.95; // push base lower so crown quede centrada
    const endX = 0.0;
    const endY = startY + trunkLength;
        
        // Generate tree recursively
        this.generateBranch(
            startX, startY,
            endX, endY,
            0.0, // 0° = arriba (sin=0, cos=1)
            this.parameters.recursionDepth,
            0,
            trunkLength
        );
        
        // Create vertex buffer
        this.createVertexBuffer();
    }

    /**
     * Generate a branch recursively
     */
    generateBranch(startX, startY, endX, endY, angle, depth, currentDepth, length) {
        // Add current branch
        this.branches.push({
            start: [startX, startY],
            end: [endX, endY],
            depth: currentDepth,
            length: length
        });
        
        if (depth <= 0) {
            return;
        }
        
        // Next segment length
        const newLength = length * this.parameters.lengthRatio;

        // Number of children = always 2 for un árbol simétrico (o usar parámetro si quiere más)
        const branchCount = 2;

        // Spread base (más cerrado en la base, más abierto arriba): interpolar
        const baseSpread = this.parameters.branchAngle; // valor configurado
        const extra = 10.0; // apertura adicional progresiva
    const tDepth = currentDepth / this.parameters.recursionDepth;
        const spreadNow = baseSpread + extra * tDepth;

        // Angulos izquierdo y derecho relativos al eje del padre
            const leftAngle = angle - spreadNow;
            const rightAngle = angle + spreadNow;

        // Reemplazamos aleatoriedad por ligera compensación para mantener eje vertical
        // (sin drift horizontal acumulativo)
        for (let i = 0; i < 2; i++) {
            const childAngle = (i === 0) ? leftAngle : rightAngle;
            const rad = childAngle * Math.PI / 180;
                const nx = endX + Math.sin(rad) * newLength;
                const ny = endY + Math.cos(rad) * newLength;
            this.generateBranch(endX, endY, nx, ny, childAngle, depth - 1, currentDepth + 1, newLength);
        }
    }

    /**
     * Create vertex buffer from branches
     */
    createVertexBuffer() {
        const vertices = [];
        
        this.branches.forEach(branch => {
            const [startX, startY] = branch.start;
            const [endX, endY] = branch.end;
            const depth = branch.depth;
            
            // Add line vertices with depth information
            vertices.push(startX, startY, depth);
            vertices.push(endX, endY, depth);
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
     * Render the fractal tree
     */
    render(width, height, time = 0) {
        if (!this.isInitialized || !this.program || !this.vertexBuffer) {
            return;
        }

        const gl = this.gl;
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Set line width based on depth
        gl.lineWidth(this.parameters.lineWidth);
        
        // Set uniforms
        this.setUniforms(width, height, time);
        
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        
        // Setup attributes
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
        
        // Draw lines
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
        
        // Check for errors
        WebGLUtils.checkError(gl, 'fractal tree render');
    }

    /**
     * Set uniforms
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
        const shouldRegenerate = 
            newParams.recursionDepth !== this.parameters.recursionDepth ||
            newParams.branchAngle !== this.parameters.branchAngle ||
            newParams.lengthRatio !== this.parameters.lengthRatio ||
            newParams.branchCount !== this.parameters.branchCount;
            
        super.updateParameters(newParams);
        
        if (shouldRegenerate) {
            this.generateFractalTree();
        }
    }

    /**
     * Get color scheme index
     */
    getColorSchemeIndex(schemeName) {
        const schemes = {
            'classic': 0,
            'autumn': 1,
            'spring': 2,
            'winter': 3
        };
        return schemes[schemeName] || 0;
    }

    /**
     * Get available color schemes
     */
    getColorSchemes() {
        return ['classic', 'autumn', 'spring', 'winter'];
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
        return `L → L[+L][-L] (angle: ${this.parameters.branchAngle}°)`;
    }

    /**
     * Get fractal description
     */
    getDescription() {
        return "A fractal tree generated by recursive branching with configurable angles and ratios.";
    }

    /**
     * Calculate statistics
     */
    calculateStatistics() {
        const depth = this.parameters.recursionDepth;
        const branchCount = this.parameters.branchCount;
        
        this.stats.convergenceRatio = 1.0;
        this.stats.boundaryPoints = Math.pow(branchCount, depth);
        this.stats.fractalDimension = Math.log(branchCount) / Math.log(1 / this.parameters.lengthRatio);
        this.stats.areaRatio = 0.3 + depth * 0.05;
    }

    /**
     * Get default parameters
     */
    getDefaultParameters() {
        return {
            centerX: 0.0,
            centerY: -0.3,
            zoom: 1.0,
            recursionDepth: 10,
            branchAngle: 30,
            lengthRatio: 0.7,
            branchCount: 2,
            rotation: 0.0,
            colorScheme: 'classic',
            lineWidth: 1.5,
            leafSize: 3.0
        };
    }

    /**
     * Update iterations (maps to recursion depth for trees)
     */
    updateIterations(value) {
        const newDepth = Math.max(3, Math.min(12, Math.round(value)));
        if (newDepth !== this.parameters.recursionDepth) {
            this.parameters.recursionDepth = newDepth;
            this.generateFractalTree();
        }
    }

    /**
     * Reset to default parameters
     */
    reset() {
        this.parameters = { ...this.getDefaultParameters() };
        this.generateFractalTree();
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
