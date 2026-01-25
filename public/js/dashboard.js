// State
let currentQrId = null;
let qrCodes = [];

// Elements
const createQrForm = document.getElementById('createQrForm');
const qrGrid = document.getElementById('qrGrid');
const qrCount = document.getElementById('qrCount');
const emptyState = document.getElementById('emptyState');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');

// Load user info
async function loadUser() {
    try {
        const response = await fetch('/auth/user');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }

        const user = await response.json();
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.picture || 'https://via.placeholder.com/40';

        // Show admin button if user is admin
        if (user.isAdmin) {
            const adminBtn = document.createElement('a');
            adminBtn.href = '/admin';
            adminBtn.className = 'btn btn-primary';
            adminBtn.textContent = '👑 Admin Panel';
            adminBtn.style.marginRight = '1rem';

            const userInfo = document.querySelector('.user-info');
            userInfo.insertBefore(adminBtn, userInfo.firstChild);
        }
    } catch (error) {
        console.error('Error loading user:', error);
        window.location.href = '/';
    }
}

// Load QR codes
async function loadQrCodes() {
    try {
        const response = await fetch('/api/qr');
        if (!response.ok) {
            throw new Error('Error loading QR codes');
        }

        qrCodes = await response.json();
        renderQrCodes();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar los QR codes', 'error');
    }
}

