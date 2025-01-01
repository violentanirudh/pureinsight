// Function to initialize QuaggaJS
function startQuagga() {
    // Dynamically create #scanner-container
    const barcodeContainer = document.getElementById('barcodeContainer');
    let scannerContainer = document.getElementById('scanner-container');
    
    if (!scannerContainer) {
        scannerContainer = document.createElement('div');
        scannerContainer.id = 'scanner-container';
        scannerContainer.className = 'w-full h-48 bg-gray-200 flex items-center rounded overflow-hidden relative mb-4';
        barcodeContainer.prepend(scannerContainer); // Add it to the top of #barcodeContainer
    }

    // Configure QuaggaJS
    const quaggaConfig = {
        inputStream: {
            type: "LiveStream",
            target: scannerContainer, // Attach video stream here
            constraints: {
                facingMode: "environment" // Use rear camera
            }
        }
    };

    // Initialize Quagga
    Quagga.init(quaggaConfig, function (err) {
        if (err) {
            console.error("Quagga initialization failed:", err);
            return;
        }
        console.log("Quagga initialized successfully");
        Quagga.start(); // Start scanning
    });

    // Handle detected barcodes
    Quagga.onDetected(function (result) {
        const barcodeResult = document.getElementById('barcode-result');
        barcodeResult.value = result.codeResult.code; // Display detected barcode
        console.log("Barcode detected:", result.codeResult.code);
    });
}

// Function to stop QuaggaJS and remove #scanner-container
function stopQuagga() {
    Quagga.stop(); // Stop video stream

    // Remove #scanner-container from DOM
    const scannerContainer = document.getElementById('scanner-container');
    if (scannerContainer) {
        scannerContainer.parentNode.removeChild(scannerContainer);
    }
}

// Event listeners for toggling between Barcode and Images sections
document.getElementById('barcodeBtn').addEventListener('click', function () {
    stopQuagga(); // Ensure no duplicate instances
    startQuagga(); // Start scanning again
});

document.getElementById('imagesBtn').addEventListener('click', function () {
    stopQuagga(); // Stop scanning when switching to Images section
});

startQuagga(); // Start QuaggaJS by default