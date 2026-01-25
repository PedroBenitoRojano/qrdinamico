// Quick create form handler
const quickCreateForm = document.getElementById('quickCreateForm');
const qrResult = document.getElementById('qrResult');
const qrImage = document.getElementById('qrImage');
const shortUrlInput = document.getElementById('shortUrlInput');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const editLink = document.getElementById('editLink');

let currentShortId = null;

if (quickCreateForm) {
    quickCreateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = document.getElementById('url').value;
        const title = document.getElementById('title').value;
        const submitBtn = quickCreateForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        const alias = document.getElementById('alias') ? document.getElementById('alias').value : null;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> <span>Generando...</span>';

        try {
            // Create QR code
            const response = await fetch('/api/qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, title: title || null, alias: alias || null })
            });

            if (!response.ok) {
                throw new Error('Error al crear el QR code');
            }

            const data = await response.json();
            currentShortId = data.shortId;

            // Display QR code
            qrImage.src = `/api/qr/${data.shortId}/image`;

            const shortUrlInput = document.getElementById('shortUrlInput');
            const shortUrlDisplay = document.getElementById('shortUrlDisplay');

            if (shortUrlInput) shortUrlInput.value = data.shortUrl;
            if (shortUrlDisplay) shortUrlDisplay.textContent = data.shortUrl;

            const openUrlBtn = document.getElementById('openUrlBtn');
            if (openUrlBtn) openUrlBtn.href = data.shortUrl;

            editLink.href = `/qr/${data.shortId}/manage`;
            editLink.innerHTML = '⚙️ Gestionar este QR (Estadísticas y Edición)';

            qrResult.style.display = 'block';
            setTimeout(() => qrResult.classList.add('show'), 10);

            // Scroll to result
            qrResult.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Show success alert
            showAlert('✅ ¡QR code creado exitosamente!', 'success');

            // Reset form
            quickCreateForm.reset();

        } catch (error) {
            console.error('Error:', error);
            showAlert('❌ Error al crear el QR code. Intenta de nuevo.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// Manage QR Input handler
const manageInput = document.getElementById('manageInput');
const goToManageBtn = document.getElementById('goToManageBtn');

if (goToManageBtn && manageInput) {
    goToManageBtn.addEventListener('click', () => {
        handleGoToManage();
    });

    manageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGoToManage();
        }
    });

    function handleGoToManage() {
        const input = manageInput.value.trim();
        if (!input) return;

        // Extract shortId if full URL is pasted
        let shortId = input;
        try {
            if (input.includes('/qr/')) {
                shortId = input.split('/qr/')[1];
            } else if (input.includes('/r/')) {
                // Support legacy
                shortId = input.split('/r/')[1];
            } else if (input.includes('http')) {
                const url = new URL(input);
                const parts = url.pathname.split('/');
                shortId = parts[parts.length - 1];
            }
        } catch (e) {
            // keep original input if parsing fails
        }

        // Clean up any trailing slashes or query params
        shortId = shortId.split('?')[0].split('/')[0];

        window.location.href = `/qr/${shortId}/manage`;
    }
}

// Copy to clipboard
if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);

            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Copiado';

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error copying:', error);
            // Fallback: select the text
            shortUrlInput.select();
            document.execCommand('copy');
        }
    });
}

// Download QR code
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (currentShortId) {
            const link = document.createElement('a');
            link.href = `/api/qr/${currentShortId}/image`;
            link.download = `qr-${currentShortId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Alert helper
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Insert at the top of the main container
    const main = document.querySelector('main');
    main.insertBefore(alert, main.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);

// Check login status for header
async function checkLoginStatus() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;

    try {
        const response = await fetch('/auth/user');
        if (response.ok) {
            const user = await response.json();
            authContainer.innerHTML = `
                <div class="user-info" style="display:flex; align-items:center; gap:10px;">
                    <img src="${user.picture || 'https://via.placeholder.com/32'}" alt="${user.name}" style="width:32px; height:32px; border-radius:50%; object-fit: cover;">
                    <span style="font-weight:600; font-size: 0.9rem; color: var(--text-primary);">${user.name}</span>
                    <a href="/dashboard" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; text-decoration: none;">
                        Dashboard ➜
                    </a>
                </div>
            `;
        }
    } catch (e) {
        // Not logged in, ignore
        console.log('User not logged in');
    }
}

// Initialize
checkLoginStatus();
