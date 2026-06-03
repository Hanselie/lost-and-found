/**
 * BINUS Lost & Found - Admin Dashboard JavaScript
 * Handles: auth, stats, CRUD items, modals, notifications, logout
 * 
 * Admin can see ALL statuses (AVAILABLE, RETURNED, EXPIRED).
 * Admin can filter by status.
 * "Mark as Returned" button for easy returned flow.
 * No claim process — all verification is done in person.
 */

const API_BASE = API_CONFIG.API_BASE;

// ── State ──
let items = [];
let editingItemId = null;

// ── DOM Elements ──
const totalCount = document.getElementById('totalCount');
const availableCount = document.getElementById('availableCount');
const returnedCount = document.getElementById('returnedCount');
const expiredCount = document.getElementById('expiredCount');
const adminTableBody = document.getElementById('adminTableBody');
const adminEmptyState = document.getElementById('adminEmptyState');
const adminLoadingState = document.getElementById('adminLoadingState');
const adminTable = document.getElementById('adminTable');
const addItemBtn = document.getElementById('addItemBtn');
const adminStatusFilter = document.getElementById('adminStatusFilter');
const adminSearchInput = document.getElementById('adminSearchInput');
const logoutBtn = document.getElementById('logoutBtn');
const itemModal = document.getElementById('itemModal');
const modalTitle = document.getElementById('modalTitle');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');
const itemForm = document.getElementById('itemForm');
const toastContainer = document.getElementById('toastContainer');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// Form fields
const itemTitle = document.getElementById('itemTitle');
const itemCategory = document.getElementById('itemCategory');
const itemBuilding = document.getElementById('itemBuilding');
const itemLocation = document.getElementById('itemLocation');
const itemDate = document.getElementById('itemDate');
const itemStatus = document.getElementById('itemStatus');
const itemNote = document.getElementById('itemNote');

// ── Initialization ──
document.addEventListener('DOMContentLoaded', async function () {
  setupNavToggle();

  var isAuth = await checkAuth();
  if (!isAuth) {
    window.location.href = 'admin-login.html';
    return;
  }

  setupEventListeners();
  
  // Render static icons immediately on page load so they show even if API/DB is offline
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  try {
    await loadDashboard();
  } catch (err) {
    console.error('Gagal memuat data dashboard:', err);
  }
});

// ── Navbar Toggle (Mobile) ──
function setupNavToggle() {
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    var navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
}

// ── Auth Check ──
async function checkAuth() {
  try {
    var res = await fetch(API_BASE + '/auth/check', {
      credentials: 'include'
    });
    var json = await res.json();
    return json.success === true;
  } catch (err) {
    return false;
  }
}

// ── Load Dashboard Data ──
async function loadDashboard() {
  await Promise.all([loadStats(), loadItems()]);
}

// ── Load Statistics ──
async function loadStats() {
  try {
    var res = await fetch(API_BASE + '/items/stats', {
      credentials: 'include'
    });
    var json = await res.json();

    if (json.success && json.data) {
      var available = json.data.available || 0;
      var returned = json.data.returned || 0;
      var expired = json.data.expired || 0;

      totalCount.textContent = json.data.total || 0;
      availableCount.textContent = available;
      returnedCount.textContent = returned;
      expiredCount.textContent = expired;

      // Render modern classy doughnut chart
      renderStatusChart(available, returned, expired);
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
    totalCount.textContent = '-';
    availableCount.textContent = '-';
    returnedCount.textContent = '-';
    expiredCount.textContent = '-';
  }
}

// ── Render Classy Doughnut Chart ──
let statusChartInstance = null;
function renderStatusChart(available, returned, expired) {
  const canvas = document.getElementById('statusChart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js is not loaded. Status chart rendering skipped.');
    return;
  }

  if (statusChartInstance) {
    statusChartInstance.destroy();
  }

  // If there is no data at all, render a grey chart
  const hasData = (available + returned + expired) > 0;
  const chartData = hasData ? [available, returned, expired] : [1];
  const chartColors = hasData ? ['#10b981', '#64748b', '#ef4444'] : ['#e2e8f0'];

  statusChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: hasData ? ['Tersedia', 'Dikembalikan', 'Kadaluarsa'] : ['Tidak ada data'],
      datasets: [{
        data: chartData,
        backgroundColor: chartColors,
        borderWidth: 0,
        hoverOffset: hasData ? 4 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: hasData,
          backgroundColor: '#0f172a',
          titleFont: { size: 11, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 4,
          displayColors: false
        }
      },
      cutout: '75%'
    }
  });
}

