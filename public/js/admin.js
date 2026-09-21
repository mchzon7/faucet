 /**
 * Admin Panel JavaScript
 * Handles all admin-side interactions for credit card management
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================
    // 1. DELETE CARD FUNCTIONALITY
    // ============================================
    
    // Setup delete card functionality
    function setupDeleteCard() {
        const deleteButtons = document.querySelectorAll('.delete-card');
        const deleteModal = document.getElementById('deleteModal');
        const deleteForm = document.getElementById('deleteForm');
        
        if (deleteButtons.length > 0 && deleteModal && deleteForm) {
            deleteButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    const cardId = this.getAttribute('data-id');
                    if (cardId) {
                        // Set the form action
                        deleteForm.action = `/admin/card/${cardId}/delete`;
                        // Show the modal
                        const modal = new bootstrap.Modal(deleteModal);
                        modal.show();
                    }
                });
            });
        }
    }

    // ============================================
    // 2. CARD PREVIEW UPDATE (Create/Edit Pages)
    // ============================================
    
    function setupCardPreview() {
        const amountInput = document.getElementById('amount');
        const displayAmountInput = document.getElementById('displayAmount');
        const previewAmount = document.getElementById('previewAmount');
        
        if (amountInput && previewAmount) {
            function updatePreview() {
                const amount = amountInput.value || '0';
                const display = displayAmountInput ? displayAmountInput.value : `$${parseFloat(amount).toFixed(2)}`;
                previewAmount.textContent = display || `$${parseFloat(amount).toFixed(2)}`;
            }
            
            amountInput.addEventListener('input', updatePreview);
            if (displayAmountInput) {
                displayAmountInput.addEventListener('input', updatePreview);
            }
            
            // Initial update
            updatePreview();
        }
    }

    // ============================================
    // 3. FORM VALIDATION (Create/Edit Pages)
    // ============================================
    
    function setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                let isValid = true;
                const errors = [];
                
                // Validate amount field
                const amountField = this.querySelector('#amount');
                if (amountField) {
                    const amount = parseFloat(amountField.value);
                    if (isNaN(amount) || amount < 1) {
                        isValid = false;
                        errors.push('Amount must be at least 1');
                        amountField.classList.add('is-invalid');
                    } else {
                        amountField.classList.remove('is-invalid');
                    }
                }
                
                // Validate total redemptions field
                const redemptionsField = this.querySelector('#totalRedemptions');
                if (redemptionsField) {
                    const redemptions = parseInt(redemptionsField.value);
                    if (isNaN(redemptions) || redemptions < 1) {
                        isValid = false;
                        errors.push('Total redemptions must be at least 1');
                        redemptionsField.classList.add('is-invalid');
                    } else {
                        redemptionsField.classList.remove('is-invalid');
                    }
                }
                
                // Validate points required field
                const pointsField = this.querySelector('#pointsRequired');
                if (pointsField) {
                    const points = parseInt(pointsField.value);
                    if (isNaN(points) || points < 0) {
                        isValid = false;
                        errors.push('Points required must be 0 or greater');
                        pointsField.classList.add('is-invalid');
                    } else {
                        pointsField.classList.remove('is-invalid');
                    }
                }
                
                // If invalid, prevent submission and show errors
                if (!isValid) {
                    e.preventDefault();
                    showValidationErrors(errors);
                }
            });
        });
    }

    // ============================================
    // 4. SHOW VALIDATION ERRORS
    // ============================================
    
    function showValidationErrors(errors) {
        // Remove any existing error alerts
        const existingAlert = document.querySelector('.validation-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger validation-alert';
        alertDiv.innerHTML =`
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Validation Errors:</strong>
            <ul class="mb-0 mt-2">
                ${errors.map(error => <li>${error}</li>).join('')}
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of form
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(alertDiv, form.firstChild);
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // ============================================
    // 5. AUTO-DISMISS ALERTS
    // ============================================
    
    function setupAlertAutoDismiss() {
        const alerts = document.querySelectorAll('.alert:not(.validation-alert)');
        alerts.forEach(alert => {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.classList.add('fade');
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.remove();
                        }
                    }, 500);
                }
            }, 5000);
        });
    }

    // ============================================
    // 6. SEARCH AND FILTER AUTO-SUBMIT
    // ============================================
    
    function setupSearchFilter() {
        const searchForm = document.querySelector('.search-form');
        const statusSelect = document.querySelector('select[name="status"]');
        const searchInput = document.querySelector('input[name="search"]');
        
        if (searchForm && statusSelect) {
            // Auto-submit on status change
            statusSelect.addEventListener('change', function() {
                searchForm.submit();
            });
            
            // Auto-submit on search with debounce
            if (searchInput) {
                let debounceTimer;
                searchInput.addEventListener('input', function() {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        searchForm.submit();
                    }, 500);
                });
            }
        }
    }
// ============================================
    // 7. STATISTICS CHARTS (if Chart.js is loaded)
    // ============================================
    
    function setupCharts() {
        if (typeof Chart !== 'undefined') {
            // Cards status chart
            const ctxStatus = document.getElementById('statusChart');
            if (ctxStatus) {
                const activeCards = parseInt(ctxStatus.dataset.active || 0);
                const inactiveCards = parseInt(ctxStatus.dataset.inactive || 0);
                const expiredCards = parseInt(ctxStatus.dataset.expired || 0);
                
                new Chart(ctxStatus, {
                    type: 'doughnut',
                    data: {
                        labels: ['Active', 'Inactive', 'Expired'],
                        datasets: [{
                            data: [activeCards, inactiveCards, expiredCards],
                            backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
            
            // Redemption trends chart
            const ctxTrends = document.getElementById('trendsChart');
            if (ctxTrends) {
                const labels = JSON.parse(ctxTrends.dataset.labels || '[]');
                const data = JSON.parse(ctxTrends.dataset.data || '[]');
                
                new Chart(ctxTrends, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Redemptions',
                            data: data,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    }

    // ============================================
    // 8. COPY TO CLIPBOARD
    // ============================================
    
    function setupCopyToClipboard() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const textToCopy = this.getAttribute('data-copy');
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        // Show success feedback
                        const originalText = this.innerHTML;
                        this.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
                        this.classList.add('btn-success');
                        this.classList.remove('btn-outline-secondary');
                        
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.classList.remove('btn-success');
                            this.classList.add('btn-outline-secondary');
                         }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy: ', err);
                        // Fallback method
                        const input = document.createElement('input');
                        input.value = textToCopy;
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand('copy');
                        document.body.removeChild(input);
                    });
                }
            });
        });
    }

    // ============================================
    // 9. TABLE SORTING
    // ============================================
    
    function setupTableSorting() {
        const tables = document.querySelectorAll('.sortable-table');
        
        tables.forEach(table => {
            const headers = table.querySelectorAll('th[data-sort]');
            
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    const sortKey = this.getAttribute('data-sort');
                    const currentSort = this.getAttribute('data-sort-order') || 'asc';
                    const newSort = currentSort === 'asc' ? 'desc' : 'asc';
                    
                    // Update sort indicators
                    headers.forEach(h => {
                        h.removeAttribute('data-sort-order');
                        h.innerHTML = h.innerHTML.replace(' ▲', '').replace(' ▼', '');
                    });
                    
                    this.setAttribute('data-sort-order', newSort);
                    this.innerHTML += newSort === 'asc' ? ' ▲' : ' ▼';
                    
                    // Sort the table
                    sortTable(table, sortKey, newSort);
                });
            });
        });
    }

    function sortTable(table, key, order) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aVal = a.getAttribute(`data-${key}`) || '';
            let bVal = b.getAttribute(`data-${key}`) || '';
            
            // Try to parse as number
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return order === 'asc' ? aNum - bNum : bNum - aNum;
            }
            
            return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        
        rows.forEach(row => tbody.appendChild(row));
    }

    // ============================================
    // 10. BULK ACTIONS
    // ============================================
    
    function setupBulkActions() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        const bulkActions = document.getElementById('bulkActions');
        
        if (selectAllCheckbox && itemCheckboxes.length > 0) {
            selectAllCheckbox.addEventListener('change', function() {
                itemCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateBulkActions();
            });
            
            itemCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', updateBulkActions);
            });
        }
    }

    function updateBulkActions() {
        const checked = document.querySelectorAll('.item-checkbox:checked');
        const bulkActions = document.getElementById('bulkActions');
        
        if (bulkActions) {
        if (checked.length > 0) {
                bulkActions.style.display = 'block';
                const count = document.getElementById('selectedCount');
                if (count) {
                    count.textContent = checked.length;
                }
            } else {
                bulkActions.style.display = 'none';
            }
        }
    }

    // ============================================
    // 11. TOOLTIP INITIALIZATION
    // ============================================
    
    function setupTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // ============================================
    // 12. CONFIRMATION DIALOGS
    // ============================================
    
    function setupConfirmDialogs() {
        const confirmButtons = document.querySelectorAll('[data-confirm]');
        
        confirmButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                const message = this.getAttribute('data-confirm') || 'Are you sure you want to proceed?';
                if (!confirm(message)) {
                    e.preventDefault();
                }
            });
        });
    }

    // ============================================
    // 13. LOADING STATE ON FORM SUBMIT
    // ============================================
    
    function setupFormLoading() {
        const forms = document.querySelectorAll('form[data-loading]');
        
        forms.forEach(form => {
            form.addEventListener('submit', function() {
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                    submitBtn.disabled = true;
                    
                    // Store original text for later (if needed)
                    submitBtn.setAttribute('data-original-text', originalText);
                }
            });
        });
    }

    // ============================================
    // 14. RESPONSIVE TABLE HANDLING
    // ============================================
    
    function setupResponsiveTables() {
        const tables = document.querySelectorAll('.table-responsive');
        
        tables.forEach(table => {
            // Add horizontal scroll indicator if table overflows
            if (table.scrollWidth > table.clientWidth) {
                table.classList.add('scrollable');
                const indicator = document.createElement('div');
                indicator.className = 'scroll-indicator';
                indicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
                table.parentNode.appendChild(indicator);
            }
        });
    }

    // ============================================
    // 15. KEYBOARD SHORTCUTS
    // ============================================
    
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl + S to save form
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                const form = document.querySelector('form');
                if (form) {
                    e.preventDefault();
                    form.submit();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal.show');
                if (modals.length > 0) {
                    const modal = bootstrap.Modal.getInstance(modals[0]);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
        });
    }
// ============================================
    // 16. NOTIFICATION TOASTS
    // ============================================
    
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML =`
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;
        
        toastContainer.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
        
        // Remove after hidden
        toastEl.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }

    // ============================================
    // INITIALIZE ALL FUNCTIONS
    // ============================================
    
    // Initialize all functionality
    function init() {
        setupDeleteCard();
        setupCardPreview();
        setupFormValidation();
        setupAlertAutoDismiss();
        setupSearchFilter();
        setupCharts();
        setupCopyToClipboard();
        setupTableSorting();
        setupBulkActions();
        setupTooltips();
        setupConfirmDialogs();
        setupFormLoading();
        setupResponsiveTables();
        setupKeyboardShortcuts();
        
        console.log('Admin panel initialized successfully');
    }

    // Run initialization
    init();

    // ============================================
    // EXPOSE GLOBAL FUNCTIONS FOR INLINE USE
    // ============================================
    
    window.admin = {
        showToast: showToast,
        reloadCards: function() {
            window.location.reload();
        },
        exportData: function(format = 'csv') {
            // Generic export function
            const table = document.querySelector('.table');
            if (!table) return;
            
            // Export logic here
            console.log(`Exporting data in ${format} format`);
        }
    };

    // ============================================
    // HANDLE AJAX ERRORS
    // ============================================
    
    // Global error handler for AJAX requests
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showToast('An error occurred. Please try again.', 'danger');
    });

    // Network error handler
    window.addEventListener('online', function() {
        showToast('Back online!', 'success');
    });
    
    window.addEventListener('offline', function() {
        showToast('You are offline. Please check your connection.', 'danger');
    });

});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

/**
 * Truncate text
 */
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}
 /**
 * Generate random color
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Export utilities for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        truncateText,
        getRandomColor
    };
}
