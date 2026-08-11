// github-fix.js - รองรับทั้ง Local และ GitHub Pages
// Version: 1.0.0
console.log('🚀 GitHub Fix loaded');

(function() {
    'use strict';
    
    // ตรวจสอบ environment
    const isGitHubPages = window.location.hostname.includes('github.io');
    const currentPath = window.location.pathname;
    
    console.log('🌐 Environment:', {
        hostname: window.location.hostname,
        path: currentPath,
        isGitHubPages: isGitHubPages
    });
    
    // ฟังก์ชันสำหรับหา repo name บน GitHub Pages
    function getRepoName() {
        if (!isGitHubPages) return '';
        
        const pathParts = currentPath.split('/').filter(p => p);
        // ถ้าเป็น user page (username.github.io) อาจไม่มี repo name
        // ถ้าเป็น project page (username.github.io/repo-name) จะมี repo name
        if (pathParts.length > 0 && pathParts[0] !== '') {
            return pathParts[0];
        }
        return ''; // user page
    }
    
    // ฟังก์ชันสำหรับสร้าง base path
    function getBasePath() {
        const repoName = getRepoName();
        
        if (isGitHubPages) {
            if (repoName) {
                return `/${repoName}`; // project page
            } else {
                return ''; // user page
            }
        } else {
            // Local development
            const path = currentPath.substring(0, currentPath.lastIndexOf('/'));
            return path === '' ? '.' : path;
        }
    }
    
    // ฟังก์ชันแก้ไข path สำหรับไฟล์ต่างๆ
    function fixPath(originalPath) {
        if (!originalPath) return originalPath;
        
        // ถ้าเป็น external URL ไม่ต้องแก้ไข
        if (originalPath.startsWith('http') || originalPath.startsWith('//')) {
            return originalPath;
        }
        
        const basePath = getBasePath();
        
        // เอา leading slash ออกถ้ามี
        let cleanPath = originalPath;
        if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }
        
        // แก้ไข path สำหรับ GitHub Pages
        if (isGitHubPages) {
            if (basePath) {
                return `/${basePath}/${cleanPath}`;
            } else {
                return `/${cleanPath}`;
            }
        } else {
            // Local
            if (basePath === '.') {
                return cleanPath;
            }
            return `${basePath}/${cleanPath}`;
        }
    }
    
    // ฟังก์ชันโหลดไฟล์ CSS
    function loadCSS(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fixPath(url);
            link.onload = () => {
                console.log(`✅ CSS loaded: ${url}`);
                resolve();
            };
            link.onerror = () => {
                console.error(`❌ Failed to load CSS: ${url}`);
                reject(new Error(`CSS load failed: ${url}`));
            };
            document.head.appendChild(link);
        });
    }
    
    // ฟังก์ชันโหลดไฟล์ JavaScript
    function loadJS(url, isModule = false) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            if (isModule) {
                script.type = 'module';
            }
            script.src = fixPath(url);
            script.onload = () => {
                console.log(`✅ JS loaded: ${url}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load JS: ${url}`);
                reject(new Error(`JS load failed: ${url}`));
            };
            document.body.appendChild(script);
        });
    }
    
    // ฟังก์ชันโหลดไฟล์ HTML (สำหรับ fetch)
    async function loadHTML(url) {
        try {
            const response = await fetch(fixPath(url));
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`❌ Failed to load HTML: ${url}`, error);
            throw error;
        }
    }
    
    // Export ฟังก์ชันทั้งหมดให้ใช้งานได้ทั่วระบบ
    window.githubFix = {
        isGitHubPages,
        getRepoName,
        getBasePath,
        fixPath,
        loadCSS,
        loadJS,
        loadHTML,
        
        // ฟังก์ชันสำหรับโหลดไฟล์ทั้งหมดใน project
        loadAllAssets: async function() {
            try {
                console.log('📦 Loading all assets...');
                
                // โหลด CSS
                await this.loadCSS('css/PsychomatrixStyle.css');
                await this.loadCSS('css/result-style.css');
                
                // โหลด JS (เรียงลำดับตาม dependency)
                await this.loadJS('js/debug-logger.js');
                await this.loadJS('js/pythagorean.js');
                await this.loadJS('js/result.js');
                
                console.log('✅ All assets loaded successfully');
                return true;
            } catch (error) {
                console.error('❌ Failed to load assets:', error);
                return false;
            }
        }
    };
    
    console.log('✅ GitHub Fix initialized');
})();