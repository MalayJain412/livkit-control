// Shared layout bootstrap: injects base.html sidebar + shell and then
// moves the page-specific template into #main-content.

async function bootstrapLayout() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) return;

    try {
        if (window.APP_CONFIG && window.APP_CONFIG.ready) {
            await window.APP_CONFIG.ready;
        }

        const baseUrl = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
            ? window.APP_CONFIG.frontendUrl('/base.html')
            : '/base.html';

        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error('Failed to load layout');
        const layoutHtml = await response.text();
        appRoot.innerHTML = layoutHtml;

        if (window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function') {
            appRoot.querySelectorAll('a[href^="/"]').forEach(link => {
                const path = link.getAttribute('href');
                if (path) {
                    link.setAttribute('href', window.APP_CONFIG.frontendUrl(path));
                }
            });
        }

        const template = document.getElementById('page-content-template');
        const main = document.getElementById('main-content');
        if (template && main) {
            main.innerHTML = template.innerHTML;
        }

        // Highlight active nav based on body data attribute
        const activeNav = document.body.dataset.activeNav;
        if (activeNav) {
            const navItems = document.querySelectorAll('#main-sidebar .nav-item[data-nav]');
            navItems.forEach(item => {
                const nav = item.getAttribute('data-nav');
                item.classList.remove('nav-item-active', 'bg-blue-50', 'border-l-4', 'border-blue-500', 'text-gray-900');
                if (nav === activeNav) {
                    item.classList.add('nav-item-active', 'bg-blue-50', 'border-l-4', 'border-blue-500', 'text-gray-900', 'font-medium');
                }
            });
        }

        // Sidebar toggle logic (desktop + mobile)
        const sidebar = document.getElementById('main-sidebar');
        const mainContent = document.getElementById('main-content');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const mobileMenuOpen = document.getElementById('mobile-menu-open');
        const overlay = document.getElementById('sidebar-overlay');

        const handleToggle = () => {
            if (!sidebar || !mainContent) return;
            if (window.innerWidth < 768) {
                const isOpen = sidebar.classList.toggle('mobile-open');
                overlay && overlay.classList.toggle('hidden', !isOpen);
                document.body.classList.toggle('overflow-hidden', isOpen);
            } else {
                const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
                mainContent.style.marginLeft = isCollapsed ? '80px' : '288px';
            }
        };

        sidebarToggle && sidebarToggle.addEventListener('click', handleToggle);
        mobileMenuOpen && mobileMenuOpen.addEventListener('click', () => {
            if (!sidebar || !overlay) return;
            sidebar.classList.add('mobile-open');
            overlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        });
        overlay && overlay.addEventListener('click', () => {
            if (!sidebar || !overlay) return;
            sidebar.classList.remove('mobile-open');
            overlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });

        window.addEventListener('resize', () => {
            if (!sidebar || !mainContent) return;
            if (window.innerWidth < 768) {
                mainContent.style.marginLeft = '0';
                sidebar.classList.remove('sidebar-collapsed');
            } else {
                const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
                mainContent.style.marginLeft = isCollapsed ? '80px' : '288px';
                sidebar.classList.remove('mobile-open');
                overlay && overlay.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            }
        });

        // Notify page scripts that layout is ready
        window.dispatchEvent(new CustomEvent('layout:ready', { detail: { main } }));
    } catch (error) {
        console.error('Layout bootstrap error:', error);
    }
}

document.addEventListener('DOMContentLoaded', bootstrapLayout);
