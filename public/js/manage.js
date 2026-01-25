// Get short ID from URL
const pathParts = window.location.pathname.split('/');
// URL expected: /qr/:shortId/manage -> ["", "qr", "shortId", "manage"]
// Get the segment before 'manage'
const shortId = pathParts[pathParts.length - 2];
console.log('Managing QR:', shortId);

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const mainContent = document.getElementById('mainContent');
const qrImage = document.getElementById('qrImage');
const qrTitle = document.getElementById('qrTitle');
const shortUrlInput = document.getElementById('shortUrlInput');
const destinationUrl = document.getElementById('destinationUrl');
const openDestination = document.getElementById('openDestination');
const totalVisits = document.getElementById('totalVisits');
const todayVisits = document.getElementById('todayVisits');
const weekVisits = document.getElementById('weekVisits');
const createdAt = document.getElementById('createdAt');
const lastAccess = document.getElementById('lastAccess');
const chartContainer = document.getElementById('chartContainer');
const recentVisits = document.getElementById('recentVisits');
const noVisitsMessage = document.getElementById('noVisitsMessage');

// Modal elements
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const editForm = document.getElementById('editForm');
const newUrlInput = document.getElementById('newUrl');
const newTitleInput = document.getElementById('newTitle');
const newAliasInput = document.getElementById('newAlias');

let qrData = null;

