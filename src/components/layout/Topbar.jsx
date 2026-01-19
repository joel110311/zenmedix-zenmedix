import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../ui/Button';

export const Topbar = ({ sidebarCollapsed, onMenuClick }) => {
    const { logout } = useAuth();
    const { getActiveDoctor } = useSettings();

    const activeDoctor = getActiveDoctor();

    return (
        <header className={`
      h-16 fixed top-0 right-0 z-10 
      px-4 md:px-8 flex items-center justify-between no-print transition-all duration-200
      left-0 md:${sidebarCollapsed ? 'left-16' : 'left-64'}
      topbar-premium
      bg-white dark:bg-[#0B0D10]
      border-b border-slate-200 dark:border-[#1e2328]
    `}>
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-[#1a1d22] rounded-xl transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-[#B0B3B8]" />
                </button>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white hidden sm:block">
                    Panel Médico
                </h2>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 border-r border-slate-200 dark:border-[#2A2E35]">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/10 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-sm hidden sm:block">
                        <p className="font-medium text-slate-800 dark:text-white">{activeDoctor?.name || 'Doctor'}</p>
                        <p className="text-xs text-slate-500 dark:text-[#6B6F76]">{activeDoctor?.specialty || 'Especialidad'}</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    title="Cerrar sesión"
                    className="hover:bg-slate-100 dark:hover:bg-[#1a1d22] rounded-xl"
                >
                    <LogOut className="w-5 h-5 text-slate-500 dark:text-[#6B6F76]" />
                </Button>
            </div>
        </header>
    );
};
