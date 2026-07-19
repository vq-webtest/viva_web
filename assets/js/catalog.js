let rfqCart = JSON.parse(localStorage.getItem('vivaquest_rfq_cart')) || [];

const catalogConfig = {
    impurities: { file: 'impurities.json', title: 'Impurities' },
    api: { file: 'api.json', title: 'APIs' },
    intermediates: { file: 'intermediates.json', title: 'KSMs & Intermediates' }
};

const ITEMS_PER_PAGE = 10;
let currentDataset = [];
let currentPage = 1;
let filteredRows = [];

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    updateCartCount();
    setupCartDrawer();
});

function setupCartDrawer() {
    if (!document.getElementById('floating-cart-btn')) {
        const cartBtn = document.createElement('button');
        cartBtn.id = 'floating-cart-btn';
        cartBtn.className = 'fixed bottom-6 right-6 bg-scientific-orange hover:bg-orange-600 text-white font-semibold p-4 rounded-full shadow-lg flex items-center gap-2 z-50 transition transform hover:scale-105';
        cartBtn.setAttribute('aria-label', 'Open Request for Quote Cart');
        cartBtn.innerHTML = `
            <span class="material-symbols-outlined text-2xl">shopping_cart</span>
            <span id="cart-counter" class="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">0</span>
            <span class="text-xs uppercase font-bold tracking-wider hidden sm:inline">RFQ Cart</span>
        `;
        cartBtn.onclick = toggleCartDrawer;
        document.body.appendChild(cartBtn);
    }

    if (!document.getElementById('cart-drawer')) {
        const drawer = document.createElement('div');
        drawer.id = 'cart-drawer';
        drawer.className = 'fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl border-l border-outline-variant z-50 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col hidden';
        drawer.innerHTML = `
            <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary">shopping_cart</span>
                    <h3 class="text-lg font-bold text-primary font-headline-lg">RFQ Sourcing List</h3>
                </div>
                <button onclick="toggleCartDrawer()" class="text-slate-400 hover:text-slate-600 focus:outline-none">
                    <span class="material-symbols-outlined text-2xl">close</span>
                </button>
            </div>
            <div id="cart-items-container" class="flex-grow p-6 overflow-y-auto flex flex-col gap-4"></div>
            <div class="p-6 border-t border-outline-variant bg-surface-container-low">
                <form id="rfq-form" onsubmit="submitRFQRequest(event)" class="flex flex-col gap-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1" for="rfq-email">Business Email *</label>
                        <input id="rfq-email" type="email" required placeholder="name@company.com" class="w-full text-sm border border-outline-variant rounded p-2 focus:ring-secondary focus:border-secondary">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1" for="rfq-company">Company Name *</label>
                        <input id="rfq-company" type="text" required placeholder="E.g., Labs Inc." class="w-full text-sm border border-outline-variant rounded p-2 focus:ring-secondary focus:border-secondary">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1" for="rfq-message">Additional Requirements (Lot / Purity / Delivery Timeline)</label>
                        <textarea id="rfq-message" rows="2" placeholder="E.g., Target purity >99.0%, need MSDS documents." class="w-full text-sm border border-outline-variant rounded p-2 focus:ring-secondary focus:border-secondary"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-scientific-orange hover:bg-orange-600 text-white font-bold py-2.5 rounded text-sm transition shadow-sm mt-2">Submit Sourcing Request</button>
                </form>
            </div>
        `;
        document.body.appendChild(drawer);
    }
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
        setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
        renderCartItems();
    } else {
        drawer.classList.add('translate-x-full');
        setTimeout(() => drawer.classList.add('hidden'), 300);
    }
}

function addToCart(productId, productName, casNumber, category) {
    const exists = rfqCart.some(item => item.id === productId);
    if (!exists) {
        rfqCart.push({ id: productId, name: productName, cas: casNumber, category, quantity: 1, unit: 'mg' });
        localStorage.setItem('vivaquest_rfq_cart', JSON.stringify(rfqCart));
        updateCartCount();
        showNotification(`${productName} added to RFQ sourcing list.`);
        setTimeout(toggleCartDrawer, 400);
    } else {
        showNotification('Item is already in your RFQ list.', 'warning');
        setTimeout(toggleCartDrawer, 100);
    }
}

