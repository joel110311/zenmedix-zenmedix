import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, ChevronLeft, ChevronRight, X, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
    const location = useLocation();
    const { user } = useAuth();

    // Role constants - match PocketBase schema
    const ROLES = {
        SUPER_ADMIN: 'superadmin',
        MEDICO: 'medico',
        RECEPCION: 'recepcion'
    };

    // Menu items with role restrictions
    const allMenuItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
        { label: 'Pacientes', path: '/pacientes', icon: Users, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
        { label: 'Gestión de Citas', path: '/citas', icon: Calendar, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO, ROLES.RECEPCION] },
        { label: 'Auditoría', path: '/auditoria', icon: Activity, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
        { label: 'Configuración', path: '/configuracion', icon: Settings, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
    ];

    // Filter menu items based on user role (show all if no role or unknown role)
    const menuItems = user?.role
        ? allMenuItems.filter(item => item.allowedRoles.includes(user.role))
        : allMenuItems; // Show all menus if role is undefined (for development)

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onMobileClose}
                />
            )}

            <div className={`
        ${collapsed ? 'w-16' : 'w-64'} 
        h-screen fixed left-0 top-0 
        flex flex-col z-30 no-print transition-all duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        sidebar-premium
        bg-white dark:bg-[#0E1014]
        border-r border-slate-200 dark:border-[#1e2328]
      `}>
                {/* Header */}
                <div className={`
          h-16 flex items-center justify-between px-4 
          border-b border-slate-200 dark:border-[#1e2328]
        `}>
                    <div className={`
            flex items-center gap-2
            ${collapsed ? 'justify-center w-full' : ''}
          `}>
                        {/* ZenMedix Lotus/Medical Icon */}
                        <svg className="w-9 h-9 flex-shrink-0" viewBox="0 0 48 48" fill="none">
                            {/* Center lotus petal */}
                            <path d="M24 6C24 6 16 16 16 26C16 36 24 40 24 40C24 40 32 36 32 26C32 16 24 6 24 6Z"
                                fill="url(#zenGrad)" opacity="0.95" />
                            {/* Left petal */}
                            <path d="M10 16C10 16 12 26 20 32C20 32 14 24 14 16C14 8 10 16 10 16Z"
                                fill="url(#zenGrad)" opacity="0.75" />
                            {/* Right petal */}
                            <path d="M38 16C38 16 36 26 28 32C28 32 34 24 34 16C34 8 38 16 38 16Z"
                                fill="url(#zenGrad)" opacity="0.75" />
                            {/* Heartbeat/ECG line - more visible */}
                            <path d="M6 26L14 26L18 18L22 34L26 22L30 26L42 26"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
                            <defs>
                                <linearGradient id="zenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#14b8a6" />
                                    <stop offset="100%" stopColor="#0d4f5f" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {!collapsed && (
                            <span className="text-xl font-bold">
                                <span className="text-teal-500">Zen</span>
                                <span className="text-slate-700 dark:text-white">Medix</span>
                            </span>
                        )}
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-[#1a1d22] rounded-lg transition-colors"
                        onClick={onMobileClose}
                    >
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onMobileClose}
                                title={collapsed ? item.label : undefined}
                                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${active
                                        ? 'nav-active bg-primary/10 dark:bg-primary/15'
                                        : 'text-slate-600 dark:text-[#6B6F76] hover:bg-slate-50 dark:hover:bg-[#1a1d22] hover:text-slate-900 dark:hover:text-white'
                                    }
                  ${collapsed ? 'justify-center' : ''}
                `}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Toggle Button - Desktop Only */}
                <div className="hidden md:block p-2 border-t border-slate-200 dark:border-[#1e2328]">
                    <button
                        onClick={onToggle}
                        className={`
              w-full flex items-center justify-center gap-2 px-4 py-2 
              text-sm font-medium text-slate-500 dark:text-[#6B6F76]
              hover:bg-slate-100 dark:hover:bg-[#1a1d22] 
              hover:text-slate-700 dark:hover:text-white
              rounded-xl transition-all duration-200
            `}
                        title={collapsed ? 'Expandir' : 'Colapsar'}
                    >
                        {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span>Ocultar</span></>}
                    </button>
                </div>

                {/* Copyright Footer */}
                {!collapsed && (
                    <div className="p-4 border-t border-slate-200 dark:border-[#1e2328] hidden md:block">
                        <div className="px-3 py-2 text-center">
                            <p className="text-xs text-slate-400 dark:text-[#6B6F76]">
                                © 2026 ZenMedix Medical Software
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
