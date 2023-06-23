// Load the face-api.js library
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('models/'),
  faceapi.nets.faceLandmark68Net.loadFromUri('models/'),
  faceapi.nets.faceRecognitionNet.loadFromUri('models/'),
  faceapi.nets.faceExpressionNet.loadFromUri('models/'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('models/') // Load the SsdMobilenetv1 model
]).then(start);

// Handle form submission
document.getElementById('uploadForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form submission
  const imageInput = document.getElementById('imageInput');
  const imageFile = imageInput.files[0];

  if (imageFile) {
    const reader = new FileReader();

    reader.onload = function() {
      const img = new Image();
      img.src = reader.result;

      img.onload = function() {
        // Remove the previously displayed image if exists
        const prevImage = document.getElementById('uploadedImage');
        if (prevImage) {
          prevImage.remove();
        }

        // Create a new canvas element for displaying the image
        const displayCanvas = document.createElement('canvas');
        displayCanvas.id = 'uploadedImage';
        const displayContext = displayCanvas.getContext('2d');
        document.getElementById('imageContainer').appendChild(displayCanvas);

        // Resize the display canvas to match the image dimensions
        displayCanvas.width = img.width;
        displayCanvas.height = img.height;

        // Draw the image on the display canvas
        displayContext.drawImage(img, 0, 0);

        // Detect faces in the uploaded image
        faceapi.detectAllFaces(displayCanvas).then(function(result) {
          if (result.length > 0) {
            // Display success message if faces are detected
            displaySuccessMessage();
          } else {
            // Display error message if no faces are detected
            displayErrorMessage();
          }
        });
      };
    };

    reader.readAsDataURL(imageFile);
  }
});

function start() {
  // This function can be empty or can contain any code you need to run after the models are loaded
  console.log('Models loaded. Ready to start.');
}

function displaySuccessMessage() {
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function displayErrorMessage() {
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  
  successMessage.style.display = 'none';
  errorMessage.style.display = 'block';
}
