// Storage keys
const STORAGE_KEYS = {
    PRODUCTS: 'premium_vault_products',
    ACCOUNTS: 'premium_vault_accounts'
};

// Global state
let products = [];
let accounts = [];
let currentProduct = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderProducts();
    setupEventListeners();
    showToast('Welcome to Premium Vault!', 'success');
});

// Load data from localStorage
function loadData() {
    const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const storedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    
    products = storedProducts ? JSON.parse(storedProducts) : [];
    accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
    
    // Add sample data only if completely empty
    if (products.length === 0 && accounts.length === 0) {
        products = ['Capcut', 'Netflix', 'Spotify'];
        saveProducts();
        
        // Add sample account
        const sampleAccount = {
            id: Date.now().toString(),
            productName: 'Capcut',
            email: 'sample@example.com',
            password: 'sample123',
            subscriptionName: 'Pro',
            statusTag: 'Free',
            accountType: 'Purchased',
            claimedDate: new Date().toISOString().split('T')[0],
            durationValue: 30,
            durationUnit: 'days',
            expiredDate: getExpiryDate(new Date().toISOString().split('T')[0], 30, 'days'),
            accountNumber: '001',
            username: 'sample_user',
            note: 'Sample account',
            addedTime: new Date().toLocaleString()
        };
        accounts.push(sampleAccount);
        saveAccounts();
    }
}

function saveProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function saveAccounts() {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

function getExpiryDate(claimedDate, value, unit) {
    if (!claimedDate || !value) return '';
    let date = new Date(claimedDate);
    if (unit === 'days') date.setDate(date.getDate() + value);
    else if (unit === 'weeks') date.setDate(date.getDate() + (value * 7));
    else if (unit === 'months') date.setMonth(date.getMonth() + value);
    return date.toISOString().split('T')[0];
}

function calculateDaysLeft(expiredDate) {
    if (!expiredDate) return '∞';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expire = new Date(expiredDate);
    const diffTime = expire - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Render products grid
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No Products Yet</h3>
                <p>Click "New Product" to get started</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const productAccounts = accounts.filter(acc => acc.productName === product);
        const total = productAccounts.length;
        const free = productAccounts.filter(acc => acc.statusTag === 'Free').length;
        const using = productAccounts.filter(acc => acc.statusTag === 'Using').length;
        
        return `
            <div class="product-card" onclick="viewProduct('${escapeHtml(product)}')">
                <div class="product-name">🎬 ${escapeHtml(product)}</div>
                <div class="product-stats">
                    <span class="stat-badge">📊 Total: ${total}</span>
                    <span class="stat-badge">🟢 Free: ${free}</span>
                    <span class="stat-badge">🔵 Using: ${using}</span>
                </div>
                <div class="product-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-outline" onclick="openAddAccountModal('${escapeHtml(product)}')">+ Add Account</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${escapeHtml(product)}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// View product details
function viewProduct(productName) {
    currentProduct = productName;
    document.getElementById('productsView').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
    document.getElementById('detailTitle').innerHTML = `📱 ${escapeHtml(productName)}`;
    
    const productAccounts = accounts.filter(acc => acc.productName === productName);
    const total = productAccounts.length;
    const free = productAccounts.filter(acc => acc.statusTag === 'Free').length;
    const using = productAccounts.filter(acc => acc.statusTag === 'Using').length;
    const sold = productAccounts.filter(acc => acc.statusTag === 'Sold').length;
    const expired = productAccounts.filter(acc => calculateDaysLeft(acc.expiredDate) <= 0).length;
    const expiringSoon = productAccounts.filter(acc => {
        const days = calculateDaysLeft(acc.expiredDate);
        return days > 0 && days <= 7;
    }).length;
    
    const dashboard = `
        <div class="dashboard">
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">Total</div></div>
                <div class="stat-card"><div class="stat-number">${free}</div><div class="stat-label">Free</div></div>
                <div class="stat-card"><div class="stat-number">${using}</div><div class="stat-label">Using</div></div>
                <div class="stat-card"><div class="stat-number">${sold}</div><div class="stat-label">Sold</div></div>
                <div class="stat-card"><div class="stat-number">${expired}</div><div class="stat-label">Expired</div></div>
                <div class="stat-card"><div class="stat-number">${expiringSoon}</div><div class="stat-label">⚠️ Expiring Soon</div></div>
            </div>
        </div>
        <div class="filter-bar">
            <select id="filterStatus" onchange="renderAccountList()">
                <option value="">All Status</option>
                <option value="Free">🟢 Free</option>
                <option value="Using">🔵 Using</option>
                <option value="Sold">🔴 Sold</option>
                <option value="Gave someone">🎁 Gave someone</option>
            </select>
            <select id="filterType" onchange="renderAccountList()">
                <option value="">All Types</option>
                <option value="Trial">Trial</option>
                <option value="Hitter">Hitter</option>
                <option value="Purchased">Purchased</option>
            </select>
            <input type="text" id="searchEmail" placeholder="🔍 Search by email..." onkeyup="renderAccountList()">
            <button class="btn btn-primary" onclick="openAddAccountModal('${productName}')">+ Add Account</button>
        </div>
        <div id="accountsList"></div>
    `;
    
    document.getElementById('detailContent').innerHTML = dashboard;
    renderAccountList();
}

function renderAccountList() {
    if (!currentProduct) return;
    
    let filtered = accounts.filter(acc => acc.productName === currentProduct);
    
    const statusFilter = document.getElementById('filterStatus')?.value;
    const typeFilter = document.getElementById('filterType')?.value;
    const search = document.getElementById('searchEmail')?.value.toLowerCase();
    
    if (statusFilter) filtered = filtered.filter(acc => acc.statusTag === statusFilter);
    if (typeFilter) filtered = filtered.filter(acc => acc.accountType === typeFilter);
    if (search) filtered = filtered.filter(acc => acc.email.toLowerCase().includes(search));
    
    const container = document.getElementById('accountsList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>No accounts found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(acc => {
        const daysLeft = calculateDaysLeft(acc.expiredDate);
        let daysClass = 'badge-success';
        if (daysLeft <= 0) daysClass = 'badge-danger';
        else if (daysLeft <= 7) daysClass = 'badge-warning';
        
        const statusClass = acc.statusTag === 'Free' ? 'badge-success' : 
                           (acc.statusTag === 'Using' ? 'badge-warning' : 'badge-danger');
        
        return `
            <div class="account-card">
                <div class="account-header" onclick="toggleAccountDetails('${acc.id}')">
                    <div>
                        <div class="account-email">📧 ${escapeHtml(acc.email)}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">#${acc.accountNumber || 'No number'}</div>
                    </div>
                    <div class="account-badges">
                        <span class="badge ${daysClass}">📅 ${daysLeft} days left</span>
                        <span class="badge ${statusClass}">${acc.statusTag}</span>
                        <span class="badge badge-info">${acc.subscriptionName || 'Standard'}</span>
                    </div>
                </div>
                <div class="account-details" id="details-${acc.id}">
                    <div class="details-row">
                        <span class="details-label">🔑 Password:</span>
                        <span class="details-value">${acc.password || '••••••••'}</span>
                        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="copyToClipboard('${acc.password || ''}')">Copy</button>
                    </div>
                    <div class="details-row"><span class="details-label">👤 Username:</span><span class="details-value">${acc.username || '—'}</span></div>
                    <div class="details-row"><span class="details-label">📅 Claimed:</span><span class="details-value">${acc.claimedDate || '—'}</span></div>
                    <div class="details-row"><span class="details-label">⏰ Expires:</span><span class="details-value">${acc.expiredDate || '—'} (${daysLeft} days left)</span></div>
                    <div class="details-row"><span class="details-label">🏷️ Type:</span><span class="details-value">${acc.accountType}</span></div>
                    <div class="details-row"><span class="details-label">📝 Note:</span><span class="details-value">${acc.note || '—'}</span></div>
                    <div class="details-actions">
                        <button class="btn btn-outline" onclick="editAccount('${acc.id}')">✏️ Edit</button>
                        <button class="btn btn-outline" onclick="copyToClipboard('${acc.email}')">📧 Copy Email</button>
                        <button class="btn btn-outline" onclick="copyToClipboard('${acc.password || ''}')">🔑 Copy Password</button>
                        <button class="btn btn-danger" onclick="deleteAccount('${acc.id}')">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleAccountDetails(id) {
    const details = document.getElementById(`details-${id}`);
    if (details) details.classList.toggle('active');
}

// Open modals
function openAddAccountModal(productName = null) {
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">-- Select Product --</option>' + 
        products.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
    
    if (productName) select.value = productName;
    
    document.getElementById('accountForm').reset();
    document.getElementById('editAccountId').value = '';
    document.getElementById('modalTitle').innerText = 'Add New Account';
    document.getElementById('claimedDate').value = new Date().toISOString().split('T')[0];
    
    openModal('accountModal');
}

function editAccount(accountId) {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">-- Select Product --</option>' + 
        products.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
    
    document.getElementById('editAccountId').value = acc.id;
    document.getElementById('productSelect').value = acc.productName;
    document.getElementById('email').value = acc.email;
    document.getElementById('password').value = acc.password || '';
    document.getElementById('subscriptionName').value = acc.subscriptionName || '';
    document.getElementById('statusTag').value = acc.statusTag || 'Free';
    document.getElementById('accountType').value = acc.accountType || 'Trial';
    document.getElementById('claimedDate').value = acc.claimedDate || '';
    document.getElementById('durationValue').value = acc.durationValue || '';
    document.getElementById('durationUnit').value = acc.durationUnit || 'days';
    document.getElementById('accountNumber').value = acc.accountNumber || '';
    document.getElementById('username').value = acc.username || '';
    document.getElementById('note').value = acc.note || '';
    document.getElementById('modalTitle').innerText = 'Edit Account';
    
    updateExpiryInfo();
    openModal('accountModal');
}

// Form submission
document.getElementById('accountForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let productName = document.getElementById('productSelect').value;
    const newProduct = document.getElementById('newProductInput').value.trim();
    
    if (newProduct) {
        productName = newProduct;
        if (!products.includes(productName)) {
            products.push(productName);
            saveProducts();
            renderProducts();
        }
    }
    
    if (!productName) {
        showToast('Please select or add a product', 'error');
        return;
    }
    
    const email = document.getElementById('email').value;
    if (!email) {
        showToast('Email is required', 'error');
        return;
    }
    
    const editId = document.getElementById('editAccountId').value;
    const duplicate = accounts.some(acc => 
        acc.productName === productName && 
        acc.email === email && 
        acc.id !== editId
    );
    
    if (duplicate) {
        showToast('This email is already used for this product!', 'error');
        return;
    }
    
    const claimedDate = document.getElementById('claimedDate').value;
    const durationValue = parseInt(document.getElementById('durationValue').value) || 0;
    const durationUnit = document.getElementById('durationUnit').value;
    const expiredDate = getExpiryDate(claimedDate, durationValue, durationUnit);
    
    const accountData = {
        id: editId || Date.now().toString(),
        productName: productName,
        email: email,
        password: document.getElementById('password').value,
        subscriptionName: document.getElementById('subscriptionName').value,
        statusTag: document.getElementById('statusTag').value,
        accountType: document.getElementById('accountType').value,
        claimedDate: claimedDate,
        durationValue: durationValue,
        durationUnit: durationUnit,
        expiredDate: expiredDate,
        accountNumber: document.getElementById('accountNumber').value,
        username: document.getElementById('username').value,
        note: document.getElementById('note').value,
        addedTime: editId ? 
            (accounts.find(a => a.id === editId)?.addedTime || new Date().toLocaleString()) : 
            new Date().toLocaleString()
    };
    
    if (editId) {
        const index = accounts.findIndex(a => a.id === editId);
        if (index !== -1) accounts[index] = accountData;
        showToast('Account updated successfully!', 'success');
    } else {
        accounts.push(accountData);
        showToast('Account added successfully!', 'success');
    }
    
    saveAccounts();
    closeModal('accountModal');
    
    if (currentProduct && currentProduct === productName) {
        viewProduct(currentProduct);
    } else {
        renderProducts();
    }
});

document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newProduct = document.getElementById('productName').value.trim();
    
    if (!newProduct) {
        showToast('Please enter a product name', 'error');
        return;
    }
    
    if (products.includes(newProduct)) {
        showToast('Product already exists!', 'error');
        return;
    }
    
    products.push(newProduct);
    saveProducts();
    renderProducts();
    closeModal('productModal');
    document.getElementById('productForm').reset();
    showToast(`Product "${newProduct}" created!`, 'success');
});

