'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from '../dashboard/dashboard.module.css';

interface EverydayLaw {
    symbol: string;
    rule: string;
    description: string;
    fine: string;
}

export default function OurLaws() {
    const [userName, setUserName] = useState('');
    const [userCountry, setUserCountry] = useState('');
    const [rules, setRules] = useState<EverydayLaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile) {
                    setUserName(profile.full_name || user.email);
                    setUserCountry(profile.country || '');

                    if (profile.country) {
                        try {
                            const response = await fetch('/api/laws', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ country: profile.country })
                            });

                            if (!response.ok) throw new Error('Failed to fetch laws.');
                            const result = await response.json();
                            setRules(result.laws || []);
                        } catch (err: any) {
                            console.error(err);
                            setError('Unable to load everyday laws at this time.');
                        }
                    }
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [supabase]);

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar Navigation */}
            <aside className={`glass-panel ${styles.sidebar}`}>
                <div className={styles.profileSection}>
                    <div className={styles.avatar}>{userName?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div className={styles.userInfo}>
                        <h3 className={styles.userName}>{userName}</h3>
                        <span className={styles.userCountry}>Jurisdiction: {userCountry}</span>
                    </div>
                </div>

                <nav className={styles.navMenu}>
                    <button className={styles.navItem} onClick={() => router.push('/dashboard')}>New Chat</button>
                    <button className={`${styles.navItem} ${styles.active}`} onClick={() => router.push('/laws')}>Our Laws</button>
                    <button className={styles.navItem} onClick={() => router.push('/guides')}>Law Guides</button>
                    <button className={styles.navItem} onClick={() => router.push('/updates')}>Legal Updates</button>
                    <button className={styles.navItem} onClick={() => router.push('/settings')}>Settings</button>
                </nav>

                <button className={styles.signOutBtn} onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/');
                }}>Sign Out</button>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                <h1 className={styles.headerTitle}>Everyday Laws & Protections ({userCountry})</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                    Discover the common, everyday civil and social laws that people frequently neglect or break in your jurisdiction, completely by accident.
                </p>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Compiling local statutes...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '2rem', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {error}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
                        {rules.map((rule, index) => (
                            <div key={index} className={`glass-panel ${styles.resultCard}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontSize: '3rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        {rule.symbol}
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', flex: 1 }}>{rule.rule}</h3>
                                </div>
                                <div style={{ height: '1px', background: 'var(--glass-border)', width: '100%' }} />
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>{rule.description}</p>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', marginTop: 'auto' }}>
                                    <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Penalty / Fine</strong>
                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{rule.fine}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
