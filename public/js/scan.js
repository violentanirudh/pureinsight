// Initialize state variables
let cropper;
let croppedImages = [];
        // Camera elements
const startCameraBtn = document.getElementById('startCameraBtn');
const cameraContainer = document.getElementById('cameraContainer');
const cameraVideo = document.getElementById('cameraVideo');
const captureBtn = document.getElementById('captureBtn');
const captureCanvas = document.getElementById('captureCanvas');

let stream = null;

// DOM Elements
const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const croppedImagesContainer = document.getElementById('croppedImagesContainer');
const analyzeAllBtn = document.getElementById('analyzeAllBtn');
const resultsContainer = document.getElementById('resultsContainer');
const detectedTextContainer = document.getElementById('detectedTextContainer');
const analysisContainer = document.getElementById('analysisContainer');


function updateAnalyzeButton() {
    if (croppedImages.length > 0) {
        analyzeAllBtn.removeAttribute('disabled');
        analyzeAllBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        analyzeAllBtn.setAttribute('disabled', 'true');
        analyzeAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

updateAnalyzeButton();

// Handle file input
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');

            // Initialize Cropper
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(previewImage, {
                aspectRatio: NaN,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                movable: true,
                rotatable: true,
                scalable: true,
                zoomable: true,
                zoomOnTouch: true,
                zoomOnWheel: true,
            });
        };
        reader.readAsDataURL(file);
    }
});

startCameraBtn.addEventListener('click', async () => {
    if (stream) {
        // Close camera
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        cameraContainer.classList.add('hidden');
        startCameraBtn.querySelector('p').textContent = 'Open';
    } else {
        // Open camera
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'environment'
                }, 
                audio: false 
            });
            cameraVideo.srcObject = stream;
            cameraContainer.classList.remove('hidden');
            startCameraBtn.querySelector('p').textContent = 'Close';
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    }
});

// Camera capture handler
captureBtn.addEventListener('click', () => {
    // Set canvas dimensions to match video
    captureCanvas.width = cameraVideo.videoWidth;
    captureCanvas.height = cameraVideo.videoHeight;
    
    // Draw video frame to canvas
    const context = captureCanvas.getContext('2d');
    context.drawImage(cameraVideo, 0, 0, captureCanvas.width, captureCanvas.height);
    
    // Convert canvas to image data
    const imageData = captureCanvas.toDataURL('image/jpeg');
    
    // Send to cropper
    previewImage.src = imageData;
    imagePreviewContainer.classList.remove('hidden');
    
    // Initialize cropper
    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(previewImage, {
        aspectRatio: NaN,
        viewMode: 1,
        dragMode: 'move',
        background: false,
        movable: true,
        rotatable: true,
        scalable: true,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
    });
    
    // Stop camera stream and reset UI
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    cameraContainer.classList.add('hidden');
    startCameraBtn.classList.remove('hidden');
    cameraVideo.srcObject = null;
});

