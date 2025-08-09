/**
 * Console Manager
 * Handles logging and debug output display
 */

class ConsoleManager {
    constructor() {
        this.consoleContent = document.getElementById('consoleContent');
        this.clearButton = document.getElementById('clearConsole');
        this.maxEntries = 50;
        this.entries = [];
        
        this.initialize();
    }

    /**
     * Initialize console manager
     */
    initialize() {
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clear();
            });
        }

        // Add initial welcome message
        this.addLogEntry('info', 'FractalLab console initialized');
        this.addLogEntry('debug', 'WebGL fractal visualizer ready');
        
        console.log('Console Manager initialized');
    }

    /**
     * Add a log entry to the console
     * @param {string} level - Log level (info, warn, error, debug)
     * @param {string} message - Log message
     */
    addLogEntry(level, message) {
        if (!this.consoleContent) return;

        const timestamp = new Date().toLocaleTimeString('en-GB');
        
        const entry = {
            timestamp,
            level,
            message,
            id: Date.now() + Math.random()
        };

        this.entries.push(entry);

        // Limit number of entries
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
            // Remove oldest DOM element
            const firstChild = this.consoleContent.firstElementChild;
            if (firstChild) {
                this.consoleContent.removeChild(firstChild);
            }
        }

        // Create DOM element for the entry
        const entryElement = this.createLogEntryElement(entry);
        this.consoleContent.appendChild(entryElement);

        // Auto-scroll to bottom
        this.scrollToBottom();
    }

    /**
     * Create DOM element for log entry
     * @param {Object} entry - Log entry object
     * @returns {HTMLElement} DOM element
     */
    createLogEntryElement(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'log-entry';
        entryDiv.setAttribute('data-level', entry.level);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = entry.timestamp;

        const levelSpan = document.createElement('span');
        levelSpan.className = `log-level ${entry.level}`;
        levelSpan.textContent = entry.level.toUpperCase();

        const messageSpan = document.createElement('span');
        messageSpan.className = 'log-message';
        messageSpan.textContent = entry.message;

        entryDiv.appendChild(timeSpan);
        entryDiv.appendChild(levelSpan);
        entryDiv.appendChild(messageSpan);

        return entryDiv;
    }

    /**
     * Clear all console entries
     */
    clear() {
        if (this.consoleContent) {
            this.consoleContent.innerHTML = '';
        }
        this.entries = [];
        
        // Add clear message
        this.addLogEntry('info', 'Console cleared');
    }

    /**
     * Scroll console to bottom
     */
    scrollToBottom() {
        if (this.consoleContent) {
            this.consoleContent.scrollTop = this.consoleContent.scrollHeight;
        }
    }

    /**
     * Filter entries by log level
     * @param {string} level - Log level to filter by
     */
    filterByLevel(level) {
        if (!this.consoleContent) return;

        const entries = this.consoleContent.querySelectorAll('.log-entry');
        entries.forEach(entry => {
            const entryLevel = entry.getAttribute('data-level');
            if (level === 'all' || entryLevel === level) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    /**
     * Export console log
     * @returns {string} Console log as text
     */
    exportLog() {
        return this.entries.map(entry => 
            `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
        ).join('\n');
    }

    /**
     * Log fractal computation start
     * @param {string} fractalName - Name of the fractal
     * @param {Object} parameters - Computation parameters
     */
    logComputationStart(fractalName, parameters) {
        this.addLogEntry('info', `${fractalName} computation started`);
        this.addLogEntry('debug', `Parameters: ${JSON.stringify(parameters)}`);
    }

    /**
     * Log fractal computation complete
     * @param {string} fractalName - Name of the fractal
     * @param {number} renderTime - Render time in milliseconds
     */
    logComputationComplete(fractalName, renderTime) {
        this.addLogEntry('info', `${fractalName} render completed in ${renderTime.toFixed(1)}ms`);
    }

    /**
     * Log parameter change
     * @param {string} parameter - Parameter name
     * @param {any} oldValue - Old value
     * @param {any} newValue - New value
     */
    logParameterChange(parameter, oldValue, newValue) {
        this.addLogEntry('debug', `Parameter changed: ${parameter} = ${oldValue} → ${newValue}`);
    }

    /**
     * Log viewport change
     * @param {Object} viewport - Viewport state
     */
    logViewportChange(viewport) {
        const center = `(${viewport.centerX.toFixed(6)}, ${viewport.centerY.toFixed(6)})`;
        const zoom = viewport.zoom.toExponential(2);
        const rotation = (viewport.rotation * 180 / Math.PI).toFixed(1);
        
        this.addLogEntry('debug', `Viewport: center=${center}, zoom=${zoom}, rotation=${rotation}°`);
    }

    /**
     * Log WebGL information
     * @param {Object} glInfo - WebGL context information
     */
    logWebGLInfo(glInfo) {
        this.addLogEntry('info', `WebGL Renderer: ${glInfo.renderer}`);
        this.addLogEntry('debug', `WebGL Version: ${glInfo.version}`);
        this.addLogEntry('debug', `GLSL Version: ${glInfo.shadingLanguageVersion}`);
        this.addLogEntry('debug', `Max Texture Size: ${glInfo.maxTextureSize}`);
    }

    /**
     * Log performance metrics
     * @param {Object} metrics - Performance metrics
     */
    logPerformanceMetrics(metrics) {
        this.addLogEntry('debug', 
            `Performance: FPS=${metrics.fps}, ` +
            `Render=${metrics.renderTime.toFixed(1)}ms, ` +
            `Memory=${metrics.memoryUsage}MB`
        );
    }

    /**
     * Log error with stack trace
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    logError(error, context = '') {
        const prefix = context ? `[${context}] ` : '';
        this.addLogEntry('error', `${prefix}${error.message}`);
        
        if (error.stack) {
            // Log first few lines of stack trace
            const stackLines = error.stack.split('\n').slice(1, 4);
            stackLines.forEach(line => {
                this.addLogEntry('debug', `  ${line.trim()}`);
            });
        }
    }

    /**
     * Log warning
     * @param {string} message - Warning message
     * @param {string} context - Warning context
     */
    logWarning(message, context = '') {
        const prefix = context ? `[${context}] ` : '';
        this.addLogEntry('warn', `${prefix}${message}`);
    }

    /**
     * Log fractal statistics
     * @param {Object} stats - Fractal statistics
     */
    logStatistics(stats) {
        this.addLogEntry('debug', 
            `Stats: dimension=${stats.fractalDimension.toFixed(3)}, ` +
            `convergence=${(stats.convergenceRatio * 100).toFixed(1)}%, ` +
            `boundary=${stats.boundaryPoints.toLocaleString()}`
        );
    }

    /**
     * Log user interaction
     * @param {string} action - User action
     * @param {string} details - Action details
     */
    logUserAction(action, details = '') {
        const message = details ? `${action}: ${details}` : action;
        this.addLogEntry('info', message);
    }

    /**
     * Create log entry with custom styling
     * @param {string} level - Log level
     * @param {string} message - Message
     * @param {string} icon - Optional icon
     */
    addCustomLogEntry(level, message, icon = '') {
        const timestamp = new Date().toLocaleTimeString('en-GB');
        
        const entry = {
            timestamp,
            level,
            message: icon ? `${icon} ${message}` : message,
            id: Date.now() + Math.random()
        };

        this.entries.push(entry);

        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
            const firstChild = this.consoleContent.firstElementChild;
            if (firstChild) {
                this.consoleContent.removeChild(firstChild);
            }
        }

        const entryElement = this.createLogEntryElement(entry);
        this.consoleContent.appendChild(entryElement);
        this.scrollToBottom();
    }

    /**
     * Add system status message
     * @param {string} status - System status
     */
    logSystemStatus(status) {
        this.addCustomLogEntry('info', status, '🔧');
    }

    /**
     * Add computation progress message
     * @param {string} progress - Progress message
     */
    logProgress(progress) {
        this.addCustomLogEntry('debug', progress, '⚡');
    }

    /**
     * Add memory usage warning
     * @param {number} memoryUsage - Memory usage in MB
     */
    logMemoryWarning(memoryUsage) {
        if (memoryUsage > 500) {
            this.addCustomLogEntry('warn', `High memory usage: ${memoryUsage}MB`, '⚠️');
        }
    }

    /**
     * Get console statistics
     * @returns {Object} Console statistics
     */
    getStatistics() {
        const levelCounts = {
            info: 0,
            warn: 0,
            error: 0,
            debug: 0
        };

        this.entries.forEach(entry => {
            if (levelCounts[entry.level] !== undefined) {
                levelCounts[entry.level]++;
            }
        });

        return {
            totalEntries: this.entries.length,
            ...levelCounts,
            oldestEntry: this.entries[0]?.timestamp,
            newestEntry: this.entries[this.entries.length - 1]?.timestamp
        };
    }
}
