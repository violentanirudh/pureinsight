function startQuagga() {
  // Dynamically create #scanner-container
  const barcodeContainer = document.getElementById('barcodeContainer');
  let scannerContainer = document.getElementById('scanner-container');

  if (!scannerContainer) {
      scannerContainer = document.createElement('div');
      scannerContainer.id = 'scanner-container';
      scannerContainer.className = 'flex items-center rounded overflow-hidden relative mb-4';
      barcodeContainer.prepend(scannerContainer); // Add it to the top of #barcodeContainer
  }

  // Initialize Quagga 2
  Quagga.init({
    inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#scanner-container"), // Target element for the camera feed
        constraints: {
            width: 640,
            height: 480,
            facingMode: "environment", // Use rear camera
        }
    },
    decoder: {
        readers: [
            "ean_reader",       // EAN-13
            "ean_8_reader",     // EAN-8
            "upc_reader",       // UPC-A
            "upc_e_reader"      // UPC-E
        ]
    },
    locate: true,
}, function(err) {
    if (err) {
        displayError("Failed to initialize scanner.");
        return;
    }
    Quagga.start();
});

  // Handle final detected barcodes
  Quagga.onDetected(async function (result) {
      const code = result.codeResult.code;
      console.log("Final detected barcode:", code);

      // Update the input field with the detected barcode
      const barcodeResult = document.getElementById('barcode-result');
      if (barcodeResult && isValidEAN(code)) {
          barcodeResult.value = code;
      }
  });
}

function stopQuagga() {
  Quagga.stop(); // Stop video stream and scanning process

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

// Function to toggle button state based on EAN validity
function toggleBarcodeBtn() {
  const ean = barcodeInput.value.trim();
  if (isValidEAN(ean)) {
    searchBarcodeBtn.disabled = false; // Enable button if valid
    searchBarcodeBtn.classList.remove('opacity-50', 'cursor-not-allowed'); // Optional styling
  } else {
    searchBarcodeBtn.disabled = true; // Disable button if invalid
    searchBarcodeBtn.classList.add('opacity-50', 'cursor-not-allowed'); // Optional styling
  }
}

// Add event listener to monitor input changes
barcodeInput.addEventListener('input', toggleBarcodeBtn);

// Initialize button state on page load
toggleBarcodeBtn();

// Event listener for "Search Product" button
searchBarcodeBtn.addEventListener('click', async () => {
  const ean = barcodeInput.value.trim();

  try {
    // Fetch analysis data from the API using EAN
    const response = await fetch(`/api/analysis/${ean}`);
    const data = await response.json();

    // Check if response is not OK (e.g., status code 400 or 500)
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch analysis data.');
    }

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

    feather.replace();

    // Show results container and hide main container
    document.getElementById('mainContainer').classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    // Add back button functionality
    document.getElementById('backBtn').addEventListener('click', () => {
      resultsContainer.classList.add('hidden');
      document.getElementById('mainContainer').classList.remove('hidden');
    });
  } catch (error) {
    console.error(error);

    document.getElementById('mainContainer').classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    // Render error message in the results container
    resultsContainer.innerHTML = `
      <div class="bg-red-50 p-4">
        <div class="flex items-center justify-between space-x-2">
          <div class="flex items-center text-red-700">
            <i data-feather="alert-circle" class="mr-2"></i> Invalid
          </div>
          <button id="backBtn" class="inline-flex justify-center items-center text-red-700 hover:text-red-800">
            <i data-feather="arrow-left" class="h-4 w-4"></i> Try Again
          </button>
        </div>
        <p class="text-red-700">${error.message}</p>
      </div>
    `;

    feather.replace();

    // Add back button functionality for error view
    document.getElementById('backBtn').addEventListener('click', () => {
      document.getElementById('mainContainer').classList.remove('hidden');
      resultsContainer.classList.add('hidden');
    });
  }
});