// ── Load Items (with optional status filter) ──
async function loadItems() {
  showAdminLoading(true);
  hideAdminEmpty();

  try {
    var statusFilter = adminStatusFilter.value;
    var url = API_BASE + '/items/admin';
    if (statusFilter) {
      url += '?status=' + encodeURIComponent(statusFilter);
    }

    var res = await fetch(url, {
      credentials: 'include'
    });
    var json = await res.json();

    if (json.success) {
      items = json.data || [];
      filterAdminItems();
    } else {
      items = [];
      filterAdminItems();
    }
  } catch (err) {
    console.error('Failed to load items:', err);
    items = [];
    renderAdminTable([]);
  } finally {
    showAdminLoading(false);
  }
}

// ── Filter Admin Items (Fuzzy Elastic Search) ──
function filterAdminItems() {
  var search = adminSearchInput ? adminSearchInput.value.trim() : '';
  
  var filtered = items;
  
  // Apply fuzzy search across all fields
  if (search && typeof FuzzySearch !== 'undefined') {
    filtered = FuzzySearch.filter(search, filtered, function (item) {
      return [
        String(item.id || ''),
        item.title || '',
        item.category || '',
        item.building || '',
        item.location_detail || '',
        item.internal_note || ''
      ];
    }, 0.35);
  }
  
  renderAdminTable(filtered);
}

