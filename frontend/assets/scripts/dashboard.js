// Dashboard page initialization

window.addEventListener('layout:ready', () => {
    try {
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    } catch (error) {
        console.error('Dashboard init error:', error);
    }
});
