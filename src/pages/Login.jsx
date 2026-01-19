import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        const success = await login(data.username, data.password);
        if (success) {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex flex-col items-center gap-3">
                    {/* ZenMedix Lotus/Medical Icon */}
                    <svg className="w-20 h-20" viewBox="0 0 48 48" fill="none">
                        {/* Center lotus petal */}
                        <path d="M24 6C24 6 16 16 16 26C16 36 24 40 24 40C24 40 32 36 32 26C32 16 24 6 24 6Z"
                            fill="url(#zenGradLogin)" opacity="0.95" />
                        {/* Left petal */}
                        <path d="M10 16C10 16 12 26 20 32C20 32 14 24 14 16C14 8 10 16 10 16Z"
                            fill="url(#zenGradLogin)" opacity="0.75" />
                        {/* Right petal */}
                        <path d="M38 16C38 16 36 26 28 32C28 32 34 24 34 16C34 8 38 16 38 16Z"
                            fill="url(#zenGradLogin)" opacity="0.75" />
                        {/* Heartbeat/ECG line - more visible */}
                        <path d="M6 26L14 26L18 18L22 34L26 22L30 26L42 26"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <defs>
                            <linearGradient id="zenGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#0d4f5f" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1 className="text-3xl font-bold">
                        <span className="text-teal-500">Zen</span>
                        <span className="text-slate-800">Medix</span>
                    </h1>
                </div>
                <p className="mt-3 text-center text-sm text-slate-600">
                    Sistema de Historia Clínica
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            label="Usuario"
                            {...register('username', { required: 'El usuario es requerido' })}
                            error={errors.username}
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            {...register('password', { required: 'La contraseña es requerida' })}
                            error={errors.password}
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Iniciar Sesión
                        </Button>
                    </form>
                </div>

                {/* Copyright Footer */}
                <p className="mt-6 text-center text-xs text-slate-400">
                    v1.0 &middot; © 2026 ZenMedix Medical Software
                </p>
            </div>
        </div>
    );
}
