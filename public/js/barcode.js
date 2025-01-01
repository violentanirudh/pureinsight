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


// Select DOM elements
const barcodeInput = document.getElementById('barcode-result');
const searchBarcodeBtn = document.getElementById('searchBarcodeBtn');

// Event listener for "Search Product" button
searchBarcodeBtn.addEventListener('click', async () => {
  const ean = barcodeInput.value.trim();

  try {
    // Fetch analysis data from the API using EAN
    const response = await fetch(`/api/analysis/${ean}`);
    const data = await response.json();

    console.log(data)
    if (response.ok) {
      // Display analysis results in the results container
      resultsContainer.innerHTML = `
        <div class="bg-white">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-zinc-800">Analysis Results</h3>
            <button id="backBtn" class="inline-flex gap-2 items-center text-green-700 hover:text-green-800">
              <i data-feather="arrow-left" class="h-4 w-4"></i> Back
            </button>
          </div>
          <div class="prose w-full">
            ${data.analysis.analysis} <!-- Display analysis object -->
          </div>
        </div>
      `;

      feather.replace()

      // Show results container and hide main container
      document.getElementById('mainContainer').classList.add('hidden');
      resultsContainer.classList.remove('hidden');

      // Add back button functionality
      document.getElementById('backBtn').addEventListener('click', () => {
        resultsContainer.classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');
      });
    } else {
      alert(data.error || 'Failed to fetch analysis data.');
    }
  } catch (error) {
    console.error(error);
    alert('An error occurred while fetching analysis data.');
  }
});
