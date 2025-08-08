# FullCapOS - Capture Card Operating System

A specialized operating system designed for capture cards, providing fullscreen video display and real-time capture card management. FullCapOS functions as a dedicated system for professional video capture and streaming workflows.

## 🚀 Features

- **Capture Card OS**: Dedicated operating system for capture card management
- **Fullscreen Display**: Capture cards displayed in fullscreen mode
- **Real-time Input Switching**: Seamless switching between capture card inputs
- **Professional Workflow**: Optimized for streaming and video production
- **Standalone Operation**: Functions as a dedicated capture card system
- **File Protocol Support**: Works when opening HTML file directly (with limitations)

## 📋 Requirements

- Modern web browser with HTML5 support
- Capture card or video input device
- HTTPS connection or localhost (for full input list functionality)

## 🛠️ Installation

### Option 1: Direct File Opening (Limited)
Simply double-click the `index.html` file to open it in your browser.
- ✅ Camera works
- ⚠️ Only shows "Default Camera" option
- ⚠️ No camera list available

### Option 2: Local Server (Recommended)
1. **Download files**
2. **Start local server**
   
   **Python:**
   ```bash
   python -m http.server 8000
   ```
   
   **Node.js:**
   ```bash
   npx http-server -p 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```
- ✅ Full camera list functionality
- ✅ All features work properly

## 🎯 Usage

FullCapOS starts automatically when opening the page and displays capture card inputs in fullscreen mode.

### File Protocol Limitations
When opening the HTML file directly (file:// protocol):
- Browser security restrictions prevent input enumeration
- Only "Default Input" option is available
- Capture card still works but you can't choose specific inputs
- Use a local server for full functionality

## 🔒 Privacy

- No data transmission
- All data stays local
- Capture card access only with permission
- Dedicated system for professional use

---

**FullCapOS - Professional Capture Card Operating System** 