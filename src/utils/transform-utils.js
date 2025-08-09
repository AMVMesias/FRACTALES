/**
 * Transform Utilities for Interactive Fractal Manipulation
 * Handles user interactions like pan, zoom, and rotation
 */

class TransformUtils {
    /**
     * Viewport management for fractal visualization
     */
    static Viewport = class {
        constructor(centerX = 0, centerY = 0, zoom = 1, rotation = 0) {
            this.centerX = centerX;
            this.centerY = centerY;
            this.zoom = zoom;
            this.rotation = rotation;
            this.targetCenterX = centerX;
            this.targetCenterY = centerY;
            this.targetZoom = zoom;
            this.targetRotation = rotation;
            this.animationSpeed = 0.15; // Increased for smoother animation
            this.dampingFactor = 0.85; // Damping to reduce oscillation
        }

        /**
         * Set target values for smooth animation
         * @param {number} centerX - Target center X
         * @param {number} centerY - Target center Y
         * @param {number} zoom - Target zoom level
         * @param {number} rotation - Target rotation in radians
         */
        setTarget(centerX, centerY, zoom, rotation = this.rotation) {
            this.targetCenterX = centerX;
            this.targetCenterY = centerY;
            this.targetZoom = Math.max(0.0001, zoom); // Solo evitar zoom negativo o cero
            this.targetRotation = rotation;
        }

        /**
         * Update viewport with smooth animation
         * @returns {boolean} True if animation is still in progress
         */
        update() {
            const threshold = 1e-8; // Smaller threshold for smoother stopping
            let isAnimating = false;

            // Smooth interpolation to target values with damping
            const dx = this.targetCenterX - this.centerX;
            const dy = this.targetCenterY - this.centerY;
            const dz = this.targetZoom - this.zoom;
            const dr = this.targetRotation - this.rotation;

            if (Math.abs(dx) > threshold) {
                this.centerX += dx * this.animationSpeed;
                isAnimating = true;
            } else {
                this.centerX = this.targetCenterX;
            }

            if (Math.abs(dy) > threshold) {
                this.centerY += dy * this.animationSpeed;
                isAnimating = true;
            } else {
                this.centerY = this.targetCenterY;
            }

            if (Math.abs(dz) > threshold) {
                this.zoom += dz * this.animationSpeed;
                isAnimating = true;
            } else {
                this.zoom = this.targetZoom;
            }

            if (Math.abs(dr) > threshold) {
                this.rotation += dr * this.animationSpeed;
                isAnimating = true;
            } else {
                this.rotation = this.targetRotation;
            }

            return isAnimating;
        }

        /**
         * Pan the viewport by screen coordinates
         * @param {number} deltaX - Screen space delta X
         * @param {number} deltaY - Screen space delta Y
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         */
        pan(deltaX, deltaY, canvasWidth, canvasHeight) {
            const aspect = canvasWidth / canvasHeight;
            const range = 4.0 / this.zoom;
            
            // Convert screen delta to complex plane delta
            // Grabbing semantics: arrastrar a la derecha desplaza el fractal hacia la derecha (centro se mueve en sentido opuesto)
            // Por ello invertimos ambos ejes respecto a la versión anterior.
            const deltaReal = -(deltaX / canvasWidth) * range * aspect;
            const deltaImag = (deltaY / canvasHeight) * range;
            
            // Apply rotation if needed
            if (this.rotation !== 0) {
                const cos = Math.cos(-this.rotation);
                const sin = Math.sin(-this.rotation);
                const rotatedDeltaReal = deltaReal * cos - deltaImag * sin;
                const rotatedDeltaImag = deltaReal * sin + deltaImag * cos;
                
                this.setTarget(
                    this.targetCenterX + rotatedDeltaReal,
                    this.targetCenterY + rotatedDeltaImag,
                    this.targetZoom,
                    this.targetRotation
                );
            } else {
                this.setTarget(
                    this.targetCenterX + deltaReal,
                    this.targetCenterY + deltaImag,
                    this.targetZoom,
                    this.targetRotation
                );
            }
        }

        /**
         * Zoom the viewport around a specific point
         * @param {number} factor - Zoom factor (> 1 to zoom in, < 1 to zoom out)
         * @param {number} centerX - Screen X coordinate to zoom around
         * @param {number} centerY - Screen Y coordinate to zoom around
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         */
        zoomAt(factor, centerX, centerY, canvasWidth, canvasHeight) {
            // Convert screen coordinates to complex coordinates
            const complex = MathUtils.Transform.screenToComplex(
                centerX, centerY, canvasWidth, canvasHeight, this
            );
            
            // Calculate new zoom level
            const newZoom = this.targetZoom * factor;
            
            // Calculate offset to keep the zoom point fixed
            const offsetX = complex.real - this.targetCenterX;
            const offsetY = complex.imag - this.targetCenterY;
            
            const newCenterX = complex.real - offsetX / factor;
            const newCenterY = complex.imag - offsetY / factor;
            
            this.setTarget(newCenterX, newCenterY, newZoom, this.targetRotation);
        }

        /**
         * Rotate the viewport around its center
         * @param {number} deltaAngle - Rotation delta in radians
         */
        rotate(deltaAngle) {
            this.setTarget(
                this.targetCenterX,
                this.targetCenterY,
                this.targetZoom,
                this.targetRotation + deltaAngle
            );
        }

        /**
         * Reset viewport to default values
         */
        reset() {
            this.setTarget(0, 0, 1, 0);
        }

        /**
         * Get current transformation matrix for shaders
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @returns {Object} Transformation parameters for shaders
         */
        getShaderParams(canvasWidth, canvasHeight) {
            const aspect = canvasWidth / canvasHeight;
            const range = 4.0 / this.zoom;
            
            return {
                center: [this.centerX, this.centerY],
                zoom: this.zoom,
                rotation: this.rotation,
                aspect: aspect,
                range: range
            };
        }

        /**
         * Update aspect ratio (called when canvas is resized)
         * @param {number} aspectRatio - New aspect ratio (width/height)
         */
        updateAspectRatio(aspectRatio) {
            // This function can be extended to adjust viewport parameters
            // based on the new aspect ratio if needed
            // For now, the viewport automatically adapts through getShaderParams
        }
    };

