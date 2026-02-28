'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from '../dashboard/dashboard.module.css';

interface LegalUpdate {
    title: string;
    date: string;
    summary: string;
    impact_level: string;
}

export default function LegalUpdates() {
    const [updates, setUpdates] = useState<LegalUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userCountry, setUserCountry] = useState('');

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchUpdatesAndProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('country')
                    .eq('id', user.id)
                    .single();

                const country = profile?.country || 'General';
                setUserCountry(country);

                const response = await fetch('/api/updates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch legal updates from AI.');
                }

                const data = await response.json();
                setUpdates(data);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "An error occurred fetching updates.");
            } finally {
                setLoading(false);
            }
        };

        fetchUpdatesAndProfile();
    }, [router, supabase]);

    const getImpactColor = (level: string) => {
        const l = level.toLowerCase();
        if (l.includes('high')) return '#ef4444';
        if (l.includes('medium')) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className={styles.dashboardLayout}>
            <main className={styles.mainContent} style={{ maxWidth: '900px', margin: '0 auto', height: '100vh', overflowY: 'auto' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <h1 className={styles.headerTitle}>Legal & Constitutional Updates</h1>
                        <p className={styles.headerSubtitle}>Latest significant law changes in {userCountry || 'your jurisdiction'}.</p>
                    </div>
                    <button className="btn" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
                </div>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Scanning legal databases and news for {userCountry}...</p>
                    </div>
                ) : error ? (
                    <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <p style={{ color: '#fca5a5', textAlign: 'center' }}>{error}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideUp 0.4s ease forwards' }}>
                        {updates.map((update, idx) => (
                            <div key={idx} className={`glass-panel`} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>{update.title}</h2>
                                    <span style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {update.date}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Impact Level:</span>
                                    <span style={{
                                        color: getImpactColor(update.impact_level),
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {update.impact_level}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                                    {update.summary}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
