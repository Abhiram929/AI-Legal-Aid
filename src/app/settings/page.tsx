'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useThemeStore, ThemeType } from '@/store/themeStore';
import styles from '../dashboard/dashboard.module.css';

const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia",
    "India", "United Arab Emirates", "Singapore", "New Zealand", "South Korea", "Other"
];

export default function Settings() {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedTheme, setSelectedTheme] = useState<ThemeType>('default');
    const setGlobalTheme = useThemeStore((state) => state.setTheme);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserName(profile.full_name || '');
                    setSelectedCountry(profile.country || '');
                    setSelectedTheme(profile.theme || 'default');
                }
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const updates = {
                id: user.id,
                full_name: userName,
                country: selectedCountry,
                theme: selectedTheme,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            // Instantly update the global theme
            setGlobalTheme(selectedTheme);

            setMessage('Profile updated successfully!');

            // Auto dismiss message
            setTimeout(() => setMessage(''), 3000);

        } catch (error: any) {
            console.error("Profile Save Error:", error);
            setMessage(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.dashboardLayout}>
            <main className={styles.mainContent} style={{ maxWidth: '800px', margin: '0 auto' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h1 className={styles.headerTitle}>Account Settings</h1>
                    <button className="btn" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
                </div>

                <div className={`glass-panel`} style={{ background: 'var(--glass-bg)' }}>

                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address (Read-only)</label>
                            <input
                                type="email"
                                value={userEmail}
                                disabled
                                style={{
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'var(--text-secondary)', cursor: 'not-allowed'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Full Name</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Your name"
                                style={{
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: 'var(--input-bg)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Jurisdiction (Country)</label>
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                style={{
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: 'var(--input-bg)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="" disabled>Select a country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                This affects the contextual laws the AI references.
                            </small>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Visual Theme</label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => {
                                    const val = e.target.value as ThemeType;
                                    setSelectedTheme(val);
                                    setGlobalTheme(val);
                                }}
                                style={{
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: 'var(--input-bg)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="default">Default (Blue & Purple)</option>
                                <option value="matrix">Matrix (Green)</option>
                                <option value="alert">Alert (Red)</option>
                                <option value="galaxy">Galaxy (Pink & Blue)</option>
                                <option value="neural">Neural (Cyan & Green)</option>
                                <option value="quantum">Quantum (Indigo & Pink)</option>
                                <option value="hologram">Hologram (Cyan & Magenta)</option>
                                <option value="antigravity">Anti-Gravity (Teal Wave)</option>
                                <option value="cosmic">Cosmic (White & Violet)</option>
                            </select>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Your new theme will apply instantly.
                            </small>
                        </div>

                        {message && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: message.includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.includes('success') ? '#6ee7b7' : '#fca5a5',
                                border: message.includes('success') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                textAlign: 'center'
                            }}>
                                {message}
                            </div>
                        )}

                        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>

                    </form>
                </div>
            </main>
        </div>
    );
}
