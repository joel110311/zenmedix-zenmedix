import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { logAudit, AUDIT_ACTIONS } from '../services/auditService';
import { toast } from 'sonner';
import pb from '../services/pocketbase';

const AuthContext = createContext(null);

// Session timeout in milliseconds (15 minutes for NOM-024 compliance)
const SESSION_TIMEOUT = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);
    const timeoutRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Reset session timeout on activity
    const resetSessionTimeout = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (user) {
            timeoutRef.current = setTimeout(() => {
                handleSessionExpired();
            }, SESSION_TIMEOUT);
        }
    }, [user]);

    // Handle session expiration
    const handleSessionExpired = async () => {
        if (user) {
            logAudit(AUDIT_ACTIONS.SESSION_EXPIRED, {
                lastActivity: new Date(lastActivityRef.current).toISOString()
            });
            await api.auth.logout();
            setUser(null);
            toast.warning('Tu sesión ha expirado por inactividad', { duration: 5000 });
        }
    };

    // Set up activity listeners for session timeout
    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => resetSessionTimeout();

        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Start initial timeout
        resetSessionTimeout();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [user, resetSessionTimeout]);

    // Check lockout status from storage
    useEffect(() => {
        const storedLockout = localStorage.getItem('medflow_lockout');
        if (storedLockout) {
            const lockoutTime = parseInt(storedLockout, 10);
            if (Date.now() < lockoutTime) {
                setLockoutUntil(lockoutTime);
            } else {
                localStorage.removeItem('medflow_lockout');
            }
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check if PocketBase has a valid session
                if (pb.authStore.isValid && pb.authStore.record) {
                    const record = pb.authStore.record;
                    setUser({
                        id: record.id,
                        email: record.email,
                        name: record.name,
                        role: record.role,
                        specialty: record.specialty,
                        license: record.license
                    });
                    // Update last access time
                    localStorage.setItem('medflow_last_access', new Date().toISOString());
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                pb.authStore.clear();
            } finally {
                setLoading(false);
            }
        };

        // Listen to auth state changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            if (model) {
                setUser({
                    id: model.id,
                    email: model.email,
                    name: model.name,
                    role: model.role,
                    specialty: model.specialty,
                    license: model.license
                });
            } else {
                setUser(null);
            }
        });

        initAuth();

        return () => unsubscribe();
    }, []);

    const login = async (username, password) => {
        // Check if locked out
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
            toast.error(`Cuenta bloqueada. Intenta en ${remainingMinutes} minutos`);
            return false;
        }

        try {
            const authData = await api.auth.login(username, password);
            setUser(authData.user);
            setLoginAttempts(0);
            localStorage.removeItem('medflow_lockout');

            // Log successful login
            logAudit(AUDIT_ACTIONS.LOGIN, {
                email: username,
                timestamp: new Date().toISOString()
            });

            // Store last access
            localStorage.setItem('medflow_last_access', new Date().toISOString());

            return true;
        } catch (error) {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            // Log failed attempt
            logAudit(AUDIT_ACTIONS.LOGIN_FAILED, {
                email: username,
                attempt: newAttempts
            });

            // Lock account after max attempts
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                const lockoutTime = Date.now() + LOCKOUT_DURATION;
                setLockoutUntil(lockoutTime);
                localStorage.setItem('medflow_lockout', lockoutTime.toString());
                toast.error(`Demasiados intentos. Cuenta bloqueada por 5 minutos`);
            } else {
                toast.error(`${error.message}. Intentos restantes: ${MAX_LOGIN_ATTEMPTS - newAttempts}`);
            }

            return false;
        }
    };

    const logout = async () => {
        // Log logout
        logAudit(AUDIT_ACTIONS.LOGOUT, {
            sessionDuration: Date.now() - (new Date(localStorage.getItem('medflow_last_access') || Date.now()).getTime())
        });

        await api.auth.logout();
        setUser(null);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        toast.success('Sesión cerrada');
    };

    // Get last access info
    const getLastAccess = () => {
        return localStorage.getItem('medflow_last_access');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            loading,
            getLastAccess,
            isLockedOut: lockoutUntil && Date.now() < lockoutUntil
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