    /**
     * Input handler for mouse and touch interactions
     */
    static InputHandler = class {
        constructor(canvas, viewport, app = null) {
            this.canvas = canvas;
            this.viewport = viewport;
            this.app = app; // Reference to the main app for fractal updates
            this.isMouseDown = false;
            this.lastMouseX = 0;
            this.lastMouseY = 0;
            this.isDragging = false;
            this.touchStartDistance = 0;
            this.touchStartZoom = 1;
            // Configuración: solo rueda hace zoom (click zoom deshabilitado)
            this.enableClickZoom = false;
            
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Mouse events
            this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
            // Mouseup global para evitar quedarse en modo arrastre si sale del canvas
            window.addEventListener('mouseup', this.onMouseUp.bind(this));
            this.canvas.addEventListener('wheel', this.onWheel.bind(this));
            this.canvas.addEventListener('contextmenu', e => e.preventDefault());

            // Touch events for mobile support
            this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
            this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
            this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

            // Prevent default touch behaviors
            this.canvas.addEventListener('touchstart', e => e.preventDefault());
            this.canvas.addEventListener('touchmove', e => e.preventDefault());
        }

        onMouseDown(event) {
            this.isMouseDown = true;
            this.isDragging = false;
            const rect = this.canvas.getBoundingClientRect();
            this.lastMouseX = event.clientX - rect.left;
            this.lastMouseY = event.clientY - rect.top;
        }

        onMouseMove(event) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (this.isMouseDown) {
                const deltaX = mouseX - this.lastMouseX;
                const deltaY = mouseY - this.lastMouseY;
                
                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    this.isDragging = true;
                    const { x: mx, y: my } = this.getPanMultipliers();
                    this.viewport.pan(deltaX * mx, deltaY * my, this.canvas.width, this.canvas.height);
                }
            }