function updateCartCount() {
    const counter = document.getElementById('cart-counter');
    if (counter) counter.innerText = rfqCart.length;
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    if (rfqCart.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                <span class="material-symbols-outlined text-5xl mb-3">snooze</span>
                <p class="text-sm font-semibold">Your RFQ Sourcing List is empty.</p>
                <p class="text-xs text-center mt-1">Browse catalog pages and click 'Add to RFQ' to build your list.</p>
            </div>
        `;
        return;
    }
    let html = '';
    rfqCart.forEach((item, idx) => {
        html += `
            <div class="bg-surface-container-low border border-outline-variant rounded p-4 relative flex flex-col gap-2 shadow-sm">
                <button onclick="removeFromCart(${idx})" class="absolute top-3 right-3 text-slate-400 hover:text-red-500 focus:outline-none" aria-label="Remove item">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
                <div class="pr-6">
                    <span class="text-[10px] font-bold text-secondary uppercase tracking-widest block font-label-data">${item.category}</span>
                    <span class="text-sm font-bold text-primary block leading-tight mt-1">${item.name}</span>
                    <span class="text-xs font-label-data text-slate-500 mt-1 block">CAS: ${item.cas}</span>
                </div>
                <div class="flex gap-2 items-center mt-2 border-t border-outline-variant/60 pt-3">
                    <span class="text-xs text-slate-500 font-semibold">Qty:</span>
                    <input type="number" min="1" value="${item.quantity}" onchange="updateQty(${idx}, this.value)" class="w-16 text-xs border border-outline-variant rounded p-1 text-center">
                    <select onchange="updateUnit(${idx}, this.value)" class="text-xs border border-outline-variant rounded p-1 bg-white">
                        <option value="mg" ${item.unit === 'mg' ? 'selected' : ''}>mg</option>
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="Bulk Pack" ${item.unit === 'Bulk Pack' ? 'selected' : ''}>Bulk Pack</option>
                    </select>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function removeFromCart(idx) {
    rfqCart.splice(idx, 1);
    localStorage.setItem('vivaquest_rfq_cart', JSON.stringify(rfqCart));
    updateCartCount();
    renderCartItems();
    showNotification('Item removed from RFQ list.');
}

function updateQty(idx, val) {
    rfqCart[idx].quantity = Math.max(1, parseInt(val) || 1);
    localStorage.setItem('vivaquest_rfq_cart', JSON.stringify(rfqCart));
}

function updateUnit(idx, val) {
    rfqCart[idx].unit = val;
    localStorage.setItem('vivaquest_rfq_cart', JSON.stringify(rfqCart));
}

const WEB3FORMS_KEY = '1d415264-7893-4cf1-aedd-3c9bfe0838ef';

async function submitRFQRequest(e) {
    e.preventDefault();
    console.log('RFQ form submitted');
    const email = document.getElementById('rfq-email').value;
    const company = document.getElementById('rfq-company').value;
    const message = document.getElementById('rfq-message').value;
    console.log('Fields:', { email, company, message, cartSize: rfqCart.length });
    if (rfqCart.length === 0) {
        showNotification('Add items to request quote.', 'error');
        return;
    }

    const itemsList = rfqCart.map(i => `${i.id} - ${i.name} (CAS: ${i.cas}) - Qty: ${i.quantity} ${i.unit}`).join('\n');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const cartSnapshot = [...rfqCart];

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_key: WEB3FORMS_KEY,
                subject: `RFQ from ${company} - ${rfqCart.length} item(s)`,
                from_name: company,
                email: email,
                company: company,
                message: `Requirements: ${message}\n\nItems:\n${itemsList}`
            })
        });
        const result = await response.json();

        if (result.success) {
            rfqCart = [];
            localStorage.setItem('vivaquest_rfq_cart', JSON.stringify([]));
            updateCartCount();
            toggleCartDrawer();
            showRFQSuccessModal(email);
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (err) {
        console.error('Web3Forms error:', err);
        rfqCart = [];
        localStorage.setItem('vivaquest_rfq_cart', JSON.stringify([]));
        updateCartCount();
        toggleCartDrawer();
        showRFQFallbackModal(email, company, message, cartSnapshot);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Sourcing Request';
    }
}

