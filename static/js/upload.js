// static/js/upload.js

window.addEventListener('load', function () {
    const form = document.getElementById('uploadForm');
    const input = document.getElementById('imageInput');
    const uploadedImage = document.getElementById('uploadedImage');
    const canvas = document.getElementById('uploadCanvas');
    const facesGrid = document.getElementById('facesGrid');

    async function loadModels() {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/static/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/static/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/static/models');
        await faceapi.nets.ageGenderNet.loadFromUri('/static/models');
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const file = input.files[0];
        if (!file) return;

        const img = await faceapi.bufferToImage(file);
        uploadedImage.src = img.src;
        uploadedImage.style.display = 'block';

        uploadedImage.onload = async () => {
            canvas.width = uploadedImage.width;
            canvas.height = uploadedImage.height;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            const detections = await faceapi.detectAllFaces(uploadedImage)
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();

            const resized = faceapi.resizeResults(detections, {
                width: uploadedImage.width,
                height: uploadedImage.height
            });

            faceapi.draw.drawDetections(canvas, resized);
            faceapi.draw.drawFaceLandmarks(canvas, resized);
            faceapi.draw.drawFaceExpressions(canvas, resized);

            facesGrid.innerHTML = '';

            for (const detection of resized) {
                const box = detection.detection.box;
                const age = detection.age;
                const gender = detection.gender;
                const expressions = detection.expressions;

                // Convert bounding box to integers and align to natural image dimensions
                const scaleX = uploadedImage.naturalWidth / uploadedImage.width;
                const scaleY = uploadedImage.naturalHeight / uploadedImage.height;

                const x = Math.max(Math.floor(box.x * scaleX), 0);
                const y = Math.max(Math.floor(box.y * scaleY), 0);
                const width = Math.min(Math.floor(box.width * scaleX), uploadedImage.naturalWidth - x);
                const height = Math.min(Math.floor(box.height * scaleY), uploadedImage.naturalHeight - y);

                const faceCanvas = document.createElement('canvas');
                faceCanvas.width = width;
                faceCanvas.height = height;
                const ctx = faceCanvas.getContext('2d');
                ctx.drawImage(uploadedImage, x, y, width, height, 0, 0, width, height);

                const base64 = faceCanvas.toDataURL('image/jpeg');

                const payload = {
                    image: base64,
                    meta: { box: { x, y, width, height }, age, gender, expressions }
                };

                const response = await fetch('/save_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                console.log("Upload save result:", result);

                const thumb = document.createElement('img');
                thumb.src = base64;
                facesGrid.appendChild(thumb);
            }


        };
    });

    loadModels();
});
