/**
 * Mathematical Utilities for Fractal Computation
 * Provides complex number operations, transformations, and fractal-specific math
 */

class MathUtils {
    /**
     * Complex number operations
     */
    static Complex = {
        /**
         * Create a complex number
         * @param {number} real - Real part
         * @param {number} imag - Imaginary part
         * @returns {Object} Complex number {real, imag}
         */
        create(real, imag) {
            return { real, imag };
        },

        /**
         * Add two complex numbers
         * @param {Object} a - First complex number
         * @param {Object} b - Second complex number
         * @returns {Object} Result of a + b
         */
        add(a, b) {
            return {
                real: a.real + b.real,
                imag: a.imag + b.imag
            };
        },

        /**
         * Subtract two complex numbers
         * @param {Object} a - First complex number
         * @param {Object} b - Second complex number
         * @returns {Object} Result of a - b
         */
        subtract(a, b) {
            return {
                real: a.real - b.real,
                imag: a.imag - b.imag
            };
        },

        /**
         * Multiply two complex numbers
         * @param {Object} a - First complex number
         * @param {Object} b - Second complex number
         * @returns {Object} Result of a * b
         */
        multiply(a, b) {
            return {
                real: a.real * b.real - a.imag * b.imag,
                imag: a.real * b.imag + a.imag * b.real
            };
        },

        /**
         * Divide two complex numbers
         * @param {Object} a - Numerator
         * @param {Object} b - Denominator
         * @returns {Object} Result of a / b
         */
        divide(a, b) {
            const denominator = b.real * b.real + b.imag * b.imag;
            return {
                real: (a.real * b.real + a.imag * b.imag) / denominator,
                imag: (a.imag * b.real - a.real * b.imag) / denominator
            };
        },

        /**
         * Calculate magnitude (absolute value) of complex number
         * @param {Object} c - Complex number
         * @returns {number} Magnitude
         */
        magnitude(c) {
            return Math.sqrt(c.real * c.real + c.imag * c.imag);
        },

        /**
         * Calculate squared magnitude (more efficient for comparisons)
         * @param {Object} c - Complex number
         * @returns {number} Squared magnitude
         */
        magnitudeSquared(c) {
            return c.real * c.real + c.imag * c.imag;
        },

        /**
         * Calculate phase (argument) of complex number
         * @param {Object} c - Complex number
         * @returns {number} Phase in radians
         */
        phase(c) {
            return Math.atan2(c.imag, c.real);
        },

        /**
         * Complex conjugate
         * @param {Object} c - Complex number
         * @returns {Object} Conjugate
         */
        conjugate(c) {
            return { real: c.real, imag: -c.imag };
        },

        /**
         * Raise complex number to a power
         * @param {Object} c - Complex number
         * @param {number} n - Power
         * @returns {Object} Result of c^n
         */
        power(c, n) {
            const magnitude = Math.pow(this.magnitude(c), n);
            const phase = this.phase(c) * n;
            return {
                real: magnitude * Math.cos(phase),
                imag: magnitude * Math.sin(phase)
            };
        }
    };

