// ===============================================
// debug-logger.js - Reusable Debug Log System
// ===============================================
// เวอร์ชัน: 1.0.0
// วันที่: มีนาคม 2024
// ระบบ Debug Log ที่สามารถนำไปใช้ซ้ำได้ในหลายหน้า
// ===============================================


// แบบพื้นฐาน
// DebugLogger.log('ข้อความทั่วไป');
// DebugLogger.info('ข้อมูล');
// DebugLogger.success('สำเร็จแล้ว!');
// DebugLogger.warning('คำเตือน');
// DebugLogger.error('ข้อผิดพลาด');
// DebugLogger.debug('ข้อมูล debug');

// ควบคุม UI
// DebugLogger.show();    // แสดง
// DebugLogger.hide();    // ซ่อน
// DebugLogger.toggle();  // สลับ
// DebugLogger.clear();   // ล้างทั้งหมด

// ดึงข้อมูล
// const allLogs = DebugLogger.getAllLogs();
// const errors = DebugLogger.filterByType('error');

// Export
// DebugLogger.downloadAsJSON();  // ดาวน์โหลดเป็น JSON
// DebugLogger.exportAsText();    // ดึงข้อความทั้งหมด






class DebugLogger {
    constructor(options = {}) {
        this.options = {
            containerId: 'debugLogContainer',
            logAreaId: 'debugLog',
            toggleBtnId: 'toggleDebugBtn',
            clearBtnId: 'clearLogBtn',
            timeDisplayId: 'currentTime',
            countDisplayId: 'logCount',
            maxLogs: 1000,
            autoOpen: false,
            enableConsoleOverride: true,
            ...options
        };

        this.logCount = 0;
        this.logs = [];
        this.isInitialized = false;
        
        // Icon mapping สำหรับประเภท log
        this.typeIcons = {
            info: '🔵',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            debug: '🐛',
            system: '⚙️'
        };

        // Color mapping สำหรับประเภท log
        this.typeColors = {
            info: 'text-blue-400',
            success: 'text-green-400',
            warning: 'text-yellow-400',
            error: 'text-red-400',
            debug: 'text-purple-400',
            system: 'text-gray-400'
        };
    }

    /**
     * เริ่มต้นระบบ Debug Logger
     */
    async init() {
        if (this.isInitialized) {
            console.warn('DebugLogger ถูก initialize ไปแล้ว');
            return;
        }

        try {
            // รอให้ DOM พร้อม
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // สร้าง container ถ้ายังไม่มี
            if (!this._getElement(this.options.containerId)) {
                this._createDebugContainer();
            }

            // ตั้งค่า event listeners
            this._setupEventListeners();

            // Override console methods (ถ้าเปิดใช้งาน)
            if (this.options.enableConsoleOverride) {
                this._overrideConsoleMethods();
            }

            // ตั้งค่า auto open
            if (this.options.autoOpen) {
                this.show();
            }

            // ตั้งค่า timer สำหรับอัปเดตเวลา
            this._setupTimeUpdater();

            this.isInitialized = true;
            this.log('DebugLogger initialized successfully', 'system');
            
        } catch (error) {
            console.error('DebugLogger initialization failed:', error);
        }
    }

    /**
     * บันทึกข้อความลงใน Debug Log
     * @param {string} message - ข้อความที่ต้องการบันทึก
     * @param {string} type - ประเภทของข้อความ (info, success, warning, error, debug, system)
     */
    log(message, type = 'info') {
        if (!this.isInitialized) {
            console.warn('DebugLogger ยังไม่ได้ initialize โปรดเรียกใช้ init() ก่อน');
            return;
        }

        const timestamp = new Date().toLocaleTimeString('th-TH', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp,
            message,
            type,
            icon: this.typeIcons[type] || '📝',
            color: this.typeColors[type] || 'text-gray-400'
        };

        // บันทึกลง array
        this.logs.push(logEntry);
        this.logCount++;

        // ลบ log เก่าถ้าเกินจำนวนที่กำหนด
        if (this.logs.length > this.options.maxLogs) {
            this.logs.shift();
        }

        // แสดงใน UI
        this._appendLogToUI(logEntry);

        // อัปเดต counter
        this._updateCounter();

        return logEntry.id;
    }

    /**
     * แสดง Debug Log Container
     */
    show() {
        const container = this._getElement(this.options.containerId);
        if (container) {
            container.classList.remove('hidden');
            this.log('Debug log opened', 'system');
        }
    }

    /**
     * ซ่อน Debug Log Container
     */
    hide() {
        const container = this._getElement(this.options.containerId);
        if (container) {
            container.classList.add('hidden');
            this.log('Debug log closed', 'system');
        }
    }