// Initialize
async function init() {
    try {
        // Fetch QR data
        const response = await fetch(`/api/qr/${shortId}/full`);
        if (!response.ok) {
            throw new Error('QR not found');
        }

        qrData = await response.json();
        displayQrData();
        await loadAnalytics();

        loadingState.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

// Modificar displayQrData para formato 2 líneas
function displayQrData() {
    qrImage.src = `/api/qr/${shortId}/image`;
    qrTitle.textContent = qrData.title || `QR ${shortId}`;
    shortUrlInput.value = qrData.shortUrl;
    destinationUrl.textContent = qrData.url;
    // Usar shortUrl para probar la redirección y registrar analytics
    openDestination.href = qrData.shortUrl;
    totalVisits.textContent = qrData.visitsCount || 0;
    createdAt.innerHTML = formatDate(qrData.createdAt).replace(', ', '<br>');
}

async function loadAnalytics() {
    try {
        const response = await fetch(`/api/qr/${shortId}/analytics`);
        if (!response.ok) return;

        const analytics = await response.json();

        // Update stats
        todayVisits.textContent = analytics.today || 0;
        weekVisits.textContent = analytics.week || 0;

        // Update Last Access
        if (analytics.recentVisits && analytics.recentVisits.length > 0) {
            lastAccess.innerHTML = formatDate(analytics.recentVisits[0].visited_at).replace(', ', '<br>');
        } else {
            lastAccess.textContent = '-';
        }

        // Render chart
        const chartData = fillMissingDates(analytics.byDate || []);
        renderChart(chartData);

        // Render recent visits
        renderRecentVisits(analytics.recentVisits || []);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function renderChart(data) {
    if (data.length === 0) {
        chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); width: 100%; padding: var(--spacing-lg);">No hay datos de visitas aún</div>';
        return;
    }

    const maxVisits = Math.max(...data.map(d => d.visits), 1);

    chartContainer.innerHTML = data.map(d => {
        // Calculate height percentage relative to max, max height 150px
        const percentage = (d.visits / maxVisits) * 100;
        const height = Math.max((d.visits / maxVisits) * 150, 4); // Min visual height

        const date = new Date(d.date);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const dayNum = date.getDate();

        // Bar style
        const barBackground = d.visits > 0
            ? 'var(--primary-gradient)'
            : 'rgba(255, 255, 255, 0.05)';

        const barHeight = d.visits > 0 ? `${height}px` : '4px';

        return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0;">
                <div style="text-align: center; width: 100%;">
                    <div style="color: var(--accent-color); font-weight: 700; font-size: 0.9rem; margin-bottom: 2px; height: 20px; opacity: ${d.visits > 0 ? 1 : 0}; transition: opacity 0.3s;">
                        ${d.visits}
                    </div>
                    <div style="width: 100%; max-width: 40px; height: ${barHeight}; background: ${barBackground}; border-radius: 4px 4px 0 0; margin: 0 auto; transition: height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.7rem; text-align: center; text-transform: uppercase; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
                    ${dayName}<br><span style="font-weight: 400; opacity: 0.7;">${dayNum}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecentVisits(visits) {
    if (visits.length === 0) {
        recentVisits.classList.add('hidden');
        noVisitsMessage.classList.remove('hidden');
        return;
    }

    recentVisits.classList.remove('hidden');
    noVisitsMessage.classList.add('hidden');

    recentVisits.innerHTML = visits.map(visit => {
        const browserInfo = parseBrowser(visit.user_agent || '');
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 500;">${browserInfo}</div>
                    <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-color); margin: 2px 0;">
                        IP: ${visit.ip_address || 'Desconocida'}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">
                        ${visit.referer && visit.referer !== 'direct' ? `Desde: ${visit.referer}` : 'Acceso directo'}
                    </div>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.875rem; text-align: right;">
                    ${formatDate(visit.visited_at).replace(', ', '<br>')}
                </div>
            </div>
        `;
    }).join('');
}

function parseBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return '🌐 Chrome';
    if (userAgent.includes('Firefox')) return '🦊 Firefox';
    if (userAgent.includes('Safari')) return '🧭 Safari';
    if (userAgent.includes('Edge')) return '🌊 Edge';
    if (userAgent.includes('Opera')) return '🔴 Opera';
    return '📱 Navegador';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Copy short URL
document.getElementById('copyShortUrl').addEventListener('click', async () => {
    const btn = document.getElementById('copyShortUrl');
    try {
        await navigator.clipboard.writeText(shortUrlInput.value);
        const original = btn.innerHTML;
        btn.innerHTML = '✅ Copiado';
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    } catch (error) {
        shortUrlInput.select();
        document.execCommand('copy');
    }
});

// Download QR
document.getElementById('downloadQr').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = `/api/qr/${shortId}/image`;
    link.download = `qr-${shortId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Edit Modal
document.getElementById('editQrBtn').addEventListener('click', () => {
    newUrlInput.value = qrData.url;
    newTitleInput.value = qrData.title || '';
    newAliasInput.value = qrData.shortId;
    editModal.classList.add('show');
});

document.getElementById('closeEditModal').addEventListener('click', () => {
    editModal.classList.remove('show');
});

document.getElementById('cancelEdit').addEventListener('click', () => {
    editModal.classList.remove('show');
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = editForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> Guardando...';

        const response = await fetch(`/api/qr/manage/${shortId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: newUrlInput.value,
                title: newTitleInput.value || null,
                alias: newAliasInput.value || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar');
        }

        const updated = await response.json();

        // Si el alias cambió, redirigir a la nueva página de gestión
        if (updated.shortId !== shortId) {
            showAlert('✅ URL actualizada, redirigiendo...');
            setTimeout(() => {
                window.location.href = `/qr/${updated.shortId}/manage`;
            }, 1500);
            return;
        }

        qrData = { ...qrData, ...updated };
        displayQrData();
        editModal.classList.remove('show');
        showAlert('✅ QR actualizado correctamente');
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Delete Modal
document.getElementById('deleteQrBtn').addEventListener('click', () => {
    deleteModal.classList.add('show');
});

document.getElementById('closeDeleteModal').addEventListener('click', () => {
    deleteModal.classList.remove('show');
});

document.getElementById('cancelDelete').addEventListener('click', () => {
    deleteModal.classList.remove('show');
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
    const btn = document.getElementById('confirmDelete');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<div class="loading"></div> Eliminando...';

        const response = await fetch(`/api/qr/manage/${shortId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar');
        }

        showAlert('✅ QR eliminado correctamente');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error al eliminar el QR', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Close modals on backdrop click
[editModal, deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Alert helper
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '10000';
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Initialize on load
init();