// Helper functions
function updateExpiryInfo() {
    const claimedDate = document.getElementById('claimedDate').value;
    const durationValue = parseInt(document.getElementById('durationValue').value);
    const durationUnit = document.getElementById('durationUnit').value;
    
    if (claimedDate && durationValue) {
        const expiryDate = getExpiryDate(claimedDate, durationValue, durationUnit);
        const daysLeft = calculateDaysLeft(expiryDate);
        document.getElementById('expiryInfo').value = `Expires: ${expiryDate} (${daysLeft} days left)`;
    } else {
        document.getElementById('expiryInfo').value = 'Enter claimed date and duration';
    }
}

function deleteAccount(accountId) {
    if (confirm('Are you sure you want to delete this account?')) {
        accounts = accounts.filter(a => a.id !== accountId);
        saveAccounts();
        if (currentProduct) viewProduct(currentProduct);
        else renderProducts();
        showToast('Account deleted', 'success');
    }
}

function deleteProduct(productName) {
    if (confirm(`Delete "${productName}" and all its accounts? This cannot be undone.`)) {
        products = products.filter(p => p !== productName);
        accounts = accounts.filter(a => a.productName !== productName);
        saveProducts();
        saveAccounts();
        renderProducts();
        if (currentProduct === productName) backToProducts();
        showToast(`Product "${productName}" deleted`, 'success');
    }
}

