/**
 * WebGL Utilities for Fractal Visualization
 * Provides helper functions for WebGL setup, shader compilation, and rendering
 */

class WebGLUtils {
    /**
     * Initialize WebGL context with error handling
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {Object} options - Configuration options
     * @returns {WebGLRenderingContext|null} WebGL context or null if failed
     */
    static initWebGL(canvas, options = {}) {
        let gl = null;
        
        try {
            // Default options
            const defaults = {
                qualityScale: 1.0,
                antialias: false,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            };
            
            const config = { ...defaults, ...options };
            
            // Set high DPI resolution with quality scaling
            const devicePixelRatio = window.devicePixelRatio || 1;
            const qualityPixelRatio = devicePixelRatio * config.qualityScale;
            const displayWidth = Math.floor(canvas.clientWidth * qualityPixelRatio);
            const displayHeight = Math.floor(canvas.clientHeight * qualityPixelRatio);
            
            // Set canvas resolution to match display
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }
            
            // Try to get WebGL2 first, fallback to WebGL1
            const contextOptions = {
                antialias: config.antialias,
                alpha: config.alpha,
                depth: false,
                stencil: false,
                preserveDrawingBuffer: config.preserveDrawingBuffer,
                powerPreference: config.powerPreference,
                failIfMajorPerformanceCaveat: false,
                desynchronized: true // Reduce input lag
            };
            
            gl = canvas.getContext('webgl2', contextOptions) || canvas.getContext('webgl', contextOptions);
            
            if (!gl) {
                throw new Error('WebGL not supported');
            }
            
            // Set viewport to match canvas resolution
            gl.viewport(0, 0, canvas.width, canvas.height);
            
            // Enable necessary extensions for better precision
            const ext = gl.getExtension('OES_texture_float');
            if (ext) {
                console.log('OES_texture_float extension available');
            }
            
            // Try to get high precision extension
            const precisionExt = gl.getExtension('OES_texture_float_linear');
            if (precisionExt) {
                console.log('OES_texture_float_linear extension available');
            }
            
            console.log(`WebGL initialized successfully - Resolution: ${canvas.width}x${canvas.height} (Quality: ${config.qualityScale}x)`);
            return gl;
            
        } catch (error) {
            console.error('Failed to initialize WebGL:', error);
            return null;
        }
    }

    /**
     * Compile a shader from source code
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {string} source - Shader source code
     * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @returns {WebGLShader|null} Compiled shader or null if failed
     */
    static compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            console.error('Shader compilation error:', error);
            console.error('Shader source:', source);
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    /**
     * Create a shader program from vertex and fragment shaders
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {string} vertexSource - Vertex shader source
     * @param {string} fragmentSource - Fragment shader source
     * @returns {WebGLProgram|null} Shader program or null if failed
     */
    static createProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(gl, vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            console.error('Program linking error:', error);
            gl.deleteProgram(program);
            return null;
        }
        
        // Clean up shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
        return program;
    }

    /**
     * Create and bind a buffer with data
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Float32Array|Uint16Array} data - Buffer data
     * @param {number} usage - Buffer usage (default: gl.STATIC_DRAW)
     * @returns {WebGLBuffer} Created buffer
     */
    static createBuffer(gl, data, usage = null) {
        if (!usage) usage = gl.STATIC_DRAW;
        
        const buffer = gl.createBuffer();
        const target = data instanceof Uint16Array ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
        
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        
        return buffer;
    }

    /**
     * Create a full-screen quad for fragment shader rendering
     * @param {WebGLRenderingContext} gl - WebGL context
     * @returns {Object} Object containing vertex buffer and indices
     */
    static createFullScreenQuad(gl) {
        // Full-screen quad vertices (position and texture coordinates)
        const vertices = new Float32Array([
            -1.0, -1.0, 0.0, 0.0,  // Bottom-left
             1.0, -1.0, 1.0, 0.0,  // Bottom-right
             1.0,  1.0, 1.0, 1.0,  // Top-right
            -1.0,  1.0, 0.0, 1.0   // Top-left
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,  // First triangle
            2, 3, 0   // Second triangle
        ]);
        
        const vertexBuffer = this.createBuffer(gl, vertices);
        const indexBuffer = this.createBuffer(gl, indices);
        
        return {
            vertexBuffer,
            indexBuffer,
            vertexCount: indices.length
        };
    }

    /**
     * Setup vertex attributes for the shader program
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {WebGLProgram} program - Shader program
     * @param {WebGLBuffer} vertexBuffer - Vertex buffer
     */
    static setupVertexAttributes(gl, program, vertexBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
        
        if (positionLocation !== -1) {
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
        }
        
        if (texCoordLocation !== -1) {
            gl.enableVertexAttribArray(texCoordLocation);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
        }
    }

    /**
     * Resize canvas and WebGL viewport
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    static resizeCanvas(canvas, gl) {
        const rect = canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Check if canvas size needs to be updated
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, displayWidth, displayHeight);
            return true; // Indicate that resize occurred
        }
        
        return false;
    }

    /**
     * Get all uniform locations for a program
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {WebGLProgram} program - Shader program
     * @param {string[]} uniformNames - Array of uniform names
     * @returns {Object} Object mapping uniform names to locations
     */
    static getUniformLocations(gl, program, uniformNames) {
        const locations = {};
        
        uniformNames.forEach(name => {
            locations[name] = gl.getUniformLocation(program, name);
            if (locations[name] === null) {
                console.warn(`Uniform '${name}' not found in shader program`);
            }
        });
        
        return locations;
    }

    /**
     * Clear the canvas with a specific color
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {number} r - Red component (0-1)
     * @param {number} g - Green component (0-1)
     * @param {number} b - Blue component (0-1)
     * @param {number} a - Alpha component (0-1)
     */
    static clearCanvas(gl, r = 0, g = 0, b = 0, a = 1) {
        // Enable smooth blending and better quality
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Set clear color and clear
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Disable blending after clear
        gl.disable(gl.BLEND);
    }

    /**
     * Check WebGL error and log it
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {string} operation - Description of the operation
     * @returns {boolean} True if no error, false if error occurred
     */
    static checkError(gl, operation) {
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error(`WebGL error during ${operation}:`, this.getErrorString(gl, error));
            return false;
        }
        return true;
    }

    /**
     * Convert WebGL error code to string
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {number} error - Error code
     * @returns {string} Error description
     */
    static getErrorString(gl, error) {
        switch (error) {
            case gl.NO_ERROR: return 'NO_ERROR';
            case gl.INVALID_ENUM: return 'INVALID_ENUM';
            case gl.INVALID_VALUE: return 'INVALID_VALUE';
            case gl.INVALID_OPERATION: return 'INVALID_OPERATION';
            case gl.OUT_OF_MEMORY: return 'OUT_OF_MEMORY';
            case gl.CONTEXT_LOST_WEBGL: return 'CONTEXT_LOST_WEBGL';
            default: return `Unknown error code: ${error}`;
        }
    }

    /**
     * Create a texture from image data or for render targets
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {Uint8Array|null} data - Texture data (null for empty texture)
     * @returns {WebGLTexture} Created texture
     */
    static createTexture(gl, width, height, data = null) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            width, height, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, data
        );
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        return texture;
    }

    /**
     * Resize canvas to match display size with high DPI support
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {number} qualityScale - Quality scaling factor (default: 1.0)
     * @returns {boolean} True if canvas was resized
     */
    static resizeCanvasToDisplaySize(canvas, gl, qualityScale = 1.0) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const qualityPixelRatio = devicePixelRatio * qualityScale;
        const displayWidth = Math.floor(canvas.clientWidth * qualityPixelRatio);
        const displayHeight = Math.floor(canvas.clientHeight * qualityPixelRatio);
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            
            if (gl) {
                gl.viewport(0, 0, canvas.width, canvas.height);
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Get WebGL context information for debugging
     * @param {WebGLRenderingContext} gl - WebGL context
     * @returns {Object} Context information
     */
    static getContextInfo(gl) {
        return {
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
        };
    }
}