            // Update coordinate display
            this.updateCoordinateDisplay(mouseX, mouseY);
            
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
        }

        onMouseUp(event) {
            this.isMouseDown = false;
            
            // Antes hacía zoom al click; ahora se ignora para que solo la rueda controle el zoom.
            // Si en el futuro se quiere reactivar: poner this.enableClickZoom=true y restaurar lógica.
            
            this.isDragging = false;
        }

        onWheel(event) {
            event.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            // Zoom factor based on wheel direction (más agresivo como en ejemplo.html)
            const zoomFactor = event.deltaY > 0 ? 0.8 : 1.25;
            
            this.viewport.zoomAt(zoomFactor, mouseX, mouseY, this.canvas.width, this.canvas.height);
            
            // NO actualizar fractal aquí - se hace en el render loop principal
        }

        onTouchStart(event) {
            if (event.touches.length === 1) {
                // Single touch - prepare for pan
                const touch = event.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.lastMouseX = touch.clientX - rect.left;
                this.lastMouseY = touch.clientY - rect.top;
                this.isMouseDown = true;
            } else if (event.touches.length === 2) {
                // Two finger touch - prepare for zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                this.touchStartDistance = this.getTouchDistance(touch1, touch2);
                this.touchStartZoom = this.viewport.targetZoom;
                this.isMouseDown = false;
            }
        }

        onTouchMove(event) {
            if (event.touches.length === 1 && this.isMouseDown) {
                // Single touch - pan
                const touch = event.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                
                const deltaX = touchX - this.lastMouseX;
                const deltaY = touchY - this.lastMouseY;
                const { x: mx, y: my } = this.getPanMultipliers();
                this.viewport.pan(deltaX * mx, deltaY * my, this.canvas.width, this.canvas.height);
                
                this.lastMouseX = touchX;
                this.lastMouseY = touchY;
            } else if (event.touches.length === 2) {
                // Two finger touch - zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentDistance = this.getTouchDistance(touch1, touch2);
                
                if (this.touchStartDistance > 0) {
                    const zoomFactor = currentDistance / this.touchStartDistance;
                    const newZoom = this.touchStartZoom * zoomFactor;
                    
                    // Calculate center point between touches
                    const rect = this.canvas.getBoundingClientRect();
                    const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                    const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
                    
                    this.viewport.zoomAt(
                        newZoom / this.viewport.targetZoom,
                        centerX, centerY,
                        this.canvas.width, this.canvas.height
                    );
                }
            }
        }

        onTouchEnd(event) {
            this.isMouseDown = false;
            this.touchStartDistance = 0;
        }

        getTouchDistance(touch1, touch2) {
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        updateCoordinateDisplay(x, y) {
            const complex = MathUtils.Transform.screenToComplex(
                x, y, this.canvas.width, this.canvas.height, this.viewport
            );
            
            const coordsElement = document.getElementById('coords');
            if (coordsElement) {
                coordsElement.textContent = 
                    `Re: ${complex.real.toFixed(6)} | Im: ${complex.imag.toFixed(6)}`;
            }
        }

        getPanMultipliers() {
            // Restaurar inversión sólo para fractales geométricos (Tree, Koch, Sierpinski)
            if (this.app && this.app.currentFractal) {
                const cname = this.app.currentFractal.constructor.name.toLowerCase();
                if (cname.includes('fractaltree') || cname.includes('kochcurve') || cname.includes('sierpinski')) {
                    return { x: -1, y: -1 }; // invertir para mantener sensación anterior
                }
            }
            return { x: 1, y: 1 }; // Mandelbrot, Julia (grab natural)
        }
    };

    /**
     * Keyboard shortcuts for viewport control
     */
    static KeyboardHandler = class {
        constructor(viewport) {
            this.viewport = viewport;
            this.keys = new Set();
            this.setupEventListeners();
        }

        setupEventListeners() {
            document.addEventListener('keydown', this.onKeyDown.bind(this));
            document.addEventListener('keyup', this.onKeyUp.bind(this));
        }

        onKeyDown(event) {
            this.keys.add(event.code);
            
            switch (event.code) {
                case 'KeyR':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.viewport.reset();
                    }
                    break;
                case 'Equal':
                case 'NumpadAdd':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.viewport.setTarget(
                            this.viewport.targetCenterX,
                            this.viewport.targetCenterY,
                            this.viewport.targetZoom * 1.2,
                            this.viewport.targetRotation
                        );
                    }
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.viewport.setTarget(
                            this.viewport.targetCenterX,
                            this.viewport.targetCenterY,
                            this.viewport.targetZoom * 0.8,
                            this.viewport.targetRotation
                        );
                    }
                    break;
            }
        }

        onKeyUp(event) {
            this.keys.delete(event.code);
        }

        update() {
            const panSpeed = 0.02 / this.viewport.zoom;
            const rotateSpeed = 0.02;
            
            // Pan with arrow keys or WASD
            if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
                this.viewport.setTarget(
                    this.viewport.targetCenterX - panSpeed,
                    this.viewport.targetCenterY,
                    this.viewport.targetZoom,
                    this.viewport.targetRotation
                );
            }
            if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
                this.viewport.setTarget(
                    this.viewport.targetCenterX + panSpeed,
                    this.viewport.targetCenterY,
                    this.viewport.targetZoom,
                    this.viewport.targetRotation
                );
            }
            if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) {
                this.viewport.setTarget(
                    this.viewport.targetCenterX,
                    this.viewport.targetCenterY + panSpeed,
                    this.viewport.targetZoom,
                    this.viewport.targetRotation
                );
            }
            if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) {
                this.viewport.setTarget(
                    this.viewport.targetCenterX,
                    this.viewport.targetCenterY - panSpeed,
                    this.viewport.targetZoom,
                    this.viewport.targetRotation
                );
            }
            
            // Rotate with Q and E
            if (this.keys.has('KeyQ')) {
                this.viewport.rotate(-rotateSpeed);
            }
            if (this.keys.has('KeyE')) {
                this.viewport.rotate(rotateSpeed);
            }
        }
    };

    /**
     * Animation utilities for smooth transitions
     */
    static Animation = {
        /**
         * Easing functions for smooth animations
         */
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        },

        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        },

        easeOutBounce(t) {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        }
    };
}
