/**
 * BINUS Lost & Found - Public Homepage JavaScript
 * Handles: item listing, search, filter by building & category, responsive nav
 * 
 * Public users only see items with status AVAILABLE.
 * No image display, no claim process, no login required.
 */

const API_BASE = API_CONFIG.API_BASE;

// ── State ──
let allItems = [];

// ── DOM Elements ──
const searchInput = document.getElementById('searchInput');
const buildingFilter = document.getElementById('buildingFilter');
const categoryFilter = document.getElementById('categoryFilter');
const itemsBody = document.getElementById('itemsBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const itemsTable = document.getElementById('itemsTable');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// ── Initialization ──
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  await fetchItems();
}

// ── Fetch Items from API ──
// Backend already filters to only return AVAILABLE items
async function fetchItems() {
  showLoading(true);
  hideEmptyState();

  try {
    const res = await fetch(API_BASE + '/items');

    if (!res.ok) {
      throw new Error('Server error: ' + res.status);
    }

    const json = await res.json();

    if (json.success) {
      allItems = json.data || [];
      filterItems(); // Use filterItems to apply default Anggrek filter immediately
    } else {
      allItems = [];
      renderItems([]);
    }
  } catch (err) {
    console.error('Failed to fetch items:', err);
    allItems = [];
    renderItems([]);
    showErrorInTable('Gagal memuat data. Pastikan server berjalan.');
  } finally {
    showLoading(false);
  }
}

// ── Event Listeners ──
function setupEventListeners() {
  if (searchInput) searchInput.addEventListener('input', filterItems);
  if (buildingFilter) buildingFilter.addEventListener('change', filterItems);
  if (categoryFilter) categoryFilter.addEventListener('change', filterItems);
}

// ── Filter Items (Fuzzy Elastic Search) ──
function filterItems() {
  var search = searchInput ? searchInput.value.trim() : '';
  var building = buildingFilter ? buildingFilter.value : '';
  var category = categoryFilter ? categoryFilter.value : '';

  var filtered = allItems;

  // Apply building filter first (exact match)
  if (building) {
    filtered = filtered.filter(function (item) {
      return item.building === building;
    });
  }

  // Apply category filter (exact match)
  if (category) {
    filtered = filtered.filter(function (item) {
      return item.category === category;
    });
  }

  // Apply fuzzy search across all text fields
  if (search && typeof FuzzySearch !== 'undefined') {
    filtered = FuzzySearch.filter(search, filtered, function (item) {
      return [
        item.title || '',
        item.category || '',
        item.building || '',
        item.location_detail || ''
      ];
    }, 0.35);
  }

  renderItems(filtered);
}

// ── Render Items Table ──
// Public table shows: Barang, Lokasi, Waktu Ditemukan
// No status column needed since all items are AVAILABLE
// No image, no internal note, no sensitive data
function renderItems(items) {
  if (!items || items.length === 0) {
    itemsBody.innerHTML = '';
    itemsTable.style.display = 'none';
    showEmptyState();
    return;
  }

  itemsTable.style.display = '';
  hideEmptyState();

  var html = '';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var lokasi = (item.location_detail || '');
    var dateStr = formatDate(item.date_found);

    html += '<tr>';
    html += '<td class="col-barang">' + escapeHtml(item.title || '-') + '</td>';
    html += '<td class="col-lokasi">' + escapeHtml(lokasi || '-') + '</td>';
    html += '<td class="col-waktu">' + dateStr + '</td>';
    html += '</tr>';
  }

  itemsBody.innerHTML = html;
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

    return day + '-' + month + '-' + year + '-' + hours + ':' + minutes;
  } catch (e) {
    return dateString;
  }
}

// ── Escape HTML to prevent XSS ──
function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ── UI Helpers ──
function showLoading(show) {
  if (show) {
    loadingState.classList.remove('hidden');
    loadingState.style.display = '';
  } else {
    loadingState.classList.add('hidden');
    loadingState.style.display = 'none';
  }
}

function showEmptyState() {
  emptyState.style.display = '';
}

function hideEmptyState() {
  emptyState.style.display = 'none';
}

function showErrorInTable(message) {
  itemsTable.style.display = 'none';
  emptyState.querySelector('p').textContent = message;
  showEmptyState();
}
