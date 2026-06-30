// Toggle Sidebar Mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 992) {
        if (!sidebar.contains(e.target) && !e.target.closest('[onclick*="toggleSidebar"]')) {
            sidebar.classList.remove('show');
        }
    }
});

// Utility: Format Number
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Utility: Get Current Date
function getCurrentDate() {
    return new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Check Login Status
function checkLogin() {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
        window.location.href = 'login.html';
    }
}