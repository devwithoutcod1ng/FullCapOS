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
        this.systemError = false; // Track if system has error
        
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
        
        const isHttps = window.location.protocol === 'https:';
        const isFileProtocol = window.location.protocol === 'file:';
        
        let warningTitle, warningMessage;
        
        if (isFileProtocol) {
            warningTitle = '⚠️ Local Server Required';
            warningMessage = 'To access the full camera list, you need to run this application through a local server.';
        } else {
            warningTitle = '⚠️ HTTPS Required';
            warningMessage = 'To access the full camera list, you need to use HTTPS or run this application through a local server.';
        }
        
        warningModal.innerHTML = `
            <h3>${warningTitle}</h3>
            <p>${warningMessage}</p>
            <div class="warning-steps">
                <p><strong>Step 1: Download FullCapOS</strong></p>
                <a href="https://devwithoutcod1ng.github.io/FullCapOS/" target="_blank" class="online-link">https://devwithoutcod1ng.github.io/FullCapOS/</a>
                <p><strong>Step 2: Extract and Start Server</strong></p>
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
        // Refresh device list when opening dropdown to catch any new devices
        this.refreshDeviceList().then(() => {
            // Check if we have real device names after refresh
            if (this.cameras && this.cameras.length > 0) {
                const hasRealNames = this.cameras.some(camera => {
                    const label = camera.label || '';
                    return label.length > 0 && 
                           !label.match(/^Camera\s*\d+$/i) && 
                           !label.match(/^Camera$/i) &&
                           label !== 'Default';
                });
                
                if (hasRealNames) {
                    // Only open dropdown if we have real device names
                    this.dropdownOpen = true;
                    this.cameraSelectBtn.classList.add('open');
                    this.cameraDropdown.classList.add('show');
                    this.cameraSelectBtn.focus();
                } else {
                    // Show error message if no real names found
                    this.showErrorMessage('Die Kameraliste konnte nicht geladen werden. Bitte überprüfen Sie Ihre Kameraberechtigungen oder versuchen Sie die Seite neu zu laden.');
                }
            } else {
                // Show error message if no cameras found
                this.showErrorMessage('Die Kameraliste konnte nicht geladen werden. Bitte überprüfen Sie Ihre Kameraberechtigungen oder versuchen Sie die Seite neu zu laden.');
            }
        }).catch(error => {
            console.error('Failed to refresh device list:', error);
            // Show error message if refresh fails
            this.showErrorMessage('Die Kameraliste konnte nicht geladen werden. Bitte überprüfen Sie Ihre Kameraberechtigungen oder versuchen Sie die Seite neu zu laden.');
        });
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
        if (deviceId && deviceId !== '') {
            this.switchCamera(deviceId);
        } else {
            // Show error message if "Default" is selected
            this.showErrorMessage('Die Kameraliste konnte nicht geladen werden. Bitte überprüfen Sie Ihre Kameraberechtigungen oder versuchen Sie die Seite neu zu laden.');
        }
    }
    
    async getAvailableCameras() {
        try {
            // Try to get devices with multiple attempts for slow devices (all protocols)
            let devices = [];
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    devices = await navigator.mediaDevices.enumerateDevices();
                    this.cameras = devices.filter(device => device.kind === 'videoinput');
                    
                    // If we found cameras with labels, we're good
                    if (this.cameras.length > 0 && this.cameras.some(camera => camera.label)) {
                        break;
                    }
                    
                    // If no cameras found or no labels, wait and try again
                    if (attempts < maxAttempts - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    attempts++;
                } catch (error) {
                    console.warn(`Device enumeration attempt ${attempts + 1} failed:`, error);
                    if (attempts < maxAttempts - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    attempts++;
                }
            }
            
            // Fill camera list
            this.cameraDropdown.innerHTML = '<div class="dropdown-item" data-value="">Select Input...</div>';
            
            if (this.cameras.length > 0) {
                this.cameras.forEach((camera, index) => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.dataset.value = camera.deviceId;
                    item.textContent = camera.label || `Camera ${index + 1}`;
                    item.addEventListener('click', () => this.selectCamera(camera.deviceId));
                    this.cameraDropdown.appendChild(item);
                });
                
                // Set button text to first camera or "Select Input..."
                if (this.cameras.length > 0) {
                    this.cameraSelectBtn.textContent = this.cameras[0].label || `Camera 1`;
                } else {
                    this.cameraSelectBtn.textContent = 'Select Input...';
                }
            } else {
                // No cameras found, show default option
                this.cameraSelectBtn.textContent = 'Default';
            }
            
            // Adjust button width to fit longest camera name
            this.adjustButtonWidth();
            
        } catch (error) {
            console.error('Error getting cameras:', error);
            // Fallback for any error
            this.cameraSelectBtn.textContent = 'Default';
            this.adjustButtonWidth();
        }
    }
    
    async refreshDeviceList() {
        // Method to refresh device list after initial loading
        console.log('Refreshing device list...');
        await this.getAvailableCameras();
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
            
            // Camera permission already requested at the beginning, so this should work
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
            { progress: 10, text: 'Requesting camera permission...', action: () => this.requestCameraPermission() },
            { progress: 20, text: 'Initializing Capture Card OS...', action: () => this.initializeSystem() },
            { progress: 40, text: 'Loading device list...', action: () => this.loadDeviceList() },
            { progress: 60, text: 'Loading capture card...', action: () => this.loadCamera() },
            { progress: 80, text: 'Preparing UI...', action: () => this.prepareUI() },
            { progress: 95, text: 'Starting FullCapOS...', action: () => this.prepareFullCapOS() },
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
    
    async requestCameraPermission() {
        // Request camera permission at the very beginning
        try {
            console.log('Requesting camera permission...');
            
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Request basic camera access to get permission
                const tempStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1, height: 1 }, // Minimal constraints
                    audio: false
                });
                
                // Stop the temporary stream immediately
                tempStream.getTracks().forEach(track => track.stop());
                
                console.log('Camera permission granted');
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
                console.log('MediaDevices API not available');
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (permissionError) {
            console.warn('Camera permission denied or not available:', permissionError);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    async initializeSystem() {
        // Initialize basic system components
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('System initialized');
    }
    
    async loadDeviceList() {
        // Load device list early to avoid delays later
        // Scan for device list everywhere (HTTP, HTTPS, file:// protocol)
        try {
            console.log('Starting device list loading...');
            this.loadingText.textContent = 'Loading device list...';
            
            let attempts = 0;
            const maxAttempts = 5; // Reduced from 20 to 5 attempts
            const checkInterval = 500; // Check every 500ms
            const maxWaitTime = 15000; // Maximum 15 seconds total wait time
            let hasRealDeviceNames = false;
            const startTime = Date.now();
            
            while (attempts < maxAttempts && !hasRealDeviceNames) {
                attempts++;
                console.log(`Device list loading attempt ${attempts}/${maxAttempts}...`);
                
                // Check if we've exceeded maximum wait time
                if (Date.now() - startTime > maxWaitTime) {
                    console.log('Maximum wait time exceeded, proceeding with available devices');
                    break;
                }
                
                // Update loading text to show progress
                this.loadingText.textContent = `Loading device list... (Attempt ${attempts}/${maxAttempts})`;
                
                // Update progress bar to show we're working
                const progressPercent = 15 + (attempts / maxAttempts) * 20; // Progress from 15% to 35%
                this.loadingProgress.style.width = Math.min(progressPercent, 35) + '%';
                
                try {
                    await this.getAvailableCameras();
                    
                    // Check if we have real device names (not just "Camera 1")
                    if (this.cameras && this.cameras.length > 0) {
                        const hasRealNames = this.cameras.some(camera => {
                            const label = camera.label || '';
                            // Check if the label is not just "Camera X" or empty
                            return label.length > 0 && 
                                   !label.match(/^Camera\s*\d+$/i) && 
                                   !label.match(/^Camera$/i) &&
                                   label !== 'Default Input';
                        });
                        
                        if (hasRealNames) {
                            hasRealDeviceNames = true;
                            console.log(`Found real device names after ${attempts} attempts!`);
                            break;
                        } else {
                            console.log(`Attempt ${attempts}: Only found generic names (Camera 1, etc.), retrying...`);
                        }
                    } else {
                        console.log(`Attempt ${attempts}: No cameras found, retrying...`);
                    }
                    
                    // Wait before next attempt
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, checkInterval));
                    }
                    
                } catch (error) {
                    console.warn(`Device list loading attempt ${attempts} failed:`, error);
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, checkInterval));
                    }
                }
            }
            
            if (hasRealDeviceNames) {
                console.log(`Device list loaded successfully after ${attempts} attempts. Found ${this.cameras ? this.cameras.length : 0} devices with real names.`);
                this.loadingText.textContent = `Device list loaded successfully!`;
            } else {
                console.log(`Device list loading completed after ${attempts} attempts, but only found generic names.`);
                this.showSystemError();
                return; // Stop loading process
            }
            
        } catch (error) {
            console.error('Device list loading failed:', error);
            this.showSystemError();
            return; // Stop loading process
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async loadCamera() {
        // Skip camera loading if system has error
        if (this.systemError) {
            console.log('Skipping camera loading due to system error');
            return;
        }
        
        // Start capture card in background
        try {
            await this.startCamera(); // Actually start the capture card
            console.log('Capture card loaded and running');
        } catch (error) {
            console.error('Capture card loading failed:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async prepareUI() {
        // Skip UI preparation if system has error
        if (this.systemError) {
            console.log('Skipping UI preparation due to system error');
            return;
        }
        
        // Prepare UI elements in background
        this.cameraScreen.style.display = 'block';
        this.cameraScreen.style.opacity = '0';
        this.cameraScreen.style.visibility = 'visible';
        this.cameraScreen.style.transition = 'opacity 1s ease';
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('UI prepared');
    }
    
    async prepareFullCapOS() {
        // Skip FullCapOS preparation if system has error
        if (this.systemError) {
            console.log('Skipping FullCapOS preparation due to system error');
            return;
        }
        
        // Prepare FullCapOS components in background
        // Pre-load all UI elements and functionality
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log('FullCapOS prepared');
    }
    
    async finalizeLoading() {
        // Skip finalization if system has error
        if (this.systemError) {
            console.log('Skipping finalization due to system error');
            return;
        }
        
        // Final preparations
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('Loading finalized');
    }
    
    startFullCapOS() {
        // Skip starting FullCapOS if system has error
        if (this.systemError) {
            console.log('Skipping FullCapOS start due to system error');
            return;
        }
        
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
    
    showSystemError() {
        // Set system error flag to prevent further loading
        this.systemError = true;
        
        // Show system error with red exclamation mark and error message
        const startContent = this.startScreen.querySelector('.start-content');
        startContent.innerHTML = `
            <div style="text-align: center; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-size: 120px; color: #ff4444; margin-bottom: 30px;">⚠️</div>
                <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 20px; letter-spacing: 2px;">FullCapOS</h1>
                <h2 style="font-size: 1.5rem; color: #ff4444; margin-bottom: 30px;">Not Working Properly</h2>
                <p style="font-size: 1.1rem; line-height: 1.6; max-width: 600px; margin: 0 auto 30px; opacity: 0.9;">
                    Camera device list could not be loaded. FullCapOS cannot start without proper camera detection.
                </p>
                <div style="background: rgba(255, 68, 68, 0.1); border: 1px solid #ff4444; border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
                    <h3 style="color: #ff4444; margin-bottom: 15px;">Possible Solutions:</h3>
                    <ul style="text-align: left; list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;">🔄 Reload the page</li>
                        <li style="margin-bottom: 10px;">📷 Check camera permissions</li>
                        <li style="margin-bottom: 10px;">🔌 Check camera connection</li>
                        <li style="margin-bottom: 10px;">🌐 Use HTTPS</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Hide the loading animation
        this.loadingProgress.style.display = 'none';
        this.loadingText.style.display = 'none';
    }
}

// Initialize FullCapOS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FullCapOS();
}); 