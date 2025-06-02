// @ts-check
const apiEndpoint = 'https://Paulineseemann--069a909b00764baeace2c6dc0cba0b42.web.val.run';

document.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelector('form');
	if (!form) return;

	/**
	 * On submit of the form
	 * we do:
	 * - show loading dots
	 * - convert the file to a data URL
	 * - send the data URL to the API
	 * - parse the response
	 * - show the result
	 */
	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		// loading indicator so the user knows something is happening
		const dots = ['', '.', '..', '...'];
		let index = 0;
		const interval = setInterval(() => {
			const resultContainer = document.getElementById('result');
			if (!resultContainer) return;
			resultContainer.innerHTML = `<p>Loading${dots[index]}</p>`;
			index++;
			if (index === dots.length) index = 0;
		}, 100);

		// get the file from the form
		const formData = new FormData(form);
		const file = formData.get('image');

		// if the file is not a File object, show an error
		if (!(file instanceof File)) {
			clearInterval(interval);
			const resultContainer = document.getElementById('result');
			if (resultContainer)
				resultContainer.innerHTML = '<p>Fehler: Keine Datei ausgewählt.</p>';
			return;
		}

		// if the file is not an image, show an error
		if (!file.type.startsWith('image/')) {
			clearInterval(interval);
			const resultContainer = document.getElementById('result');
			if (resultContainer)
				resultContainer.innerHTML =
					'<p>Fehler: Nur Bilddateien sind erlaubt.</p>';
			return;
		}

		// exclude SVG images
		if (file.type === 'image/svg+xml') {
			clearInterval(interval);
			const resultContainer = document.getElementById('result');
			if (resultContainer)
				resultContainer.innerHTML = '<p>Fehler: SVG-Bilder sind nicht erlaubt.</p>';
			return;
		}

		// convert the file to a data URL
		/**
		 * A data URL is a type of Uniform Resource Identifier (URI) that allows small files to be embedded directly within HTML, CSS, or JavaScript code as a string of text. This scheme enables the inclusion of data in-line in web pages, as if they were external resources. Data URLs are commonly used to embed images, CSS, and even JavaScript code within a document. They are particularly useful for small files, as they can reduce the number of HTTP requests needed to load a web page. However, it is important to minimize the number of data URLs used on a page and ensure proper MIME type declaration. Additionally, testing across different browsers and avoiding the embedding of sensitive data are recommended practices.
		 * - https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data
		 * -https://flaviocopes.com/data-urls/
		 */
		const dataURL = await fileToDataURL(file);

		// check image dimensions
		await checkImageSize(dataURL, interval);

		// show the image
		const imageContainer = document.getElementById('image-container');
		if (!imageContainer) return;
		imageContainer.innerHTML = `<img src="${dataURL}" alt="hochgeladenes Bild" />`;

		// Nur poetische Zeile anfordern
		const data = {
			response_format: { type: 'text' },
			messages: [
				{
					role: 'system',
					content: `Du bist ein poetischer und kitschiger Kommentator. Zu jedem Bild schreibst du eine einzige, kurze, poetische und kitschige Zeile, inspiriert von dem, was du siehst. Antworte NUR mit der poetischen Zeile, ohne Erklärungen, ohne JSON, ohne Bewertung.`,
				},
				{
					role: 'user',
					content: [
						{
							type: 'image_url',
							image_url: {
								url: dataURL,
							},
						},
					],
				},
			],
			max_tokens: 60,
		};

		// send the data to the API
		const response = await fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			// if the response is not ok, show an error
			const resultContainer = document.getElementById('result');
			if (!resultContainer) return;
			resultContainer.innerHTML = `<p>Fehler: ${response.statusText}</p>`;
			clearInterval(interval);
			return;
		}

		// parse the response
		const result = await response.json();

		// clear the loading indicator
		clearInterval(interval);

		// show the result
		const resultContainer = document.getElementById('result');
		if (!resultContainer) return;
		const poeticLine = result.completion.choices[0].message.content;
		resultContainer.innerHTML = `<p style="font-style:italic;color:#ffb347;">${poeticLine}</p>`;
	});
});

/**
 * Checks the size of an image.
 * @param {string} dataURL - The data URL of the image.
 * @param {number} interval - The interval to clear.
 * @returns {Promise<void>}
 */
async function checkImageSize(dataURL, interval) {
	const img = new Image();
	img.src = dataURL;
	await new Promise((resolve, reject) => {
		img.onload = () => {
			if (img.width > 500 || img.height > 500) {
				clearInterval(interval);
				const resultContainer = document.getElementById('result');
				if (resultContainer)
					resultContainer.innerHTML =
						'<p>Error: Image must be 500x500px or smaller.</p>';
				return reject(new Error('Image too large'));
			}
			resolve(true);
		};
		img.onerror = () => reject(new Error('Image failed to load'));
	});
}

/**
 * Converts a File object to a base64-encoded Data URL string.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} A promise that resolves to a Data URL (e.g., "data:image/png;base64,...").
 */
async function fileToDataURL(file) {
	const base64String = await fileToBase64(file);

	// Determine the MIME type
	const mimeType = file.type || 'application/octet-stream';

	// Create the Base64 encoded Data URL
	return `data:${mimeType};base64,${base64String}`;
}

/**
 * Converts a File object to a base64-encoded string.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} A promise that resolves to a base64-encoded string.
 */
async function fileToBase64(file) {
	// Read the file as an ArrayBuffer
	const arrayBuffer = await file.arrayBuffer();

	// Convert ArrayBuffer to a typed array (Uint8Array)
	const uintArray = new Uint8Array(arrayBuffer);

	// Convert typed array to binary string
	const binaryString = uintArray.reduce(
		(acc, byte) => acc + String.fromCharCode(byte),
		'',
	);

	// Encode binary string to base64
	return btoa(binaryString);
}