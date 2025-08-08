class FullCapOS {
    constructor() {
        this.startScreen = document.getElementById('startScreen');
        this.cameraScreen = document.getElementById('cameraScreen');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.loadingText = document.querySelector('.loading-text');
        this.video = document.getElementById('video');
        this.overlay = document.getElementById('overlay');
        this.cameraSelectBtn = document.getElementById('cameraSelectBtn');
        this.cameraDropdown = document.getElementById('cameraDropdown');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.resolution = document.getElementById('resolution');
        this.fps = document.getElementById('fps');
        
        this.stream = null;
        this.captureCards = [];

        this.fpsCounter = 0;
        this.lastFpsTime = Date.now();
        this.mouseTimeout = null;
        this.dropdownOpen = false;
        this.selectedIndex = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.startLoading();
    }
    
    bindEvents() {
        // Mouse movement for overlay
        document.addEventListener('mousemove', () => this.showOverlay());
        document.addEventListener('mouseleave', () => this.hideOverlay());
        
        // Capture card selection
        this.cameraSelectBtn.addEventListener('click', () => this.toggleDropdown());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.cameraSelectBtn.contains(e.target) && !this.cameraDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Fullscreen button
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.fullscreenElement) {
                this.exitFullscreen();
            }
            
            // F key for fullscreen toggle
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggleFullscreen();
            }
            
            // Show overlay on arrow key press
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.showOverlay();
            }
            
            // Navigation when overlay is visible
            if (this.overlay.classList.contains('visible')) {
                this.handleKeyboardNavigation(e);
            }
        });
        
        // FPS counter
        this.video.addEventListener('play', () => {
            this.startFpsCounter();
        });
    }
    
    showOverlay() {
        this.overlay.classList.add('visible');
        
        // Hide overlay after 3 seconds
        clearTimeout(this.mouseTimeout);
        this.mouseTimeout = setTimeout(() => {
            this.hideOverlay();
        }, 3000);
    }
    
    hideOverlay() {
        this.overlay.classList.remove('visible');
    }
    
    handleKeyboardNavigation(e) {
        const cameraSelectBtn = this.cameraSelectBtn;
        const fullscreenBtn = this.fullscreenBtn;
        const warningModal = document.querySelector('.warning-modal');
        
        // Check if warning modal is visible
        if (warningModal) {
            switch(e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    // Navigate to warning modal
                    warningModal.focus();
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    // Close warning modal
                    document.body.removeChild(warningModal);
                    break;
            }
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                // Focus previous element
                if (document.activeElement === fullscreenBtn) {
                    cameraSelectBtn.focus();
                } else if (document.activeElement === cameraSelectBtn) {
                    fullscreenBtn.focus();
                } else {
                    cameraSelectBtn.focus();
                }
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                // Focus next element
                if (document.activeElement === cameraSelectBtn) {
                    fullscreenBtn.focus();
                } else if (document.activeElement === fullscreenBtn) {
                    cameraSelectBtn.focus();
                } else {
                    cameraSelectBtn.focus();
                }
                break;
                
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                // Navigate dropdown options
                if (document.activeElement === cameraSelectBtn && this.dropdownOpen) {
                    const items = this.cameraDropdown.querySelectorAll('.dropdown-item');
                    const maxIndex = items.length - 1;
                    
                    if (e.key === 'ArrowUp') {
                        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : maxIndex;
                    } else {
                        this.selectedIndex = this.selectedIndex < maxIndex ? this.selectedIndex + 1 : 0;
                    }
                    
                    this.updateDropdownSelection();
                }
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                // Activate focused element or selected dropdown item
                if (document.activeElement === cameraSelectBtn) {
                    if (this.dropdownOpen) {
                        // Select the currently highlighted dropdown item
                        const items = this.cameraDropdown.querySelectorAll('.dropdown-item');
                        if (items[this.selectedIndex]) {
                            const deviceId = items[this.selectedIndex].dataset.value;
                            this.selectCamera(deviceId);
                        }
                    } else {
                        this.toggleDropdown();
                    }
                } else if (document.activeElement === fullscreenBtn) {
                    fullscreenBtn.click();
                }
                break;
        }
    }
    
    toggleDropdown() {
        // Check if we're running on file:// protocol
        const isFileProtocol = window.location.protocol === 'file:';
        
        if (isFileProtocol) {
            this.showFileProtocolWarning();
            return;
        }
        
        if (this.dropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    showFileProtocolWarning() {
        // Create warning modal
        const warningModal = document.createElement('div');
        warningModal.className = 'warning-modal';
        warningModal.innerHTML = `
            <h3>⚠️ Server Required</h3>
            <p>To access the full camera list, you need to run this application through a local server.</p>
            <div class="warning-steps">
                <p><strong>Option 1: Use Online Version</strong></p>
                <a href="https://devwithoutcod1ng.github.io/FullCamOS/" target="_blank" class="online-link">https://devwithoutcod1ng.github.io/FullCamOS/</a>
                <p><strong>Option 2: Local Server</strong></p>
                <code>python -m http.server 8000</code>
                <p>Then open: <code>http://localhost:8000</code></p>
            </div>
            <button class="warning-close">OK</button>
        `;
        
        // Add event listener to close button
        warningModal.querySelector('.warning-close').addEventListener('click', () => {
            document.body.removeChild(warningModal);
        });
        
        // Add event listener to close on background click
        warningModal.addEventListener('click', (e) => {
            if (e.target === warningModal) {
                document.body.removeChild(warningModal);
                document.removeEventListener('keydown', handleKeyPress);
            }
        });
        
        // Add keyboard event listener for Enter/Space
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.body.removeChild(warningModal);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // Focus the modal for keyboard events
        warningModal.focus();
        warningModal.tabIndex = -1;
        
        // Add to page and show overlay
        document.body.appendChild(warningModal);
        this.showOverlay(); // Keep the overlay visible
    }
    
    openDropdown() {
        this.dropdownOpen = true;
        this.cameraSelectBtn.classList.add('open');
        this.cameraDropdown.classList.add('show');
        this.cameraSelectBtn.focus();
    }
    
    closeDropdown() {
        this.dropdownOpen = false;
        this.cameraSelectBtn.classList.remove('open');
        this.cameraDropdown.classList.remove('show');
    }
    
    updateDropdownSelection() {
        const items = this.cameraDropdown.querySelectorAll('.dropdown-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }
    
    selectCamera(deviceId) {
        this.closeDropdown();
        if (deviceId) {
            this.switchCamera(deviceId);
        }
    }
    
    async getAvailableCameras() {
        try {
            // Check if we're running on file:// protocol
            const isFileProtocol = window.location.protocol === 'file:';
            
            if (isFileProtocol) {
                // For file:// protocol, show default input
                this.cameraSelectBtn.textContent = 'Default Input';
                this.adjustButtonWidth();
                return;
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            
            // Fill camera list
            this.cameraDropdown.innerHTML = '<div class="dropdown-item" data-value="">Select Input...</div>';
            this.cameras.forEach((camera, index) => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.dataset.value = camera.deviceId;
                item.textContent = camera.label || `Camera ${index + 1}`;
                item.addEventListener('click', () => this.selectCamera(camera.deviceId));
                this.cameraDropdown.appendChild(item);
            });
            
            // Adjust button width to fit longest camera name
            this.adjustButtonWidth();
            
        } catch (error) {
            console.error('Error getting cameras:', error);
            // Fallback for any error
            this.cameraSelectBtn.textContent = 'Default Input';
            this.adjustButtonWidth();
        }
    }
    
    adjustButtonWidth() {
        const items = this.cameraDropdown.querySelectorAll('.dropdown-item');
        let maxWidth = 0;
        
        // Create temporary element to measure text width
        const temp = document.createElement('span');
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.whiteSpace = 'nowrap';
        temp.style.font = window.getComputedStyle(this.cameraSelectBtn).font;
        document.body.appendChild(temp);
        
        // Find the longest text
        items.forEach(item => {
            temp.textContent = item.textContent;
            const width = temp.offsetWidth;
            maxWidth = Math.max(maxWidth, width);
        });
        
        // Remove temporary element
        document.body.removeChild(temp);
        
        // Set button width (add padding and arrow space)
        const padding = 24; // 12px left + 12px right
        const arrowSpace = 20; // Space for arrow
        const totalWidth = Math.max(maxWidth + padding + arrowSpace, 150); // Minimum 150px
        
        this.cameraSelectBtn.style.width = totalWidth + 'px';
    }
    
    async startCamera(deviceId = null) {
        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'user'
                },
                audio: false
            };
            
            // Select specific camera if provided
            if (deviceId) {
                constraints.video.deviceId = { exact: deviceId };
            }
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Wait for video to actually start playing before showing it
            this.video.addEventListener('loadedmetadata', () => {
                this.updateCameraInfo();
            });
            
            this.video.addEventListener('canplay', () => {
                // Video is ready to play, now fade it in
                this.video.style.transition = 'opacity 1s ease';
                this.video.style.opacity = '1';
            });
            
        } catch (error) {
            console.error('Camera error:', error);
            // Show error message in overlay
            this.showErrorMessage('Camera access denied. Please allow camera access or use a local server.');
        }
    }
    
    showErrorMessage(message) {
        // Create or update error message in overlay
        let errorDiv = this.overlay.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            this.overlay.querySelector('.overlay-content').appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        this.showOverlay();
    }
    
    async switchCamera(deviceId) {
        await this.startCamera(deviceId);
    }
    
    updateCameraInfo() {
        if (this.video.videoWidth && this.video.videoHeight) {
            this.resolution.textContent = `${this.video.videoWidth}×${this.video.videoHeight}`;
        }
    }
    
    startFpsCounter() {
        const countFps = () => {
            this.fpsCounter++;
            const now = Date.now();
            
            if (now - this.lastFpsTime >= 1000) {
                this.fps.textContent = `${this.fpsCounter} FPS`;
                this.fpsCounter = 0;
                this.lastFpsTime = now;
            }
            
            if (!this.video.paused) {
                requestAnimationFrame(countFps);
            }
        };
        
        requestAnimationFrame(countFps);
    }
    
    toggleFullscreen() {
        // Check current fullscreen state and toggle accordingly
        if (document.fullscreenElement) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    enterFullscreen() {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().then(() => {
                    this.fullscreenBtn.textContent = '⛶';
                }).catch((err) => {
                    console.log('Fullscreen failed:', err);
                    // Fallback: use our custom fullscreen
                    this.enterCustomFullscreen();
                });
            } else {
                // Fallback for browsers that don't support fullscreen API
                this.enterCustomFullscreen();
            }
        } catch (error) {
            console.log('Fullscreen error:', error);
            this.enterCustomFullscreen();
        }
    }
    
    enterCustomFullscreen() {
        // Custom fullscreen implementation
        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
        this.fullscreenBtn.textContent = '⛶';
    }
    
    exitFullscreen() {
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        } catch (error) {
            console.log('Exit fullscreen error:', error);
        }
        
        // Reset custom fullscreen styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        
        this.fullscreenBtn.textContent = '⛶';
    }
    
    async startLoading() {
        const loadingSteps = [
            { progress: 20, text: 'Initializing Capture Card OS...', action: () => this.initializeSystem() },
            { progress: 40, text: 'Loading capture card...', action: () => this.loadCamera() },
            { progress: 60, text: 'Preparing UI...', action: () => this.prepareUI() },
            { progress: 80, text: 'Starting FullCapOS...', action: () => this.prepareFullCapOS() },
            { progress: 100, text: 'Ready!', action: () => this.finalizeLoading() }
        ];
        
        let currentStep = 0;
        
        const updateLoading = async () => {
            if (currentStep < loadingSteps.length) {
                const step = loadingSteps[currentStep];
                this.loadingProgress.style.width = step.progress + '%';
                this.loadingText.textContent = step.text;
                
                // Execute the actual loading action
                try {
                    await step.action();
                } catch (error) {
                    console.error('Loading step failed:', error);
                }
                
                currentStep++;
                
                // Continue to next step
                updateLoading();
            } else {
                // All loading complete
                setTimeout(() => {
                    this.startFullCapOS();
                }, 300);
            }
        };
        
        // Start loading animation
        updateLoading();
    }
    
    async initializeSystem() {
        // Initialize basic system components
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('System initialized');
    }
    
    async loadCamera() {
        // Start capture card in background
        try {
            await this.getAvailableCameras();
            await this.startCamera(); // Actually start the capture card
            console.log('Capture card loaded and running');
        } catch (error) {
            console.error('Capture card loading failed:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async prepareUI() {
        // Prepare UI elements in background
        this.cameraScreen.style.display = 'block';
        this.cameraScreen.style.opacity = '0';
        this.cameraScreen.style.visibility = 'visible';
        this.cameraScreen.style.transition = 'opacity 1s ease';
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('UI prepared');
    }
    
    async prepareFullCapOS() {
        // Prepare FullCapOS components in background
        // Pre-load all UI elements and functionality
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log('FullCapOS prepared');
    }
    
    async finalizeLoading() {
        // Final preparations
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('Loading finalized');
    }
    
    startFullCapOS() {
        // Smooth transition from loading to capture card
        this.startScreen.style.opacity = '0';
        this.startScreen.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            this.startScreen.style.display = 'none';
            
            // Smooth fade in of capture card screen
            this.cameraScreen.style.opacity = '1';
            
            // Capture card is already running, just enter fullscreen
            this.enterFullscreen();
        }, 500);
    }
}

// Initialize FullCapOS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FullCapOS();
}); 