'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useThemeStore, ThemeType } from '@/store/themeStore';
import { createClient } from '@/utils/supabase/client';

const THEME_COLORS: Record<ThemeType, string[]> = {
    default: [
        'rgba(148,163,184,0.7)',
        'rgba(59,130,246,0.7)',
        'rgba(139,92,246,0.7)',
    ],
    matrix: [
        'rgba(34,197,94,0.8)',
        'rgba(21,128,61,0.8)',
        'rgba(74,222,128,0.8)',
    ],
    alert: [
        'rgba(239,68,68,0.8)',
        'rgba(248,113,113,0.8)',
        'rgba(153,27,27,0.8)',
    ],
    galaxy: [
        'rgba(168,85,247,0.9)',
        'rgba(236,72,153,0.9)',
        'rgba(59,130,246,0.9)',
        'rgba(14,165,233,0.9)',
    ],
    neural: [
        'rgba(34,211,238,0.9)',
        'rgba(16,185,129,0.9)',
        'rgba(59,130,246,0.9)',
    ],
    quantum: [
        'rgba(99,102,241,0.9)',
        'rgba(236,72,153,0.9)',
        'rgba(168,85,247,0.9)',
    ],
    hologram: [
        'rgba(0,255,255,0.9)',
        'rgba(255,0,255,0.9)',
        'rgba(0,128,255,0.9)',
    ],
    antigravity: [
        'rgba(0,255,200,0.9)',
        'rgba(0,180,255,0.9)',
        'rgba(100,255,255,0.9)',
    ],
    cosmic: [
        'rgba(255,255,255,0.9)',
        'rgba(147,197,253,0.9)',
        'rgba(196,181,253,0.9)',
    ],
};

export default function ThemeBackground() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const pathname = usePathname();

    // Fetch theme from DB on app load to override the 'default' store state
    useEffect(() => {
        const fetchInitialTheme = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('theme').eq('id', user.id).single();
                if (data && data.theme) {
                    setTheme(data.theme as ThemeType);
                }
            }
        };
        fetchInitialTheme();
    }, [setTheme]);

    const isAppPage = pathname === '/dashboard' || pathname === '/settings' || pathname === '/guides' || pathname === '/updates' || pathname === '/laws';

    useEffect(() => {

        if (!isAppPage) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas!.width = window.innerWidth;
        canvas!.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas!.width = window.innerWidth;
            canvas!.height = window.innerHeight;
        });

        const centerX = canvas!.width / 2;
        const centerY = canvas!.height / 2;

        const colors = THEME_COLORS[theme] || THEME_COLORS.default;

        class Particle {

            x: number;
            y: number;
            radius: number;
            angle: number;
            distance: number;
            speed: number;
            spiralSpeed: number;
            color: string;

            constructor() {
                this.angle = Math.random() * Math.PI * 2;
                this.distance = Math.random() * Math.max(canvas!.width, canvas!.height);
                this.radius = Math.random() * 2.5 + 1;
                this.speed = Math.random() * 0.002 + 0.0005;
                this.spiralSpeed = Math.random() * 0.3 + 0.05;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.x = centerX;
                this.y = centerY;
            }

            update() {
                this.angle += this.speed;
                this.distance -= this.spiralSpeed;
                if (this.distance < 50) {
                    this.distance = Math.max(canvas!.width, canvas!.height);
                    this.angle = Math.random() * Math.PI * 2;
                }
                this.x = centerX + Math.cos(this.angle) * this.distance;
                this.y = centerY + Math.sin(this.angle) * this.distance;
            }

            draw() {
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx!.fillStyle = this.color;
                ctx!.shadowColor = this.color;
                ctx!.shadowBlur = 15;
                ctx!.fill();
            }
        }

        const particles: Particle[] = [];
        const count = theme === 'cosmic' ? 600 : 350;

        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }

        function drawNeuralConnections() {
            if (theme !== 'neural') return;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx!.strokeStyle = 'rgba(34,211,238,0.2)';
                        ctx!.lineWidth = 0.5;
                        ctx!.beginPath();
                        ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);
                        ctx!.stroke();
                    }
                }
            }
        }

        function drawGrid() {
            if (theme !== 'hologram') return;
            ctx!.strokeStyle = 'rgba(0,255,255,0.08)';
            const gridSize = 60;

            for (let x = 0; x < canvas!.width; x += gridSize) {
                ctx!.beginPath();
                ctx!.moveTo(x, 0);
                ctx!.lineTo(x, canvas!.height);
                ctx!.stroke();
            }

            for (let y = 0; y < canvas!.height; y += gridSize) {
                ctx!.beginPath();
                ctx!.moveTo(0, y);
                ctx!.lineTo(canvas!.width, y);
                ctx!.stroke();
            }
        }

        function drawAntigravityWave() {
            if (theme !== 'antigravity') return;
            ctx!.beginPath();
            for (let x = 0; x < canvas!.width; x++) {
                const y = centerY + Math.sin(x * 0.01 + Date.now() * 0.002) * 50;
                ctx!.lineTo(x, y);
            }
            ctx!.strokeStyle = 'rgba(0,255,200,0.5)';
            ctx!.lineWidth = 2;
            ctx!.stroke();
        }

        let animationFrameId: number;

        function animate() {
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            ctx!.fillStyle = isDark ? 'rgba(15,23,42,0.25)' : 'rgba(248,250,252,0.25)';
            ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

            drawGrid();
            drawAntigravityWave();

            particles.forEach((p) => {
                p.update();
                p.draw();
            });

            drawNeuralConnections();

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [theme, pathname, isAppPage]);

    if (!isAppPage) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
}
