// Get shortId from URL
const pathParts = window.location.pathname.split('/');
const shortId = pathParts[2]; // /qr/{shortId}/edit

const loadingState = document.getElementById('loadingState');
const editContent = document.getElementById('editContent');
const errorState = document.getElementById('errorState');
const editQrForm = document.getElementById('editQrForm');
const qrImage = document.getElementById('qrImage');
const shortUrlEl = document.getElementById('shortUrl');
const newUrlInput = document.getElementById('newUrl');

let qrData = null;

// Load QR data
async function loadQrData() {
    try {
        // Try to get QR data by making a request to get the image first
        // This will verify the QR exists
        const imageResponse = await fetch(`/api/qr/${shortId}/image`);

        if (!imageResponse.ok) {
            throw new Error('QR not found');
        }

        // Set the QR image
        qrImage.src = `/api/qr/${shortId}/image`;

        // We need to get the current URL
        // Make a request to the redirect endpoint to get the current destination
        const redirectResponse = await fetch(`/api/qr/${shortId}/data`);

        if (redirectResponse.ok) {
            qrData = await redirectResponse.json();
            newUrlInput.value = qrData.url;
        }

        // Set short URL
        shortUrlEl.textContent = `${window.location.origin}/qr/${shortId}`;

        // Show edit content
        loadingState.classList.add('hidden');
        editContent.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading QR:', error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

// Handle form submission
editQrForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newUrl = newUrlInput.value;
    const submitBtn = editQrForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading"></div> <span>Guardando...</span>';

    try {
        const response = await fetch(`/api/qr/anonymous/${shortId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: newUrl })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al actualizar el QR code');
        }

        showAlert('✅ QR code actualizado exitosamente', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Alert helper
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const main = document.querySelector('main');
    main.insertBefore(alert, main.firstChild);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Initialize
loadQrData();