// Handle crop button click
document.getElementById('cropBtn').addEventListener('click', () => {
    if (!cropper) return;
    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedImage = croppedCanvas.toDataURL('image/jpeg');
    croppedImages.push(croppedImage);
    
    // Add cropped image preview
    const imagePreview = document.createElement('div');
    imagePreview.className = 'relative';
    imagePreview.innerHTML = `
        <img src="${croppedImage}" class="w-full rounded w-full h-32 object-cover">
        <button class="absolute top-2 right-2 bg-red-700 text-white p-1 rounded delete-btn">
            <i data-feather="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    croppedImagesContainer.appendChild(imagePreview);
    feather.replace();
    
    // Destroy cropper and hide preview container
    cropper.destroy();
    cropper = null;
    imagePreviewContainer.classList.add('hidden');
    previewImage.src = '';
    
    updateAnalyzeButton();
});

// Helper function to convert base64 to blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Handle delete button clicks for cropped images
croppedImagesContainer.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
        const imagePreview = e.target.closest('.relative');
        const index = Array.from(croppedImagesContainer.children).indexOf(imagePreview);
        croppedImages.splice(index, 1);
        imagePreview.remove();
        updateAnalyzeButton();
    }
});

// Function to call /api/detect-text for a single image
async function detectText(imageBlob) {
    const formData = new FormData();
    formData.append('images', imageBlob);

    const response = await fetch('/api/detect-text', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) throw new Error('Failed to detect text');

    return response.json();
}

// Function to call /api/analyze-text for a single detected text
async function analyzeText(detectedText) {
    const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detectedText }),
    });

    if (!response.ok) throw new Error('Failed to analyze text');

    return response.json();
}

analyzeAllBtn.addEventListener('click', async () => {
    // Hide the main container and show only the processing container
    document.getElementById('mainContainer').classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    // Create a processing status element
    const processingStatus = document.createElement('div');
    processingStatus.className = 'flex flex-col items-center space-y-4 p-6 bg-white rounded';
    processingStatus.innerHTML = `
        <div class="animate-spin rounded-full h-10 w-10 border-2 border-green-100 border-b-green-700"></div>
        <div id="statusText" class="text-lg font-semibold text-zinc-700"></div>
    `;
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(processingStatus);

    const updateStatus = (message) => {
        document.getElementById('statusText').textContent = message;
    };

    try {
        updateStatus('Processing Images...');
        const imageBlobs = croppedImages.map(dataURLtoBlob);

        const formData = new FormData();
        imageBlobs.forEach((blob, index) => {
            formData.append(`images`, blob, `cropped_image_${index + 1}.jpeg`);
        });

        updateStatus('Detecting Text...');
        const detectResponse = await fetch('/api/detect-text', {
            method: 'POST',
            body: formData,
        });

        if (!detectResponse.ok) {
            throw new Error('Failed to detect text from images.');
        }

        updateStatus('Validating Ingredients...');
        const detectResult = await detectResponse.json();
        const detectedTexts = detectResult.responses.map((response) => response.text || '').join(' ');        
        
        updateStatus('Analyzing Ingredients...');
        const analyzeResponse = await fetch('/api/analyze-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ detectedText: detectedTexts }),
        });

        if (!analyzeResponse.ok) {
            throw new Error('Failed to analyze detected texts.');
        }

        const analyzeResult = await analyzeResponse.json();
        
        // Show final results
        resultsContainer.innerHTML = `
            <div class="bg-white">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-zinc-800">Analysis Results</h3>
                    <button id="backBtn" class="inline-flex gap-2 items-center text-green-700 hover:text-green-800">
                        <i data-feather="arrow-left"></i> Back
                    </button>
                </div>
                <div class="prose w-full">
                    ${analyzeResult.analysis}
                </div>
            </div>
        `;
        
        // Initialize the back button icon
        feather.replace();
        
        // Add back button functionality
        document.getElementById('backBtn').addEventListener('click', () => {
            document.getElementById('mainContainer').classList.remove('hidden');
            resultsContainer.classList.add('hidden');
        });

    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="bg-red-50 p-4">
                <div class="flex items-center space-x-3">
                    <i data-feather="alert-circle" class="text-red-500"></i>
                    <p class="text-red-700">Error: ${error.message}</p>
                </div>
                <button id="backBtn" class="mt-4 text-red-700 hover:text-red-800">
                    <i data-feather="arrow-left"></i> Try Again
                </button>
            </div>
        `;
        feather.replace();
        
        document.getElementById('backBtn').addEventListener('click', () => {
            document.getElementById('mainContainer').classList.remove('hidden');
            resultsContainer.classList.add('hidden');
        });
    }
});



// Toggle Functionality for Barcode and Images Sections
const barcodeBtn = document.getElementById('barcodeBtn');
const imagesBtn = document.getElementById('imagesBtn');
const barcodeSection = document.getElementById('barcodeSection');
const imagesSection = document.getElementById('imagesSection');

barcodeBtn.addEventListener('click', () => {
    barcodeBtn.classList.add('bg-green-700', 'text-white');
    barcodeBtn.classList.remove('text-zinc-600');
    imagesBtn.classList.remove('bg-green-700', 'text-white');
    imagesBtn.classList.add('text-zinc-600');
    barcodeSection.classList.remove('hidden');
    imagesSection.classList.add('hidden');
});

imagesBtn.addEventListener('click', () => {
    imagesBtn.classList.add('bg-green-700', 'text-white');
    imagesBtn.classList.remove('text-zinc-600');
    barcodeBtn.classList.remove('bg-green-700', 'text-white');
    barcodeBtn.classList.add('text-zinc-600');
    imagesSection.classList.remove('hidden');
    barcodeSection.classList.add('hidden');
});

// Start camera stream