// ── Render Admin Table ──
function renderAdminTable(itemsList) {
  if (!itemsList || itemsList.length === 0) {
    adminTableBody.innerHTML = '';
    adminTable.style.display = 'none';
    showAdminEmpty();
    updateAnalytics(itemsList || []);
    return;
  }

  adminTable.style.display = '';
  hideAdminEmpty();

  var html = '';
  for (var i = 0; i < itemsList.length; i++) {
    var item = itemsList[i];
    var status = (item.status || 'AVAILABLE').toUpperCase();
    var dateStr = formatDate(item.date_found);
    var note = item.internal_note || '-';
    var truncatedNote = note.length > 30 ? note.substring(0, 30) + '...' : note;
    var itemId = item.id || '';
    var displayId = String(itemId);

    html += '<tr>';
    html += '<td class="id-cell">' + escapeHtml(displayId) + '</td>';
    html += '<td>' + escapeHtml(item.title || '-') + '</td>';
    html += '<td>' + escapeHtml(item.category || '-') + '</td>';
    html += '<td>' + escapeHtml(item.building || '-') + '</td>';
    html += '<td>' + escapeHtml(item.location_detail || '-') + '</td>';
    html += '<td>' + dateStr + '</td>';
    html += '<td>' + getStatusBadge(status) + '</td>';
    html += '<td class="note-cell" title="' + escapeAttr(note) + '">' + escapeHtml(truncatedNote) + '</td>';
    html += '<td class="actions">';

    // Edit button
    html += '<button class="btn btn-sm btn-primary btn-icon" onclick="handleEdit(\'' + escapeAttr(String(itemId)) + '\')" title="Edit" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;"><i data-feather="edit-2" style="width: 14px; height: 14px;"></i></button> ';

    // Mark as Returned button (Always render space/button to keep alignment parallel!)
    if (status === 'AVAILABLE') {
      html += '<button class="btn btn-sm btn-success btn-icon" onclick="handleMarkReturned(\'' + escapeAttr(String(itemId)) + '\')" title="Tandai Sudah Dikembalikan" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;"><i data-feather="check" style="width: 14px; height: 14px;"></i></button> ';
    } else {
      // Disabled placeholder button to keep vertical alignment perfectly parallel!
      html += '<button class="btn btn-sm btn-success btn-icon" disabled title="Sudah dikembalikan / kadaluarsa" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; opacity: 0.25; cursor: not-allowed; background-color: #6c757d; border-color: #6c757d;"><i data-feather="check" style="width: 14px; height: 14px;"></i></button> ';
    }

    // Delete button
    html += '<button class="btn btn-sm btn-danger btn-icon" onclick="handleDelete(\'' + escapeAttr(String(itemId)) + '\')" title="Hapus" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;"><i data-feather="trash-2" style="width: 14px; height: 14px;"></i></button> ';

    // Status dropdown
    html += '<select class="status-select" onchange="handleStatusChange(\'' + escapeAttr(String(itemId)) + '\', this.value)" title="Ubah Status">';
    html += '<option value="" disabled selected>Status</option>';
    html += '<option value="AVAILABLE"' + (status === 'AVAILABLE' ? ' disabled' : '') + '>AVAILABLE</option>';
    html += '<option value="RETURNED"' + (status === 'RETURNED' ? ' disabled' : '') + '>RETURNED</option>';
    html += '<option value="EXPIRED"' + (status === 'EXPIRED' ? ' disabled' : '') + '>EXPIRED</option>';
    html += '</select>';

    html += '</td>';
    html += '</tr>';
  }

  adminTableBody.innerHTML = html;

  // Update new real-time line, horizontal bar, and vertical bar charts + recovery rate KPI
  updateAnalytics(itemsList);
  
  // Replace feather icons for newly rendered dynamic SVGs
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

// ── Setup Event Listeners ──
function setupEventListeners() {
  addItemBtn.addEventListener('click', function () {
    openModal();
  });

  modalCloseBtn.addEventListener('click', function () {
    closeModal();
  });

  modalCancelBtn.addEventListener('click', function () {
    closeModal();
  });

  modalSubmitBtn.addEventListener('click', function () {
    handleItemSubmit();
  });

  logoutBtn.addEventListener('click', function () {
    handleLogout();
  });

  // Admin status filter
  adminStatusFilter.addEventListener('change', function () {
    loadItems();
  });

  // Admin search input (Elastic Search)
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', filterAdminItems);
  }

  // Close modal on overlay click
  itemModal.addEventListener('click', function (e) {
    if (e.target === itemModal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && itemModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// ── Open Modal (Add / Edit) ──
function openModal(item) {
  editingItemId = null;
  itemForm.reset();

  if (item) {
    // Edit mode
    editingItemId = item.id || item._id;
    modalTitle.textContent = 'Edit Barang';
    modalSubmitBtn.textContent = 'Update';

    itemTitle.value = item.title || '';
    itemCategory.value = item.category || '';
    itemBuilding.value = item.building || '';
    itemLocation.value = item.location_detail || '';
    itemStatus.value = (item.status || 'AVAILABLE').toUpperCase();
    itemNote.value = item.internal_note || '';

    // Format date for datetime-local input
    if (item.date_found) {
      try {
        var d = new Date(item.date_found);
        if (!isNaN(d.getTime())) {
          var year = d.getFullYear();
          var month = String(d.getMonth() + 1).padStart(2, '0');
          var day = String(d.getDate()).padStart(2, '0');
          var hours = String(d.getHours()).padStart(2, '0');
          var minutes = String(d.getMinutes()).padStart(2, '0');
          itemDate.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        }
      } catch (e) {
        itemDate.value = '';
      }
    }
  } else {
    // Add mode
    modalTitle.textContent = 'Tambah Barang';
    modalSubmitBtn.textContent = 'Simpan';
    itemStatus.value = 'AVAILABLE';

    // Default date to now
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    itemDate.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  itemModal.classList.add('active');
  itemTitle.focus();
}

// ── Close Modal ──
function closeModal() {
  itemModal.classList.remove('active');
  editingItemId = null;
  itemForm.reset();
}

// ── Handle Item Form Submit ──
async function handleItemSubmit() {
  // Validate required fields
  var title = itemTitle.value.trim();
  var category = itemCategory.value;
  var building = itemBuilding.value;
  var locationDetail = itemLocation.value.trim();
  var dateFound = itemDate.value;
  var status = itemStatus.value;
  var internalNote = itemNote.value.trim();

  if (!title) {
    showNotification('Nama barang wajib diisi', 'error');
    itemTitle.focus();
    return;
  }

  if (!category) {
    showNotification('Kategori wajib dipilih', 'error');
    itemCategory.focus();
    return;
  }

  if (!building) {
    showNotification('Gedung wajib dipilih', 'error');
    itemBuilding.focus();
    return;
  }

  if (!locationDetail) {
    showNotification('Lokasi detail wajib diisi', 'error');
    itemLocation.focus();
    return;
  }

  if (!dateFound) {
    showNotification('Tanggal ditemukan wajib diisi', 'error');
    itemDate.focus();
    return;
  }

  var formData = {
    title: title,
    category: category,
    building: building,
    location_detail: locationDetail,
    date_found: new Date(dateFound).toISOString(),
    status: status,
    internal_note: internalNote
  };

  var url = editingItemId ? API_BASE + '/items/' + editingItemId : API_BASE + '/items';
  var method = editingItemId ? 'PUT' : 'POST';

  // Disable submit during request
  modalSubmitBtn.disabled = true;
  modalSubmitBtn.textContent = 'Menyimpan...';

  try {
    var res = await fetch(url, {
      method: method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    var json = await res.json();

    if (json.success) {
      closeModal();
      await loadDashboard();
      showNotification(editingItemId ? 'Item berhasil diupdate' : 'Item berhasil ditambahkan', 'success');
    } else {
      showNotification(json.message || 'Gagal menyimpan item', 'error');
    }
  } catch (err) {
    console.error('Submit error:', err);
    showNotification('Gagal terhubung ke server', 'error');
  } finally {
    modalSubmitBtn.disabled = false;
    modalSubmitBtn.textContent = editingItemId ? 'Update' : 'Simpan';
  }
}

// ── Handle Edit ──
function handleEdit(id) {
  var item = items.find(function (it) {
    return String(it.id) === String(id);
  });

  if (item) {
    openModal(item);
  } else {
    showNotification('Item tidak ditemukan', 'error');
  }
}

// ── Handle Mark as Returned ──
// This is the main workflow: admin verifies owner in person, then marks as returned
async function handleMarkReturned(id) {
  var confirmed = await showConfirmModal({
    title: 'Verifikasi Pengembalian',
    message: 'Apakah barang sudah diverifikasi dan diserahkan kepada pemiliknya?\n\nKlik OK untuk mengubah status menjadi RETURNED. Barang akan hilang dari tampilan publik.',
    confirmText: 'Ya, Serahkan',
    isDanger: false
  });
  if (!confirmed) return;

  try {
    var res = await fetch(API_BASE + '/items/' + id + '/status', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'RETURNED' })
    });

    var json = await res.json();

    if (json.success) {
      await loadDashboard();
      showNotification('Barang berhasil ditandai sebagai RETURNED', 'success');
    } else {
      showNotification(json.message || 'Gagal mengupdate status', 'error');
    }
  } catch (err) {
    console.error('Mark returned error:', err);
    showNotification('Gagal terhubung ke server', 'error');
  }
}

// ── Handle Delete (Soft Delete) ──
async function handleDelete(id) {
  var confirmed = await showConfirmModal({
    title: 'Hapus Barang',
    message: 'Yakin ingin menghapus item ini?\n\nData akan di-soft-delete dan tidak akan muncul di daftar manapun.',
    confirmText: 'Ya, Hapus',
    isDanger: true
  });
  if (!confirmed) return;

  try {
    var res = await fetch(API_BASE + '/items/' + id, {
      method: 'DELETE',
      credentials: 'include'
    });

    var json = await res.json();

    if (json.success) {
      await loadDashboard();
      showNotification('Item berhasil dihapus', 'success');
    } else {
      showNotification(json.message || 'Gagal menghapus item', 'error');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showNotification('Gagal terhubung ke server', 'error');
  }
}

// ── Handle Status Change (via dropdown) ──
async function handleStatusChange(id, newStatus) {
  if (!newStatus) return;

  try {
    var res = await fetch(API_BASE + '/items/' + id + '/status', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    var json = await res.json();

    if (json.success) {
      await loadDashboard();
      showNotification('Status berhasil diupdate menjadi ' + newStatus, 'success');
    } else {
      showNotification(json.message || 'Gagal mengupdate status', 'error');
      await loadDashboard(); // Revert the select display
    }
  } catch (err) {
    console.error('Status update error:', err);
    showNotification('Gagal terhubung ke server', 'error');
    await loadDashboard();
  }
}

// ── Handle Logout ──
async function handleLogout() {
  try {
    await fetch(API_BASE + '/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    // Logout even if request fails
  }

  window.location.href = 'admin-login.html';
}

// ── Status Badge ──
function getStatusBadge(status) {
  var s = (status || '').toUpperCase();
  var cssClass = 'badge-available';

  if (s === 'RETURNED') {
    cssClass = 'badge-returned';
  } else if (s === 'EXPIRED') {
    cssClass = 'badge-expired';
  }

  return '<span class="badge ' + cssClass + '">' + escapeHtml(s) + '</span>';
}

// ── Date Formatting ──
function formatDate(dateString) {
  if (!dateString) return '-';

  try {
    var d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    var hours = String(d.getHours()).padStart(2, '0');
    var minutes = String(d.getMinutes()).padStart(2, '0');

    return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
  } catch (e) {
    return dateString;
  }
}

// ── Escape HTML ──
function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

// ── Escape Attribute Value ──
function escapeAttr(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Toast Notification ──
function showNotification(msg, type) {
  type = type || 'success';

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  var icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = '<span>' + icon + '</span> ' + escapeHtml(msg);

  toastContainer.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(function () {
    toast.classList.add('removing');
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// ── UI Helpers ──
function showAdminLoading(show) {
  if (show) {
    adminLoadingState.style.display = '';
  } else {
    adminLoadingState.style.display = 'none';
  }
}

function showAdminEmpty() {
  adminEmptyState.style.display = '';
}

function hideAdminEmpty() {
  adminEmptyState.style.display = 'none';
}

// ── Real-time Analytics & Classy Charts Engine ──
let trendChartInstance = null;
let categoryChartInstance = null;
let buildingChartInstance = null;

function updateAnalytics(itemsList) {
  if (!itemsList) itemsList = [];

  // 1. Calculate Recovery Rate: Returned / Total
  const total = itemsList.length;
  const returnedCountVal = itemsList.filter(function(item) {
    return (item.status || '').toUpperCase() === 'RETURNED';
  }).length;
  const recoveryRate = total > 0 ? Math.round((returnedCountVal / total) * 100) : 0;
  
  const recoveryRateText = document.getElementById('recoveryRateText');
  if (recoveryRateText) {
    recoveryRateText.textContent = recoveryRate + '%';
  }

  // 2. Trend: Found per Month (based on date_found)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyCounts = Array(12).fill(0);
  
  itemsList.forEach(function(item) {
    if (item.date_found) {
      const d = new Date(item.date_found);
      if (!isNaN(d.getTime())) {
        const m = d.getMonth();
        monthlyCounts[m]++;
      }
    }
  });

  const activeMonthsLabels = [];
  const activeMonthsData = [];
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 12; i++) {
    // Show months that have data, or at least up to current month to visualize trend beautifully
    if (i <= currentMonth || monthlyCounts[i] > 0) {
      activeMonthsLabels.push(months[i]);
      activeMonthsData.push(monthlyCounts[i]);
    }
  }

  // 3. Top Categories: Horizontal Bar Chart
  const categories = {};
  itemsList.forEach(function(item) {
    const c = item.category || 'Lainnya';
    categories[c] = (categories[c] || 0) + 1;
  });

  const sortedCategories = Object.keys(categories).map(function(key) {
    return [key, categories[key]];
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).slice(0, 5); // top 5
  
  const categoryLabels = sortedCategories.map(function(entry) { return entry[0]; });
  const categoryData = sortedCategories.map(function(entry) { return entry[1]; });

  // High-contrast color array for Top Categories (Sleek BINUS Blue vs Muted Gray)
  let maxCategoryIndex = 0;
  let maxCategoryVal = -1;
  for (let cI = 0; cI < categoryData.length; cI++) {
    if (categoryData[cI] > maxCategoryVal) {
      maxCategoryVal = categoryData[cI];
      maxCategoryIndex = cI;
    }
  }
  const categoryColors = categoryData.map(function(_, idx) {
    return idx === maxCategoryIndex ? '#005689' : '#cbd5e1';
  });

  // 4. Buildings distribution - SORT DESCENDING
  const buildings = {};
  itemsList.forEach(function(item) {
    const b = item.building || 'Lainnya';
    buildings[b] = (buildings[b] || 0) + 1;
  });

  const sortedBuildings = Object.keys(buildings).map(function(key) {
    return [key, buildings[key]];
  }).sort(function(a, b) {
    return b[1] - a[1]; // sort descending!
  });

  const buildingLabels = sortedBuildings.map(function(entry) { return entry[0]; });
  const buildingData = sortedBuildings.map(function(entry) { return entry[1]; });

  // High-contrast color array for Buildings (Vibrant Emerald vs Soft Mint Green)
  let maxBuildingIndex = 0;
  let maxBuildingVal = -1;
  for (let bI = 0; bI < buildingData.length; bI++) {
    if (buildingData[bI] > maxBuildingVal) {
      maxBuildingVal = buildingData[bI];
      maxBuildingIndex = bI;
    }
  }
  const buildingColors = buildingData.map(function(_, idx) {
    return idx === maxBuildingIndex ? '#10b981' : '#a7f3d0';
  });

  // --- RENDER REAL-TIME CHARTS ---
  renderTrendChart(activeMonthsLabels, activeMonthsData);
  renderCategoryChart(categoryLabels, categoryData, categoryColors);
  renderBuildingChart(buildingLabels, buildingData, buildingColors);
}

function renderTrendChart(labels, data) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;
  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Barang',
        data: data,
        borderColor: '#005689',
        backgroundColor: 'rgba(0, 86, 137, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#005689',
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
}

function renderCategoryChart(labels, data, colors) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;
  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors || '#64748b',
        borderRadius: 3,
        barThickness: 10
      }]
    },
    options: {
      indexAxis: 'y', // horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0, color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
}

function renderBuildingChart(labels, data, colors) {
  const canvas = document.getElementById('buildingChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;
  if (buildingChartInstance) buildingChartInstance.destroy();

  buildingChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors || '#10b981',
        borderRadius: 3,
        barThickness: 14
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
}

// ── Custom Confirmation Modal Helper (Replaces window.confirm) ──
function showConfirmModal(options) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const submitBtn = document.getElementById('confirmSubmitBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const closeBtn = document.getElementById('confirmCloseBtn');

    if (!modal) {
      // Fallback in case element is missing
      resolve(confirm(options.message));
      return;
    }

    titleEl.textContent = options.title || 'Konfirmasi';
    msgEl.innerHTML = options.message.replace(/\n/g, '<br>');
    submitBtn.textContent = options.confirmText || 'Ya, Lanjutkan';
    
    // Style confirm button dynamically based on action severity (Danger = Red, Normal = BINUS Blue)
    if (options.isDanger) {
      submitBtn.style.backgroundColor = '#e11d48';
      submitBtn.style.borderColor = '#e11d48';
    } else {
      submitBtn.style.backgroundColor = '#005689';
      submitBtn.style.borderColor = '#005689';
    }

    // Display overlay
    modal.classList.add('active');
    modal.style.display = 'flex';

    function cleanUp() {
      modal.classList.remove('active');
      modal.style.display = 'none';
      submitBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
    }

    function onConfirm() {
      cleanUp();
      resolve(true);
    }

    function onCancel() {
      cleanUp();
      resolve(false);
    }

    submitBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  });
}
