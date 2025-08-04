// Global variables
let currentData = [];
let currentPage = 0;
const itemsPerPage = 25;
let totalResults = 0;

// API base URL - will work for both local development and production
const API_BASE = window.location.origin;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkApiHealth();
    loadProvinces();
    setupEventListeners();
    loadInitialData();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // Quick navigation buttons
    document.querySelectorAll('.quick-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const searchTerm = this.dataset.search;
            document.getElementById('search-input').value = searchTerm;
            performSearch();
        });
    });

    // Province selection change
    document.getElementById('province-select').addEventListener('change', function() {
        if (this.value) {
            performSearch();
        }
    });

    // Pagination
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            displayResults();
        }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        if ((currentPage + 1) * itemsPerPage < totalResults) {
            currentPage++;
            displayResults();
        }
    });

    // Stats modal
    document.getElementById('close-stats').addEventListener('click', closeStatsModal);
}

// Check API health and display status
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        
        const statusElement = document.getElementById('api-status');
        if (data.success) {
            statusElement.textContent = 'Online';
            statusElement.className = 'font-semibold text-green-300';
            
            // Load statistics
            loadStatistics();
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'font-semibold text-red-300';
        }
    } catch (error) {
        console.error('Health check failed:', error);
        document.getElementById('api-status').textContent = 'Error';
        document.getElementById('api-status').className = 'font-semibold text-red-300';
    }
}

// Load database statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const data = await response.json();
        
        if (data.success && data.data.total) {
            document.getElementById('total-areas').textContent = data.data.total.toLocaleString();
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// Load provinces for the dropdown
async function loadProvinces() {
    try {
        const response = await fetch(`${API_BASE}/api/provinsi`);
        const data = await response.json();
        if (data.success) {
            const select = document.getElementById('province-select');
            data.data.forEach(province => {
                const option = document.createElement('option');
                option.value = province.code;
                option.textContent = `${province.name} (${province.code})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load provinces:', error);
    }
}

// Load initial data (first page of all data)
async function loadInitialData() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/api/wilayah?limit=${itemsPerPage}&sort=type`);
        const data = await response.json();
        
        if (data.success) {
            currentData = data.data;
            totalResults = data.pagination.total;
            currentPage = 0;
            displayResults();
            updateResultCount();
        }
    } catch (error) {
        console.error('Failed to load initial data:', error);
        showNoResults();
    } finally {
        showLoading(false);
    }
}

// Perform search based on current form values
async function performSearch() {
    const searchTerm = document.getElementById('search-input').value.trim();
    const type = document.getElementById('type-select').value;
    const provinceCode = document.getElementById('province-select').value;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (type) params.append('type', type);
    if (provinceCode) params.append('provinsi_code', provinceCode);
    params.append('limit', '100'); // Get more results for search
    params.append('sort', 'name');
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/api/wilayah?${params.toString()}`);
        const data = await response.json();
        if (data.success) {
            currentData = data.data;
            totalResults = data.pagination.total;
            currentPage = 0;
            displayResults();
            updateResultCount();
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Search failed:', error);
        showNoResults();
    } finally {
        showLoading(false);
    }
}

// Display search results in the table
function displayResults() {
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = '';
    
    if (currentData.length === 0) {
        showNoResults();
        return;
    }
    
    // Calculate pagination
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, currentData.length);
    const pageData = currentData.slice(startIndex, endIndex);
    
    pageData.forEach(item => {
        const row = createTableRow(item);
        tbody.appendChild(row);
    });
    
    updatePagination();
    hideNoResults();
}

// Create a table row for an item
function createTableRow(item) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    // Type badge
    const typeBadge = `<span class="type-badge type-${item.type}">${getTypeLabel(item.type)}</span>`;
    
    // Parent information
    let parentInfo = '-';
    if (item.type !== 'provinsi' && item.provinsiCode) {
        parentInfo = `Province: ${item.provinsiCode}`;
        if (item.kabupatenKotaCode && item.type !== 'kabupaten_kota') {
            parentInfo += `, Regency: ${item.kabupatenKotaFullCode}`;
        }
        if (item.kecamatanCode && item.type === 'kelurahan_desa') {
            parentInfo += `, District: ${item.kecamatanFullCode}`;
        }
    }
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="font-medium text-gray-900">${item.name}</div>
            <div class="text-sm text-gray-500">ID: ${item._id}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${typeBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-mono">${item.code}</div>
            ${item.fullCode !== item.code ? `<div class="text-xs text-gray-500">${item.fullCode}</div>` : ''}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parentInfo}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button onclick="showSubAreas('${item.type}', '${item.fullCode || item.code}', '${item.name}')" 
                    class="text-blue-600 hover:text-blue-800 mr-3">
                <i class="fas fa-eye"></i> View Sub-areas
            </button>
            <button onclick="copyToClipboard(event, '${item.fullCode || item.code}')" 
                    class="text-green-600 hover:text-green-800">
                <i class="fas fa-copy"></i> Copy Code
            </button>
        </td>
    `;
    
    return row;
}

// Get human-readable type label
function getTypeLabel(type) {
    const labels = {
        'provinsi': 'Province',
        'kabupaten_kota': 'Regency/City',
        'kecamatan': 'District',
        'kelurahan_desa': 'Village'
    };
    return labels[type] || type;
}

// Show sub-areas for a selected item
async function showSubAreas(type, code, name) {
    let endpoint = '';
    let title = '';
    
    switch(type) {
        case 'provinsi':
            endpoint = `/api/kabupaten-kota?provinsiCode=${code}`;
            title = `Regencies/Cities in ${name}`;
            break;
        case 'kabupaten_kota':
            endpoint = `/api/kecamatan?kabkotaCode=${code}`;
            title = `Districts in ${name}`;
            break;
        case 'kecamatan':
            endpoint = `/api/kelurahan-desa?kecamatanCode=${code}`;
            title = `Villages in ${name}`;
            break;
        default:
            alert('No sub-areas available for this level');
            return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        
        if (data.success) {
            currentData = data.data;
            totalResults = data.data.length;
            currentPage = 0;
            displayResults();
            updateResultCount(title);
        }
    } catch (error) {
        console.error('Failed to load sub-areas:', error);
        alert('Failed to load sub-areas');
    } finally {
        showLoading(false);
    }
}

// Copy code to clipboard
function copyToClipboard(event, text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show a brief success message
        const button = event.target.closest('button');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.className = 'text-green-600';
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.className = 'text-green-600 hover:text-green-800';
        }, 1000);
    });
}