// Render QR codes
function renderQrCodes() {
    qrCount.textContent = `${qrCodes.length} QR code${qrCodes.length !== 1 ? 's' : ''}`;

    if (qrCodes.length === 0) {
        qrGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    qrGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    qrGrid.innerHTML = qrCodes.map(qr => `
    <div class="qr-card" data-id="${qr.id}">
      <div class="qr-card-image">
        <img src="/api/qr/${qr.shortId}/image" alt="QR Code" loading="lazy">
      </div>
      
      <div class="qr-card-info">
        ${qr.title ? `<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--text-primary);">${qr.title}</div>` : '<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--text-muted); font-style: italic;">Sin título</div>'}
        
        <div class="qr-card-url">
          <strong>🔗 URL corta:</strong><br>
          <a href="${qr.shortUrl}" target="_blank" style="color: var(--accent-color); text-decoration: none;">${qr.shortUrl}</a>
        </div>
        
        <div class="qr-card-destination">
          <strong>🎯 Destino:</strong><br>
          <span style="word-break: break-all;">${qr.url}</span>
        </div>
        
        <div class="qr-card-meta">
          <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); flex-wrap: wrap;">
            <span title="Total de visitas">👁️ ${qr.visitsCount || 0}</span>
            <span title="Fecha de creación">📅 ${formatDate(qr.createdAt)}</span>
            ${qr.lastAccessAt ? `<span title="Último acceso" style="color: var(--accent-color);">🕑 ${formatDate(qr.lastAccessAt)}</span>` : ''}
          </div>
        </div>
      </div>
      
      <div class="qr-card-actions">
        <a href="/qr/${qr.shortId}/manage" class="btn btn-primary" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
          📊 Estadísticas
        </a>
        <button class="btn btn-secondary edit-btn" data-shortid="${qr.shortId}" data-url="${qr.url}" data-title="${qr.title || ''}">
            ✏️ Editar
        </button>
        <a href="${qr.url}" target="_blank" rel="noopener" class="btn btn-secondary" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
            🔗 Abrir
        </a>
        <button class="btn btn-secondary copy-btn" data-url="${qr.shortUrl}">
          📋 Copiar
        </button>
        <button class="btn btn-secondary download-btn" data-shortid="${qr.shortId}">
          💾 Descargar
        </button>
        <button class="btn btn-danger delete-btn" data-id="${qr.id}" style="display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 5px;">
           <span style="margin-right: 5px;">🗑️</span> Eliminar
        </button>
      </div>
    </div>
  `).join('');

    // Add event listeners
    attachEventListeners();
}

// Attach event listeners to buttons
function attachEventListeners() {
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const url = e.currentTarget.dataset.url;
            await copyToClipboard(url, e.currentTarget);
        });
    });

    // Download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const shortId = e.currentTarget.dataset.shortid;
            downloadQrImage(shortId);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dataset = e.currentTarget.dataset;
            openEditModal(dataset.shortid, dataset.url, dataset.title);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            openDeleteModal(id);
        });
    });
}

// Edit Modal Logic
let currentShortId = null;
const editForm = document.getElementById('editQrForm'); // Assuming ID in html is editQrForm

function openEditModal(shortId, url, title) {
    currentShortId = shortId;
    document.getElementById('editQrId').value = shortId; // Use shortId for identifier
    document.getElementById('editUrl').value = url;
    const titleInput = document.getElementById('editTitle');
    if (titleInput) {
        titleInput.value = title;
    }
    const aliasInput = document.getElementById('editAlias');
    if (aliasInput) {
        aliasInput.value = shortId;
    }

    editModal.classList.add('show');
}

function closeEditModal() {
    editModal.classList.remove('show');
    currentShortId = null;
}

document.getElementById('closeModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

// Edit Submit
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = document.getElementById('editUrl').value;
        const titleInput = document.getElementById('editTitle');
        const title = titleInput ? titleInput.value : null;

        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> <span>Guardando...</span>';

        try {
            const aliasInput = document.getElementById('editAlias');
            const alias = aliasInput ? aliasInput.value : null;

            const response = await fetch(`/api/qr/manage/${currentShortId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, title, alias })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al actualizar');
            }

            showAlert('✅ QR actualizado correctamente');
            closeEditModal();
            loadQrCodes();
        } catch (error) {
            console.error(error);
            showAlert('❌ ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// Delete Modal Logic
function openDeleteModal(id) {
    currentQrId = id;
    deleteModal.classList.add('show');
}

function closeDeleteModal() {
    deleteModal.classList.remove('show');
    currentQrId = null;
}

const closeDeleteBtn = document.getElementById('closeDeleteModal');
if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);

const cancelDeleteBtn = document.getElementById('cancelDelete');
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Confirm Delete
const confirmDeleteBtn = document.getElementById('confirmDelete');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!currentQrId) return;

        const originalBtnText = confirmDeleteBtn.innerHTML;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<div class="loading"></div> <span>Eliminando...</span>';

        try {
            const response = await fetch(`/api/qr/${currentQrId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error deleting QR code');
            }

            showAlert('✅ QR code eliminado exitosamente', 'success');
            closeDeleteModal();
            await loadQrCodes();

        } catch (error) {
            console.error('Error:', error);
            showAlert('❌ Error al eliminar el QR code', 'error');
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = originalBtnText;
        }
    });
}

// Create QR code
createQrForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = document.getElementById('newUrl').value;
    const title = document.getElementById('newTitle').value;
    const submitBtn = createQrForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const aliasInput = document.getElementById('newAlias');
    const alias = aliasInput ? aliasInput.value : null;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading"></div> <span>Creando...</span>';

    try {
        const response = await fetch('/api/qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, title, alias })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error creating QR code');
        }

        showAlert('✅ QR code creado exitosamente', 'success');
        createQrForm.reset();
        await loadQrCodes();

        // Scroll to grid
        qrGrid.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error al crear el QR code: ' + error.message, 'error', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Utility functions
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copiado';

        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    } catch (error) {
        console.error('Error copying:', error);
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    // Convert SQLite UTC format to ISO format
    const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAlert(message, type = 'success', errorDetails = null) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    alert.appendChild(messageSpan);

    // Add error details button if there are details
    if (errorDetails && type === 'error') {
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn btn-secondary';
        detailsBtn.style.cssText = 'margin-left: 1rem; padding: 0.25rem 0.75rem; font-size: 0.875rem;';
        detailsBtn.textContent = '🔍 Más información';
        detailsBtn.onclick = () => {
            alert(`Error completo:\n\n${errorDetails.message || errorDetails}\n\nStack:\n${errorDetails.stack || 'No disponible'}`);
        };
        alert.appendChild(detailsBtn);
    }

    const main = document.querySelector('main');
    main.insertBefore(alert, main.firstChild);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Download QR image
function downloadQrImage(shortId) {
    const link = document.createElement('a');
    link.href = `/api/qr/${shortId}/image`;
    link.download = `qr-${shortId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
loadUser();
loadQrCodes();
