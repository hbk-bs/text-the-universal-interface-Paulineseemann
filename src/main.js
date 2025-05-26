const uploadInput = document.getElementById("imageInput");
const interpretBtn = document.getElementById("analyzeBtn");
const output = document.getElementById("output");

let base64Image = null;

// Bild verkleinern (max 800x800)
function resizeImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Ausgabe als JPEG Base64, Qualität 0.8
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };

    reader.readAsDataURL(file);
  });
}

uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  output.textContent = "Bild wird verkleinert…";

  try {
    const resizedDataUrl = await resizeImage(file);
    base64Image = resizedDataUrl.split(",")[1]; // Base64 ohne data:image/...
    output.textContent = "Bild geladen (verkleinert). Bereit zur Interpretation.";
  } catch {
    output.textContent = "Fehler beim Verkleinern des Bildes.";
  }
});

interpretBtn.addEventListener("click", async () => {
  if (!base64Image) {
    output.textContent = "Bitte zuerst ein Bild hochladen.";
    return;
  }

  output.textContent = "Wird interpretiert… bitte einen Moment.";

  try {
    const response = await fetch("https://api.val.town/v1/run/Paulineseemann.describeImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image })
    });

    const data = await response.json();

    if (data.error) {
      output.textContent = `Fehler: ${data.error}\n\nRohantwort:\n${data.original_response}`;
      return;
    }

    output.innerHTML = `
      <h2>${data.titel}</h2>
      <p><em>${data.einleitung}</em></p>
      <p>${data.text}</p>
    `;
  } catch (err) {
    output.textContent = `Fehler beim Interpretieren: ${err}`;
  }
});