    /**
     * สลับแสดง/ซ่อน Debug Log Container
     */
    toggle() {
        const container = this._getElement(this.options.containerId);
        if (container) {
            if (container.classList.contains('hidden')) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    /**
     * ล้าง Log ทั้งหมด
     */
    clear() {
        const logArea = this._getElement(this.options.logAreaId);
        if (logArea) {
            logArea.innerHTML = '';
            this.logs = [];
            this.logCount = 0;
            this._updateCounter();
            this.log('Log cleared', 'system');
        }
    }

    /**
     * ดึง Log ทั้งหมด
     * @returns {Array} อาร์เรย์ของ log entries
     */
    getAllLogs() {
        return [...this.logs];
    }

    /**
     * กรอง Log ตามประเภท
     * @param {string} type - ประเภทที่ต้องการกรอง
     * @returns {Array} อาร์เรย์ของ log entries ที่กรองแล้ว
     */
    filterByType(type) {
        return this.logs.filter(log => log.type === type);
    }

    /**
     * ดาวน์โหลด Log เป็นไฟล์ JSON
     */
    downloadAsJSON() {
        const data = {
            logs: this.logs,
            totalLogs: this.logCount,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('Logs downloaded as JSON', 'system');
    }

    /**
     * Export Log เป็น text
     * @returns {string} ข้อความ log ทั้งหมด
     */
    exportAsText() {
        let text = '=== DEBUG LOGS ===\n';
        text += `Exported: ${new Date().toLocaleString('th-TH')}\n`;
        text += `Total logs: ${this.logCount}\n\n`;

        this.logs.forEach(log => {
            text += `[${log.timestamp}] ${log.icon} ${log.type.toUpperCase()}: ${log.message}\n`;
        });

        return text;
    }

    /**
     * สร้าง HTML container สำหรับ Debug Log
     */
    _createDebugContainer() {
        const container = document.createElement('div');
        container.id = this.options.containerId;
        container.className = 'fixed bottom-4 right-4 w-96 max-w-full bg-white rounded-lg shadow-xl border border-gray-300 z-50';
        container.innerHTML = `
            <div class="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div class="flex items-center">
                    <h3 class="text-lg font-semibold text-gray-700">
                        <i class="fas fa-terminal mr-2"></i>Debug Console
                    </h3>
                    <span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full" id="${this.options.countDisplayId}">0</span>
                </div>
                <div class="flex space-x-2">
                    <button id="minimizeBtn" class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button id="clearLogBtn" class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                        <i class="fas fa-trash mr-1"></i>Clear
                    </button>
                </div>
            </div>
            
            <div class="p-3 bg-gray-900 text-gray-100">
                <div class="flex justify-between items-center mb-2">
                    <div class="text-sm">
                        <span>Time: <span id="${this.options.timeDisplayId}">00:00:00</span></span>
                    </div>
                    <div class="flex space-x-1">
                        <button id="exportJSONBtn" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" title="Export as JSON">
                            <i class="fas fa-download mr-1"></i>JSON
                        </button>
                        <button id="exportTextBtn" class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" title="Export as Text">
                            <i class="fas fa-file-text mr-1"></i>TXT
                        </button>
                    </div>
                </div>
                
                <div id="${this.options.logAreaId}" class="debug-log-area h-64 overflow-y-auto font-mono text-sm">
                    <!-- Logs will appear here -->
                </div>
            </div>
            
            <div class="p-2 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between">
                <div class="flex space-x-1">
                    <button class="filter-btn px-2 py-1 text-xs rounded active:bg-blue-500 active:text-white" data-type="all">All</button>
                    <button class="filter-btn px-2 py-1 text-xs rounded bg-blue-100 text-blue-700" data-type="info">Info</button>
                    <button class="filter-btn px-2 py-1 text-xs rounded bg-green-100 text-green-700" data-type="success">Success</button>
                    <button class="filter-btn px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700" data-type="warning">Warning</button>
                    <button class="filter-btn px-2 py-1 text-xs rounded bg-red-100 text-red-700" data-type="error">Error</button>
                    <button class="filter-btn px-2 py-1 text-xs rounded bg-purple-100 text-purple-700" data-type="debug">Debug</button>
                </div>
                <button id="closeDebugBtn" class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    <i class="fas fa-times mr-1"></i>Close
                </button>
            </div>
        `;

        document.body.appendChild(container);
        
        // ตั้งค่าปุ่ม toggle ในหน้า
        this._createToggleButton();
    }

    /**
     * สร้างปุ่ม toggle สำหรับแสดง/ซ่อน debug log
     */
    _createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = this.options.toggleBtnId;
        toggleBtn.className = 'fixed bottom-4 left-4 px-3 py-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-900 z-40 flex items-center';
        toggleBtn.innerHTML = '<i class="fas fa-terminal mr-2"></i>Debug';
        
        document.body.appendChild(toggleBtn);
    }

    /**
     * ตั้งค่า event listeners
     */
    _setupEventListeners() {
        // Toggle button
        const toggleBtn = this._getElement(this.options.toggleBtnId);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Clear button
        const clearBtn = this._getElement(this.options.clearBtnId);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }

        // Close button
        const closeBtn = document.getElementById('closeDebugBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Minimize button
        const minimizeBtn = document.getElementById('minimizeBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                const logArea = this._getElement(this.options.logAreaId);
                if (logArea) {
                    logArea.classList.toggle('h-64');
                    logArea.classList.toggle('h-32');
                }
            });
        }

        // Export buttons
        const exportJSONBtn = document.getElementById('exportJSONBtn');
        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => this.downloadAsJSON());
        }

        const exportTextBtn = document.getElementById('exportTextBtn');
        if (exportTextBtn) {
            exportTextBtn.addEventListener('click', () => {
                const text = this.exportAsText();
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this._filterLogs(type);
                
                // อัปเดตสถานะปุ่ม active
                filterButtons.forEach(b => {
                    if (b.dataset.type === type) {
                        b.classList.add('bg-blue-500', 'text-white');
                        b.classList.remove('bg-gray-100', 'text-gray-700');
                    } else {
                        b.classList.remove('bg-blue-500', 'text-white');
                        const colorClass = this._getButtonColorClass(b.dataset.type);
                        b.classList.add(colorClass);
                    }
                });
            });
        });
    }

    /**
     * Override console methods
     */
    _overrideConsoleMethods() {
        const original = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };

        console.log = (...args) => {
            original.log(...args);
            this.log(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '), 'debug');
        };

        console.info = (...args) => {
            original.info(...args);
            this.log(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '), 'info');
        };

        console.warn = (...args) => {
            original.warn(...args);
            this.log(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '), 'warning');
        };

        console.error = (...args) => {
            original.error(...args);
            this.log(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '), 'error');
        };

        console.debug = (...args) => {
            original.debug(...args);
            this.log(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '), 'debug');
        };

        // เก็บ reference ดั้งเดิมไว้
        window.originalConsole = original;
    }

    /**
     * เพิ่ม log entry ลงใน UI
     */
    _appendLogToUI(logEntry) {
        const logArea = this._getElement(this.options.logAreaId);
        if (!logArea) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry p-2 border-b border-gray-800 last:border-b-0 ${logEntry.color}`;
        logElement.innerHTML = `
            <div class="flex items-start">
                <span class="mr-2 flex-shrink-0">${logEntry.icon}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between">
                        <span class="text-xs text-gray-400">${logEntry.timestamp}</span>
                        <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">${logEntry.type}</span>
                    </div>
                    <div class="mt-1 break-words">${this._escapeHtml(logEntry.message)}</div>
                </div>
            </div>
        `;

        logArea.appendChild(logElement);
        logArea.scrollTop = logArea.scrollHeight;
    }

    /**
     * อัปเดต counter
     */
    _updateCounter() {
        const countDisplay = this._getElement(this.options.countDisplayId);
        if (countDisplay) {
            countDisplay.textContent = this.logCount;
            
            // เปลี่ยนสีถ้ามี error
            if (this.filterByType('error').length > 0) {
                countDisplay.classList.remove('bg-blue-100', 'text-blue-800');
                countDisplay.classList.add('bg-red-100', 'text-red-800');
            } else {
                countDisplay.classList.remove('bg-red-100', 'text-red-800');
                countDisplay.classList.add('bg-blue-100', 'text-blue-800');
            }
        }
    }

    /**
     * ตั้งค่า time updater
     */
    _setupTimeUpdater() {
        const timeDisplay = this._getElement(this.options.timeDisplayId);
        if (!timeDisplay) return;

        const updateTime = () => {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleTimeString('th-TH', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    /**
     * กรอง logs ตามประเภท
     */
    _filterLogs(type) {
        const logArea = this._getElement(this.options.logAreaId);
        if (!logArea) return;

        // ล้าง logs ปัจจุบัน
        logArea.innerHTML = '';

        // แสดง logs ตามที่กรอง
        const logsToShow = type === 'all' 
            ? this.logs 
            : this.logs.filter(log => log.type === type);

        logsToShow.forEach(log => {
            this._appendLogToUI(log);
        });
    }

    /**
     * ดึง element โดย ID
     */
    _getElement(id) {
        return document.getElementById(id);
    }

    /**
     * Escape HTML
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * ดึงคลาสสีสำหรับปุ่ม filter
     */
    _getButtonColorClass(type) {
        switch(type) {
            case 'info': return 'bg-blue-100 text-blue-700';
            case 'success': return 'bg-green-100 text-green-700';
            case 'warning': return 'bg-yellow-100 text-yellow-700';
            case 'error': return 'bg-red-100 text-red-700';
            case 'debug': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    // Aliases for convenience
    info(message) { return this.log(message, 'info'); }
    success(message) { return this.log(message, 'success'); }
    warning(message) { return this.log(message, 'warning'); }
    error(message) { return this.log(message, 'error'); }
    debug(message) { return this.log(message, 'debug'); }
}

// สร้าง global instance
window.DebugLogger = new DebugLogger();

// Auto-initialize เมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    window.DebugLogger.init();
});

console.log('✅ Debug Logger loaded');