    /**
     * 2D Vector operations
     */
    static Vector2 = {
        /**
         * Create a 2D vector
         * @param {number} x - X component
         * @param {number} y - Y component
         * @returns {Object} Vector {x, y}
         */
        create(x, y) {
            return { x, y };
        },

        /**
         * Add two vectors
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {Object} Result of a + b
         */
        add(a, b) {
            return { x: a.x + b.x, y: a.y + b.y };
        },

        /**
         * Subtract two vectors
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {Object} Result of a - b
         */
        subtract(a, b) {
            return { x: a.x - b.x, y: a.y - b.y };
        },

        /**
         * Multiply vector by scalar
         * @param {Object} v - Vector
         * @param {number} s - Scalar
         * @returns {Object} Scaled vector
         */
        scale(v, s) {
            return { x: v.x * s, y: v.y * s };
        },

        /**
         * Calculate dot product
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {number} Dot product
         */
        dot(a, b) {
            return a.x * b.x + a.y * b.y;
        },

        /**
         * Calculate vector length
         * @param {Object} v - Vector
         * @returns {number} Length
         */
        length(v) {
            return Math.sqrt(v.x * v.x + v.y * v.y);
        },

        /**
         * Normalize vector
         * @param {Object} v - Vector
         * @returns {Object} Normalized vector
         */
        normalize(v) {
            const len = this.length(v);
            return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
        },

        /**
         * Rotate vector by angle
         * @param {Object} v - Vector
         * @param {number} angle - Angle in radians
         * @returns {Object} Rotated vector
         */
        rotate(v, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: v.x * cos - v.y * sin,
                y: v.x * sin + v.y * cos
            };
        }
    };

    /**
     * Transformation matrix operations (2x2 matrix)
     */
    static Matrix2 = {
        /**
         * Create identity matrix
         * @returns {Array} 2x2 identity matrix [a, b, c, d] representing [[a,b],[c,d]]
         */
        identity() {
            return [1, 0, 0, 1];
        },

        /**
         * Create rotation matrix
         * @param {number} angle - Rotation angle in radians
         * @returns {Array} Rotation matrix
         */
        rotation(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return [cos, -sin, sin, cos];
        },

        /**
         * Create scaling matrix
         * @param {number} sx - X scale factor
         * @param {number} sy - Y scale factor (default: sx)
         * @returns {Array} Scaling matrix
         */
        scaling(sx, sy = sx) {
            return [sx, 0, 0, sy];
        },

        /**
         * Multiply two 2x2 matrices
         * @param {Array} a - First matrix
         * @param {Array} b - Second matrix
         * @returns {Array} Result matrix
         */
        multiply(a, b) {
            return [
                a[0] * b[0] + a[1] * b[2],  // a11*b11 + a12*b21
                a[0] * b[1] + a[1] * b[3],  // a11*b12 + a12*b22
                a[2] * b[0] + a[3] * b[2],  // a21*b11 + a22*b21
                a[2] * b[1] + a[3] * b[3]   // a21*b12 + a22*b22
            ];
        },

        /**
         * Transform a vector by matrix
         * @param {Array} matrix - 2x2 transformation matrix
         * @param {Object} vector - Vector to transform
         * @returns {Object} Transformed vector
         */
        transformVector(matrix, vector) {
            return {
                x: matrix[0] * vector.x + matrix[1] * vector.y,
                y: matrix[2] * vector.x + matrix[3] * vector.y
            };
        }
    };

    /**
     * Utility functions for coordinate transformations
     */
    static Transform = {
        /**
         * Convert screen coordinates to complex plane coordinates
         * @param {number} x - Screen X coordinate
         * @param {number} y - Screen Y coordinate
         * @param {number} width - Canvas width
         * @param {number} height - Canvas height
         * @param {Object} viewport - Viewport parameters {centerX, centerY, zoom}
         * @returns {Object} Complex coordinates {real, imag}
         */
        screenToComplex(x, y, width, height, viewport) {
            const aspect = width / height;
            const range = 4.0 / viewport.zoom;
            
            const real = (x / width - 0.5) * range * aspect + viewport.centerX;
            const imag = (0.5 - y / height) * range + viewport.centerY;
            
            return { real, imag };
        },

        /**
         * Convert complex coordinates to screen coordinates
         * @param {number} real - Real part
         * @param {number} imag - Imaginary part
         * @param {number} width - Canvas width
         * @param {number} height - Canvas height
         * @param {Object} viewport - Viewport parameters {centerX, centerY, zoom}
         * @returns {Object} Screen coordinates {x, y}
         */
        complexToScreen(real, imag, width, height, viewport) {
            const aspect = width / height;
            const range = 4.0 / viewport.zoom;
            
            const x = ((real - viewport.centerX) / (range * aspect) + 0.5) * width;
            const y = (0.5 - (imag - viewport.centerY) / range) * height;
            
            return { x, y };
        }
    };

    /**
     * Color utilities for fractal visualization
     */
    static Color = {
        /**
         * Convert HSV to RGB
         * @param {number} h - Hue (0-360)
         * @param {number} s - Saturation (0-1)
         * @param {number} v - Value/Brightness (0-1)
         * @returns {Object} RGB color {r, g, b} (0-255)
         */
        hsvToRgb(h, s, v) {
            const c = v * s;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = v - c;
            
            let r, g, b;
            
            if (h >= 0 && h < 60) {
                r = c; g = x; b = 0;
            } else if (h >= 60 && h < 120) {
                r = x; g = c; b = 0;
            } else if (h >= 120 && h < 180) {
                r = 0; g = c; b = x;
            } else if (h >= 180 && h < 240) {
                r = 0; g = x; b = c;
            } else if (h >= 240 && h < 300) {
                r = x; g = 0; b = c;
            } else {
                r = c; g = 0; b = x;
            }
            
            return {
                r: Math.round((r + m) * 255),
                g: Math.round((g + m) * 255),
                b: Math.round((b + m) * 255)
            };
        },

        /**
         * Create a smooth color palette for fractal visualization
         * @param {number} iterations - Number of iterations
         * @param {number} maxIterations - Maximum iterations
         * @returns {Object} RGB color {r, g, b} (0-1)
         */
        iterationToColor(iterations, maxIterations) {
            if (iterations >= maxIterations) {
                return { r: 0, g: 0, b: 0 }; // Black for points in the set
            }
            
            // Smooth coloring using logarithmic scaling
            const smoothed = iterations + 1 - Math.log2(Math.log2(iterations + 1));
            const hue = (smoothed / maxIterations * 360) % 360;
            const rgb = this.hsvToRgb(hue, 0.8, 0.9);
            
            return {
                r: rgb.r / 255,
                g: rgb.g / 255,
                b: rgb.b / 255
            };
        }
    };

    /**
     * Mathematical constants and helper functions
     */
    static {
        this.PI = Math.PI;
        this.TWO_PI = 2 * Math.PI;
        this.HALF_PI = Math.PI / 2;
        this.E = Math.E;
        this.GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Map a value from one range to another
     * @param {number} value - Input value
     * @param {number} inMin - Input range minimum
     * @param {number} inMax - Input range maximum
     * @param {number} outMin - Output range minimum
     * @param {number} outMax - Output range maximum
     * @returns {number} Mapped value
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    static random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Check if a number is a power of 2
     * @param {number} n - Number to check
     * @returns {boolean} True if power of 2
     */
    static isPowerOfTwo(n) {
        return n > 0 && (n & (n - 1)) === 0;
    }

    /**
     * Find next power of 2 greater than or equal to n
     * @param {number} n - Input number
     * @returns {number} Next power of 2
     */
    static nextPowerOfTwo(n) {
        return Math.pow(2, Math.ceil(Math.log2(n)));
    }
}
