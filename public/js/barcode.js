const showToast = (message, isError = false) => {
  Toastify({
      text: message,
      duration: 3000,
      gravity: "bottom",
      position: "right",
      stopOnFocus: true,
      style: {
          background: isError ? "#b91c1c" : "#15803d",
          borderRadius: "2px",
          padding: "12px 24px",
      }
  }).showToast();
};


function isValidEAN(ean) {
  if (!/^\d{13}$/.test(ean)) return false; // Ensure 13 numeric digits

  const digits = ean.split('').map(Number);
  const checkDigit = digits.pop(); // Extract last digit (checksum)

  const sum = digits.reduce((acc, digit, i) => acc + digit * (i % 2 === 0 ? 1 : 3), 0);
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;

  return calculatedCheckDigit === checkDigit;
}

const fetchAnalysisData = async (ean) => {
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

    // Show toast notification for errors
    showToast(error.message, true);

    // Optionally, reset UI state if needed
    document.getElementById('mainContainer').classList.remove('hidden');
    resultsContainer.classList.add('hidden');
  }
};

function startQuagga() {
  // Dynamically create #scanner-container
  const barcodeContainer = document.getElementById('barcodeContainer');
  let scannerContainer = document.getElementById('scanner-container');

  if (!scannerContainer) {
      scannerContainer = document.createElement('div');
      scannerContainer.id = 'scanner-container';
      scannerContainer.className = 'flex items-center rounded overflow-hidden relative ';
      barcodeContainer.prepend(scannerContainer); // Add it to the top of #barcodeContainer
  }

  // Initialize Quagga 2
  Quagga.init({
    inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#scanner-container"), // Target element for the camera feed
        constraints: {
            facingMode: "environment", // Use rear camera
        }
    },
    debug: {
      drawBoundingBox: true,
      showFrequency: false,
      drawScanline: false,
      showPattern: false
  },
    decoder: {
        readers: [
            "ean_reader",       // EAN-13
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
          // fetchAnalysisData(code)
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
  if (isValidEAN(ean)) {
    fetchAnalysisData(ean)
  }
});

