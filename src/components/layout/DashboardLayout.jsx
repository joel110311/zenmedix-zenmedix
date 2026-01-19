import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0D10] transition-colors duration-200">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <Topbar
                sidebarCollapsed={sidebarCollapsed}
                onMenuClick={() => setMobileMenuOpen(true)}
            />
            <main className={`
        pt-16 min-h-screen transition-all duration-200 ease-in-out
        md:${sidebarCollapsed ? 'pl-16' : 'pl-64'}
        pl-0
      `}>
                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet context={{ sidebarCollapsed }} />
                </div>
            </main>
        </div>
    );
};