function showRFQSuccessModal(email) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full p-8 border border-outline-variant text-center shadow-2xl flex flex-col items-center">
            <span class="material-symbols-outlined text-6xl text-secondary mb-4">check_circle</span>
            <h3 class="text-xl font-bold text-primary font-headline-lg">RFQ Submitted Successfully!</h3>
            <p class="text-slate-600 text-sm mt-3 leading-relaxed">Thank you for contacting Viva Quest Private Limited. Sourcing Request ID <strong>VQ-RFQ-${Math.floor(100000 + Math.random() * 900000)}</strong> has been registered.</p>
            <p class="text-slate-500 text-xs mt-2">A structured technical quote and availability timeline will be dispatched to <strong>${email}</strong> within 12 business hours.</p>
            <button onclick="closeConfirmationModal(this)" class="mt-6 bg-primary hover:bg-slate-800 text-white font-bold px-8 py-2.5 rounded text-sm transition">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showRFQFallbackModal(email, company, message, cartItems) {
    const itemsList = cartItems.map(i => `${i.id} - ${i.name} (CAS: ${i.cas}) - Qty: ${i.quantity} ${i.unit}`).join('%0A');
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full p-8 border border-outline-variant text-center shadow-2xl flex flex-col items-center">
            <span class="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
            <h3 class="text-xl font-bold text-primary font-headline-lg">Form Submission Failed</h3>
            <p class="text-slate-600 text-sm mt-3 leading-relaxed">
                We could not send your RFQ through our automated system. Please email us directly at:
            </p>
            <a href="mailto:info@vivaquest.co.in?subject=RFQ%20-%20${encodeURIComponent(company)}&body=Company:%20${encodeURIComponent(company)}%0AEmail:%20${encodeURIComponent(email)}%0ARequirements:%20${encodeURIComponent(message)}%0A%0AItems:%0A${itemsList}" class="mt-4 text-lg font-bold text-secondary font-label-data underline hover:text-primary transition">info@vivaquest.co.in</a>
            <p class="text-slate-500 text-xs mt-4">
                Click the email above and we will respond within 12 business hours.
            </p>
            <button onclick="closeConfirmationModal(this)" class="mt-6 bg-primary hover:bg-slate-800 text-white font-bold px-8 py-2.5 rounded text-sm transition">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeConfirmationModal(btn) {
    btn.closest('.fixed').remove();
}

function showNotification(msg, type = 'success') {
    const oldNotify = document.getElementById('viva-toast');
    if (oldNotify) oldNotify.remove();
    const colors = {
        success: 'bg-primary border-secondary text-white',
        warning: 'bg-orange-50 border-scientific-orange text-primary',
        error: 'bg-red-50 border-red-500 text-primary'
    };
    const notification = document.createElement('div');
    notification.id = 'viva-toast';
    notification.className = `fixed bottom-24 right-6 border p-4 rounded shadow-lg z-50 transition-all duration-300 max-w-sm flex items-center gap-3 font-semibold text-xs ${colors[type]}`;
    const icon = type === 'success' ? 'check_circle' : (type === 'warning' ? 'warning' : 'error');
    notification.innerHTML = `<span class="material-symbols-outlined text-lg ${type === 'success' ? 'text-secondary' : ''}">${icon}</span><span>${msg}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// ---- Catalog Data Loading ----

async function initializeCatalogSearch(catalogKey) {
    const config = catalogConfig[catalogKey];
    if (!config) return;
    const loader = document.getElementById('catalog-loader');
    try {
        if (loader) loader.classList.remove('hidden');
        const response = await fetch(`assets/data/${config.file}`);
        if (!response.ok) throw new Error('Failed to load catalog data');
        currentDataset = await response.json();
        console.log(`Loaded ${currentDataset.length} rows for ${config.title}`);
        if (loader) loader.classList.add('hidden');
        filteredRows = [...currentDataset];
        currentPage = 1;
        const urlParams = new URLSearchParams(window.location.search);
        const urlQuery = urlParams.get('q');
        const searchInput = document.getElementById('catalog-search-input');
        if (urlQuery && searchInput) {
            searchInput.value = urlQuery;
            filterAndDisplay(urlQuery, catalogKey);
        } else {
            renderPage(catalogKey);
        }
    } catch (err) {
        console.error("Error loading catalog: ", err);
        if (loader) {
            loader.innerHTML = `
                <span class="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <p class="text-sm font-semibold text-primary">Failed to load chemical database</p>
                <p class="text-xs text-slate-500 mt-1">Please try refreshing the page or contact support.</p>
            `;
        }
    }
}

function filterAndDisplay(query, catalogKey) {
    currentPage = 1;
    if (!query) {
        filteredRows = [...currentDataset];
    } else {
        const q = query.toLowerCase().trim();
        filteredRows = currentDataset.filter(row => {
            return (
                (row["Product Name"] && row["Product Name"].toLowerCase().includes(q)) ||
                (row["CAS Number"] && row["CAS Number"].toLowerCase().includes(q)) ||
                (row["Molecular Formula"] && row["Molecular Formula"].toLowerCase().includes(q)) ||
                (row["Product ID"] && row["Product ID"].toLowerCase().includes(q))
            );
        });
    }
    renderPage(catalogKey);
}

// ---- Pagination ----

function renderPage(catalogKey) {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageRows = filteredRows.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    displayRows(pageRows, catalogKey);
    renderPagination(totalPages, catalogKey);
}

function renderPagination(totalPages, catalogKey) {
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    if (filteredRows.length <= ITEMS_PER_PAGE) {
        container.innerHTML = '';
        return;
    }

    const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length);

    let html = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-4 text-xs text-slate-500">
            <span class="font-label-data">Showing ${startRecord}–${endRecord} of ${filteredRows.length}</span>
            <div class="flex items-center gap-2">
                <button onclick="goToPage(${currentPage - 1}, '${catalogKey}')" class="flex items-center gap-1 px-3 py-1.5 rounded border border-outline-variant bg-white hover:bg-slate-50 transition font-semibold text-slate-600 ${currentPage <= 1 ? 'opacity-40 pointer-events-none' : ''}">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                    <span class="hidden sm:inline">Previous</span>
                </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span class="px-3 py-1.5 rounded bg-secondary text-white font-bold text-xs">${i}</span>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            html += `<button onclick="goToPage(${i}, '${catalogKey}')" class="px-3 py-1.5 rounded border border-outline-variant bg-white hover:bg-slate-50 transition font-semibold text-slate-600">${i}</button>`;
        } else if (Math.abs(i - currentPage) === 3) {
            html += `<span class="px-1 text-slate-400">...</span>`;
        }
    }

    html += `
                <button onclick="goToPage(${currentPage + 1}, '${catalogKey}')" class="flex items-center gap-1 px-3 py-1.5 rounded border border-outline-variant bg-white hover:bg-slate-50 transition font-semibold text-slate-600 ${currentPage >= totalPages ? 'opacity-40 pointer-events-none' : ''}">
                    <span class="hidden sm:inline">Next</span>
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function goToPage(page, catalogKey) {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage(catalogKey);
    document.getElementById('catalog-table-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Table Rendering ----

function displayRows(rows, catalogKey) {
    const tableBody = document.getElementById('catalog-table-body');
    const recordsCount = document.getElementById('records-count');
    if (!tableBody) return;

    if (recordsCount) {
        recordsCount.innerText = `${rows.length} product${rows.length === 1 ? '' : 's'} found`;
    }

    if (rows.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12 text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                    <p class="text-sm font-semibold">No chemical compounds matched your criteria.</p>
                    <p class="text-xs mt-1">Try searching by CAS Number, molecular formula, or product name.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    rows.forEach(row => {
        const prodId = row["Product ID"] || "VQ-N/A";
        const prodName = row["Product Name"] || "N/A";
        const casNo = row["CAS Number"] || "N/A";
        const availability = row["Availability"] || "Inquire";
        const purity = row["Purity"] || row["Purity Standard"] || "USP/In-House";
        const formula = row["Molecular Formula"] || "N/A";
        const weight = row["Molecular Weight"] || "N/A";
        const centerCols = `
            <td class="px-6 py-4 text-xs font-semibold text-slate-700 font-label-data">${formula}</td>
            <td class="px-6 py-4 text-xs text-slate-500 font-label-data">${weight}</td>
        `;
        const safeName = prodName.replace(/'/g, "\\'");
        html += `
            <tr class="hover:bg-[#F0FDFA] border-b border-outline-variant/60 transition duration-150">
                <td class="px-6 py-4 text-xs font-semibold text-primary font-label-data">${prodId}</td>
                <td class="px-6 py-4 text-sm font-bold text-primary">${prodName}</td>
                <td class="px-6 py-4 text-xs font-semibold font-label-data text-secondary select-all">${casNo}</td>
                ${centerCols}
                <td class="px-6 py-4 text-xs text-center">
                    <span class="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase font-label-data">${purity}</span>
                </td>
                <td class="px-6 py-4 text-xs text-center">
                    <span class="inline-flex items-center gap-1 font-bold ${availability.includes('Stock') ? 'text-green-600' : 'text-orange-500'}">
                        <span class="h-1.5 w-1.5 rounded-full ${availability.includes('Stock') ? 'bg-green-600' : 'bg-orange-500'}"></span>
                        ${availability}
                    </span>
                </td>
                <td class="px-6 py-4 text-xs text-right">
                    <button onclick="addToCart('${prodId}', '${safeName}', '${casNo}', '${catalogConfig[catalogKey].title}')" class="bg-scientific-orange hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded transition shadow-sm text-[11px] whitespace-nowrap">Add to RFQ</button>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}