// Update result count display
function updateResultCount(customTitle = null) {
    const resultCount = document.getElementById('result-count');
    if (customTitle) {
        resultCount.textContent = customTitle;
    } else {
        resultCount.textContent = `${totalResults} results found`;
    }
}

// Update pagination controls
function updatePagination() {
    const showingFrom = Math.min(currentPage * itemsPerPage + 1, currentData.length);
    const showingTo = Math.min((currentPage + 1) * itemsPerPage, currentData.length);
    
    document.getElementById('showing-from').textContent = showingFrom;
    document.getElementById('showing-to').textContent = showingTo;
    document.getElementById('total-results').textContent = currentData.length;
    
    // Update button states
    document.getElementById('prev-btn').disabled = currentPage === 0;
    document.getElementById('next-btn').disabled = (currentPage + 1) * itemsPerPage >= currentData.length;
}

// Show/hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('results-table');
    const pagination = document.getElementById('pagination');
    
    if (show) {
        loading.classList.remove('hidden');
        table.classList.add('hidden');
        pagination.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        table.classList.remove('hidden');
        pagination.classList.remove('hidden');
    }
}

// Show/hide no results state
function showNoResults() {
    document.getElementById('no-results').classList.remove('hidden');
    document.getElementById('results-table').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

function hideNoResults() {
    document.getElementById('no-results').classList.add('hidden');
}

// Stats modal functions
function closeStatsModal() {
    document.getElementById('stats-modal').classList.add('hidden');
}
