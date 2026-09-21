/**
 * User-side JavaScript
 * Handles user interactions for card redemption
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================
    // 1. CARD REDEMPTION CONFIRMATION
    // ============================================
    
    function setupRedeemConfirmation() {
        const redeemForms = document.querySelectorAll('form[action*="redeem-card"]');
        
        redeemForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const cardAmount = this.querySelector('button[type="submit"]')?.getAttribute('data-amount') || 'this card';
                if (!confirm(`Are you sure you want to redeem ${cardAmount}? This will deduct points from your account.`)) {
                    e.preventDefault();
                }
            });
        });
    }

    // ============================================
    // 2. POINTS ANIMATION
    // ============================================
    
    function setupPointsAnimation() {
        const pointsElement = document.querySelector('.points-display');
        if (pointsElement) {
            const finalPoints = parseInt(pointsElement.dataset.points || 0);
            animatePoints(finalPoints);
        }
    }

    function animatePoints(targetPoints) {
        const pointsElement = document.querySelector('.points-display');
        if (!pointsElement) return;
        
        let currentPoints = 0;
        const duration = 1000;
        const steps = 60;
        const increment = targetPoints / steps;
        let step = 0;
        
        const interval = setInterval(() => {
            step++;
            currentPoints = Math.min(Math.round(increment * step), targetPoints);
            pointsElement.textContent = currentPoints.toLocaleString();
            
            if (step >= steps) {
                clearInterval(interval);
                pointsElement.textContent = targetPoints.toLocaleString();
                
                // Add bounce animation
                pointsElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    pointsElement.style.transform = 'scale(1)';
                }, 200);
            }
        }, duration / steps);
    }

    // ============================================
    // 3. CARD FILTERING
    // ============================================
    
    function setupCardFiltering() {
        const filterSelect = document.getElementById('filterCards');
        const cardElements = document.querySelectorAll('.card-available');
        
        if (filterSelect) {
            filterSelect.addEventListener('change', function() {
                const filter = this.value;
                
                cardElements.forEach(card => {
                    let show = true;
                    
                    switch(filter) {
                        case 'all':
                            show = true;
                            break;
                        case 'available':
                            show = !card.querySelector('.redeemed-badge');
                            break;
                        case 'redeemed':
                            show = !!card.querySelector('.redeemed-badge');
                            break;
                        case 'low-points':
                            const points = parseInt(card.querySelector('.points-badge')?.textContent || '0');
                            show = points <= 100;
                            break;
                    }
                    
                    card.style.display = show ? 'block' : 'none';
                });
            });
        }
    }

    // ============================================
    // 4. CARD SEARCH
    // ============================================
    
    function setupCardSearch() {
        const searchInput = document.getElementById('searchCards');
        const cardElements = document.querySelectorAll('.card-available');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                
                cardElements.forEach(card => {
                    const cardText = card.textContent.toLowerCase();
                    const matches = searchTerm === '' || cardText.includes(searchTerm);
                    card.style.display = matches ? 'block' : 'none';
                });
            });
        }
    }

    // ============================================
    // 5. REDEMPTION COUNTDOWN
    // ============================================
    
    function setupRedemptionCountdown() {
        const countdownElements = document.querySelectorAll('[data-countdown]');
        
        countdownElements.forEach(element => {
            const expiryDate = new Date(element.dataset.countdown);
            
            function updateCountdown() {
                const now = new Date();
                const diff = expiryDate - now;
                
                if (diff <= 0) {
                    element.textContent = 'Expired';
                    element.classList.add('text-danger');
                    return;
                }
                
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                let display = '';
                if (days > 0) display += `${days}d `;
                if (hours > 0 || days > 0) display += `${hours}h `;
                display += `${minutes}m`;
                
                element.textContent = display;
            }
            
            updateCountdown();
            setInterval(updateCountdown, 60000);
        });
    }

    // ============================================
    // 6. PROGRESS BAR ANIMATION
    // ============================================
    
    function setupProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');
        
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.width = width;
                bar.style.transition = 'width 1s ease-in-out';
            }, 100);
        });
    }

    // ============================================
    // 7. CARD FLIP ANIMATION
    // ============================================
    
    function setupCardFlip() {
        const cards = document.querySelectorAll('.card-flip');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('flipped');
            });
            
            card.addEventListener('mouseleave', function() {
                this.classList.remove('flipped');
            });
        });
    }

    // ============================================
    // 8. NOTIFICATION BELL
    // ============================================
    
    function setupNotificationBell() {
        const bell = document.getElementById('notificationBell');
        if (!bell) return;
        
        // Check for new notifications
        checkNotifications();
        
        // Periodically check for new notifications
        setInterval(checkNotifications, 30000);
    }

    function checkNotifications() {
        fetch('/user/notifications/check')
            .then(response => response.json())
            .then(data => {
                const bell = document.getElementById('notificationBell');
                if (data.hasNew) {
                    bell.classList.add('has-notification');
                    bell.innerHTML = `<i class="fas fa-bell"></i><span class="badge badge-danger">${data.count}</span>`;
                }
            })
            .catch(err => console.error('Error checking notifications:', err));
    }

    // ============================================
    // 9. RECENT REDEMPTIONS FEED
    // ============================================
    
    function setupRecentRedemptions() {
        const feedContainer = document.getElementById('recentRedemptions');
        if (!feedContainer) return;
        
        // Fetch recent redemptions
        fetch('/user/recent-redemptions')
            .then(response => response.json())
            .then(data => {
                if (data.redemptions && data.redemptions.length > 0) {
                    data.redemptions.forEach(redemption => {
                        const item = document.createElement('div');
                        item.className = 'feed-item';
                        item.innerHTML =`
                            <div class="d-flex align-items-center">
                                <div class="feed-icon bg-primary">
                                    <i class="fas fa-gift"></i>
                                </div>
                                <div class="ms-3">
                                    <strong>${redemption.cardAmount}</strong> redeemed
                                    <div class="text-muted small">${formatRelativeTime(redemption.redeemedAt)}</div>
                                </div>
                            </div>`
                        ;
                        feedContainer.appendChild(item);
                    });
                } else {
                    feedContainer.innerHTML = '<p class="text-muted text-center">No recent redemptions</p>';
                }
            })
            .catch(err => {
                console.error('Error fetching recent redemptions:', err);
                feedContainer.innerHTML = '<p class="text-muted text-center">Failed to load recent activity</p>';
            });
    }

    function formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    // ============================================
    // 10. INITIALIZE ALL FUNCTIONS
    // ============================================
    
    function init() {
        setupRedeemConfirmation();
        setupPointsAnimation();
        setupCardFiltering();
        setupCardSearch();
        setupRedemptionCountdown();
        setupProgressBars();
        setupCardFlip();
        setupNotificationBell();
        setupRecentRedemptions();
        
        console.log('User panel initialized successfully');
    }

    // Run initialization
    init();
});
