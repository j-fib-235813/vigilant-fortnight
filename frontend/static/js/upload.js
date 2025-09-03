// Upload page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadForm = document.getElementById('uploadForm');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const imageFile = document.getElementById('imageFile');
    const filePreview = document.getElementById('filePreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const meshCount = document.getElementById('meshCount');
    const customMesh = document.getElementById('customMesh');
    const canvasSize = document.getElementById('canvasSize');
    const customSizeRow = document.getElementById('customSizeRow');
    const customStitchRow = document.getElementById('customStitchRow');
    const customWidth = document.getElementById('customWidth');
    const customHeight = document.getElementById('customHeight');
    const customStitchWidth = document.getElementById('customStitchWidth');
    const customStitchHeight = document.getElementById('customStitchHeight');
    const maxColors = document.getElementById('maxColors');
    const patternPreview = document.getElementById('patternPreview');
    const patternCanvas = document.getElementById('patternCanvas');
    const previewCanvasSize = document.getElementById('previewCanvasSize');
    const previewMeshCount = document.getElementById('previewMeshCount');
    const previewColorsUsed = document.getElementById('previewColorsUsed');
    const previewTotalStitches = document.getElementById('previewTotalStitches');
    const colorSwatches = document.getElementById('colorSwatches');
    const savePatternBtn = document.getElementById('savePatternBtn');
    const downloadPatternBtn = document.getElementById('downloadPatternBtn');
    const saveModal = document.getElementById('saveModal');
    const folderModal = document.getElementById('folderModal');
    const patternName = document.getElementById('patternName');
    const patternFolder = document.getElementById('patternFolder');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const folderName = document.getElementById('folderName');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const confirmFolderBtn = document.getElementById('confirmFolderBtn');
    const cancelSaveBtn = document.getElementById('cancelSaveBtn');
    const cancelFolderBtn = document.getElementById('cancelFolderBtn');

    // Global variables
    let currentPatternData = null;
    let currentOriginalImage = null;

    // File upload handling
    fileUploadArea.addEventListener('click', () => imageFile.click());
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#764ba2';
        fileUploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
    });

    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#667eea';
        fileUploadArea.style.background = 'rgba(102, 126, 234, 0.05)';
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#667eea';
        fileUploadArea.style.background = 'rgba(102, 126, 234, 0.05)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            imageFile.files = files;
            handleFileSelect();
        }
    });

    imageFile.addEventListener('change', handleFileSelect);

    function handleFileSelect() {
        const file = imageFile.files[0];
        if (file) {
            // Show file preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                filePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Form controls
    meshCount.addEventListener('change', function() {
        if (this.value === 'custom') {
            customMesh.style.display = 'block';
            customMesh.required = true;
        } else {
            customMesh.style.display = 'none';
            customMesh.required = false;
        }
    });

    canvasSize.addEventListener('change', function() {
        customSizeRow.style.display = 'none';
        customStitchRow.style.display = 'none';
        
        if (this.value === 'custom') {
            customSizeRow.style.display = 'grid';
        } else if (this.value === 'fit') {
            // Handle fit to image - will be processed on server
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const file = imageFile.files[0];
        
        if (!file) {
            showNotification('Please select an image file', 'error');
            return;
        }

        formData.append('image', file);
        
        // Get mesh count
        let meshValue = meshCount.value;
        if (meshValue === 'custom') {
            meshValue = customMesh.value;
            if (!meshValue) {
                showNotification('Please enter a custom mesh count', 'error');
                return;
            }
        }
        formData.append('mesh_count', meshValue);

        // Get canvas size
        let canvasValue = canvasSize.value;
        if (canvasValue === 'custom') {
            const width = customWidth.value;
            const height = customHeight.value;
            if (!width || !height) {
                showNotification('Please enter custom dimensions', 'error');
                return;
            }
            canvasValue = `${width}x${height}`;
        }
        formData.append('canvas_size', canvasValue);

        // Get max colors
        formData.append('max_colors', maxColors.value);

        // Show loading state
        const submitBtn = document.getElementById('createPatternBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Pattern...';
        submitBtn.disabled = true;

        // Send request
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentPatternData = data.pattern_data;
                currentOriginalImage = data.original_image;
                showPatternPreview(data);
            } else {
                showNotification(data.error || 'Failed to create pattern', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while creating the pattern', 'error');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });

    function showPatternPreview(data) {
        const pattern = data.pattern_data.pattern;
        const colors = data.pattern_data.colors_used;
        
        // Update preview information
        previewCanvasSize.textContent = data.canvas_size;
        previewMeshCount.textContent = data.mesh_count + ' mesh';
        previewColorsUsed.textContent = colors.length;
        previewTotalStitches.textContent = pattern.length * pattern[0].length;

        // Draw pattern preview
        drawPatternPreview(pattern);

        // Show color swatches
        showColorSwatches(colors);

        // Show preview
        patternPreview.style.display = 'block';
        patternPreview.scrollIntoView({ behavior: 'smooth' });
    }

    function drawPatternPreview(pattern) {
        const canvas = patternCanvas;
        const ctx = canvas.getContext('2d');
        const cellSize = 400 / Math.max(pattern.length, pattern[0].length);
        
        canvas.width = pattern[0].length * cellSize;
        canvas.height = pattern.length * cellSize;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pattern
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                const cell = pattern[y][x];
                const rgb = cell.rgb;
                
                ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                
                // Draw grid lines
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    function showColorSwatches(colors) {
        colorSwatches.innerHTML = '';
        
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
            swatch.title = `DMC ${color.dmc} - ${color.name}`;
            colorSwatches.appendChild(swatch);
        });
    }

    // Save pattern functionality
    savePatternBtn.addEventListener('click', function() {
        if (!currentPatternData) {
            showNotification('No pattern to save', 'error');
            return;
        }
        
        // Set default pattern name
        const file = imageFile.files[0];
        if (file) {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            patternName.value = nameWithoutExt;
        }
        
        saveModal.style.display = 'flex';
    });

    // Modal functionality
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    cancelSaveBtn.addEventListener('click', () => closeModal(saveModal));
    cancelFolderBtn.addEventListener('click', () => closeModal(folderModal));

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Create folder functionality
    createFolderBtn.addEventListener('click', function() {
        folderModal.style.display = 'flex';
    });

    confirmFolderBtn.addEventListener('click', function() {
        const name = folderName.value.trim();
        if (!name) {
            showNotification('Please enter a folder name', 'error');
            return;
        }

        fetch('/create_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add new folder to select
                const option = document.createElement('option');
                option.value = data.folder_id;
                option.textContent = name;
                patternFolder.appendChild(option);
                patternFolder.value = data.folder_id;
                
                closeModal(folderModal);
                folderName.value = '';
                showNotification('Folder created successfully', 'success');
            } else {
                showNotification(data.error || 'Failed to create folder', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while creating the folder', 'error');
        });
    });

    // Save pattern
    confirmSaveBtn.addEventListener('click', function() {
        const name = patternName.value.trim();
        if (!name) {
            showNotification('Please enter a pattern name', 'error');
            return;
        }

        const saveData = {
            name: name,
            original_image: currentOriginalImage,
            pattern_data: currentPatternData,
            canvas_size: previewCanvasSize.textContent,
            mesh_count: parseInt(previewMeshCount.textContent),
            colors_used: currentPatternData.colors_used,
            folder_id: patternFolder.value || null
        };

        fetch('/save_pattern', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saveData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeModal(saveModal);
                showNotification('Pattern saved successfully!', 'success');
                
                // Redirect to gallery after a short delay
                setTimeout(() => {
                    window.location.href = '/gallery';
                }, 1500);
            } else {
                showNotification(data.error || 'Failed to save pattern', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while saving the pattern', 'error');
        });
    });

    // Download pattern functionality
    downloadPatternBtn.addEventListener('click', function() {
        if (!currentPatternData) {
            showNotification('No pattern to download', 'error');
            return;
        }

        // Create download link for canvas
        const link = document.createElement('a');
        link.download = 'needlepoint_pattern.png';
        link.href = patternCanvas.toDataURL();
        link.click();
    });

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        document.body.appendChild(notification);
    }

    // Initialize
    console.log('Upload page initialized');
});
