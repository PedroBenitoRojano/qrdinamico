// State
let currentQrId = null;
let qrCodes = [];

// Elements
const qrGrid = document.getElementById('qrGrid');
const qrCount = document.getElementById('qrCount');
const emptyState = document.getElementById('emptyState');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');

// Stats elements
const totalQrs = document.getElementById('totalQrs');
const anonymousQrs = document.getElementById('anonymousQrs');
const usersQrs = document.getElementById('usersQrs');

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
    } catch (error) {
        console.error('Error loading user:', error);
        window.location.href = '/';
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch('/admin/stats');
        if (!response.ok) {
            throw new Error('Error loading stats');
        }

        const stats = await response.json();
        totalQrs.textContent = stats.total;
        anonymousQrs.textContent = stats.anonymous;
        usersQrs.textContent = stats.withUsers;

        // New stats
        if (stats.clicks) {
            document.getElementById('totalClicks').textContent = stats.clicks.total;
            document.getElementById('todayClicks').textContent = stats.clicks.today;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load QR codes
async function loadQrCodes() {
    try {
        const response = await fetch('/admin/qr');
        if (!response.ok) {
            throw new Error('Error loading QR codes');
        }

        qrCodes = await response.json();
        renderQrCodes();
        loadStats(); // Refresh stats
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
          ${qr.userEmail ? `<div style="margin-bottom: 4px; color: var(--primary-color);">👤 ${qr.userEmail}</div>` : '<strong style="color: var(--accent-color);">📝 Anónimo</strong><br>'}
          Creado: ${formatDate(qr.createdAt)}<br>
          ${qr.updatedAt !== qr.createdAt ? `Actualizado: ${formatDate(qr.updatedAt)}` : ''}
        </div>
      </div>
      
      <div class="qr-card-actions">
        <a href="/qr/${qr.shortId}/manage" class="btn btn-primary" target="_blank" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
          📊 Estadísticas
        </a>
        <button class="btn btn-secondary edit-btn" data-id="${qr.id}" data-url="${qr.url}" data-title="${qr.title || ''}" data-email="${qr.userEmail || ''}">
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
            openEditModal(dataset.id, dataset.url, dataset.title, dataset.email);
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

// Edit Modal
function openEditModal(id, url, title, email) {
    currentQrId = id;
    document.getElementById('editQrId').value = id;
    document.getElementById('editUrl').value = url;
    document.getElementById('editTitle').value = title;
    document.getElementById('editUserEmail').value = email;
    editModal.classList.add('show');
}

function closeEditModal() {
    editModal.classList.remove('show');
    currentQrId = null;
}

document.getElementById('closeModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

// Edit QR form
document.getElementById('editQrForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editQrId').value;
    const url = document.getElementById('editUrl').value;
    const title = document.getElementById('editTitle').value;
    const userEmail = document.getElementById('editUserEmail').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading"></div> <span>Guardando...</span>';

    try {
        const response = await fetch(`/admin/qr/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url,
                title,
                userEmail
            })
        });

        if (!response.ok) {
            throw new Error('Error updating QR code');
        }

        showAlert('✅ QR code actualizado exitosamente', 'success');
        closeEditModal();
        await loadQrCodes();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error al actualizar el QR code', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Delete Modal
function openDeleteModal(id) {
    currentQrId = id;
    deleteModal.classList.add('show');
}

function closeDeleteModal() {
    deleteModal.classList.remove('show');
    currentQrId = null;
}

document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Confirm delete
document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (!currentQrId) return;

    const btn = document.getElementById('confirmDelete');
    const originalBtnText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<div class="loading"></div> <span>Eliminando...</span>';

    try {
        const response = await fetch(`/admin/qr/${currentQrId}`, {
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
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
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

function downloadQrImage(shortId) {
    const link = document.createElement('a');
    link.href = `/api/qr/${shortId}/image`;
    link.download = `qr-${shortId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
loadUser();
loadQrCodes();