function backToProducts() {
    currentProduct = null;
    document.getElementById('productsView').style.display = 'block';
    document.getElementById('detailView').style.display = 'none';
    renderProducts();
}

function exportData() {
    const data = {
        products: products,
        accounts: accounts,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `premium_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.products) products = data.products;
                if (data.accounts) accounts = data.accounts;
                saveProducts();
                saveAccounts();
                renderProducts();
                showToast('Data imported successfully!', 'success');
            } catch (err) {
                showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function copyToClipboard(text) {
    if (!text) {
        showToast('Nothing to copy', 'error');
        return;
    }
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#f44336' : '#4fc3f7';
    toast.style.color = '#0a0a0f';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function setupEventListeners() {
    document.getElementById('addProductBtn')?.addEventListener('click', () => openModal('productModal'));
    document.getElementById('exportBtn')?.addEventListener('click', exportData);
    document.getElementById('importBtn')?.addEventListener('click', importData);
    document.getElementById('backBtn')?.addEventListener('click', backToProducts);
    document.getElementById('creatorLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('tg://resolve?domain=william815');
    });
    
    // Auto-calculate expiry
    document.getElementById('claimedDate')?.addEventListener('change', updateExpiryInfo);
    document.getElementById('durationValue')?.addEventListener('input', updateExpiryInfo);
    document.getElementById('durationUnit')?.addEventListener('change', updateExpiryInfo);
    
    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    };
}

// Make functions global for HTML onclick
window.viewProduct = viewProduct;
window.openAddAccountModal = openAddAccountModal;
window.deleteProduct = deleteProduct;
window.deleteAccount = deleteAccount;
window.editAccount = editAccount;
window.toggleAccountDetails = toggleAccountDetails;
window.copyToClipboard = copyToClipboard;
window.closeModal = closeModal;
window.renderAccountList = renderAccountList;
window.backToProducts = backToProducts;
