
let video;
let canvas;
let context;
let displaySize;

async function startLiveVideo() {
    video = document.getElementById('videoInput');
    canvas = document.getElementById('overlay');
    context = canvas.getContext('2d');

    await faceapi.nets.tinyFaceDetector.loadFromUri('/static/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/static/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/static/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/static/models');

    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    video.addEventListener('play', () => {
        displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();

            context.clearRect(0, 0, canvas.width, canvas.height);
            const resized = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resized);
            faceapi.draw.drawFaceLandmarks(canvas, resized);
            faceapi.draw.drawFaceExpressions(canvas, resized);

            for (let i = 0; i < resized.length; i++) {
                const box = resized[i].detection.box;
                const age = resized[i].age;
                const gender = resized[i].gender;
                const expressions = resized[i].expressions;

                const faceCanvas = document.createElement('canvas');
                faceCanvas.width = box.width;
                faceCanvas.height = box.height;
                faceCanvas.getContext('2d').drawImage(
                    video,
                    Math.round(box.x), Math.round(box.y),
                    Math.round(box.width), Math.round(box.height),
                    0, 0,
                    Math.round(box.width), Math.round(box.height)
                );

                const base64 = faceCanvas.toDataURL('image/jpeg');
                const payload = {
                    image: base64,
                    meta: { box, age, gender, expressions }
                };

                const response = await fetch("/save_image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                console.log("Live save to CSV:", result);
                alert("Live face saved at: " + result.logged_at);
            }
        }, 8000);
    });
}

window.addEventListener('load', startLiveVideo);
