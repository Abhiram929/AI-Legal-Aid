'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from './dashboard.module.css';

interface QueryResult {
    category: string;
    applicable_sections: string;
    penalties_fines_tenure: string;
    advice: string;
    required_documents: string;
    risk_score: number;
}

export default function Dashboard() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'model', text?: string, data?: QueryResult }>>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [userName, setUserName] = useState('');
    const [userCountry, setUserCountry] = useState('');

    // Country Modal State
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [savingCountry, setSavingCountry] = useState(false);

    const COUNTRIES = [
        "United States", "United Kingdom", "Canada", "Australia",
        "India", "United Arab Emirates", "Singapore", "New Zealand", "South Korea", "Other"
    ];

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserName(profile.full_name || user.email);
                    if (profile.country) {
                        setUserCountry(profile.country);
                    } else {
                        setShowCountryModal(true);
                    }
                }

                // Fetch history
                const { data: queries } = await supabase
                    .from('legal_queries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (queries) setHistory(queries);
            }
        };
        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleSaveCountry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCountry) return;
        setSavingCountry(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ country: selectedCountry }).eq('id', user.id);
            setUserCountry(selectedCountry);
            setShowCountryModal(false);
        }
        setSavingCountry(false);
    };

    const handleLoadHistory = (item: any) => {
        setMessages(prev => [
            ...prev,
            { role: 'user', text: item.user_prompt },
            { role: 'model', data: item as QueryResult }
        ]);

        // Auto scroll to bottom
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const currentPrompt = prompt;
        setPrompt(''); // Clear input immediately
        setMessages(prev => [...prev, { role: 'user', text: currentPrompt }]);
        setLoading(true);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: currentPrompt,
                    country: userCountry
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze case');
            }

            const aiResult = await response.json();

            setMessages(prev => [...prev, { role: 'model', data: aiResult }]);

            // Save to database
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('legal_queries').insert({
                    user_id: user.id,
                    user_prompt: currentPrompt,
                    ...aiResult
                });

                if (!error) {
                    setHistory([{ user_prompt: currentPrompt, ...aiResult }, ...history]);
                } else {
                    console.error("DB Insert Error Payload:", JSON.stringify(error, null, 2));
                    console.error("DB Insert Error Message:", error?.message);
                    alert(`Failed to save history! \n\nReason: ${error?.message}\n\nPlease make sure you have run the latest supabase_schema.sql in your Supabase Dashboard SQL Editor.`);
                }
            }

        } catch (error) {
            console.error(error);
            alert('Error analyzing query');
            // Remove the user bubble if it failed, or show an error bubble (simplified here)
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score <= 3) return '#10b981'; // Green
        if (score <= 7) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    const startNewChat = () => {
        setMessages([]);
        setPrompt('');
    };

    return (
        <div className={styles.dashboardLayout}>
            {/* Country Selection Modal */}
            {showCountryModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.5rem' }}>Welcome!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Laws vary greatly by region. Please select your country so our AI can provide accurate legal guidance.
                        </p>
                        <form onSubmit={handleSaveCountry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                required
                                style={{
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white', fontFamily: 'inherit', fontSize: '1rem'
                                }}
                            >
                                <option value="" disabled>Select a country...</option>
                                {COUNTRIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <button type="submit" className="btn" disabled={savingCountry || !selectedCountry}>
                                {savingCountry ? 'Saving...' : 'Get Started'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`glass-panel ${styles.sidebar}`}>
                <div className={styles.profileSection}>
                    <div className={styles.avatar}>{userName?.charAt(0)?.toUpperCase()}</div>
                    <div className={styles.userInfo}>
                        <h3 className={styles.userName}>{userName}</h3>
                        <span className={styles.userCountry}>Jurisdiction: {userCountry}</span>
                    </div>
                </div>

                <nav className={styles.navMenu}>
                    <button className={`${styles.navItem} ${styles.active}`} onClick={startNewChat}>New Chat</button>
                    <button className={styles.navItem} onClick={() => router.push('/laws')}>Our Laws</button>
                    <button className={styles.navItem} onClick={() => router.push('/guides')}>Law Guides</button>
                    <button className={styles.navItem} onClick={() => router.push('/updates')}>Legal Updates</button>
                    <button className={styles.navItem} onClick={() => router.push('/settings')}>Settings</button>
                </nav>

                <div className={styles.historySection}>
                    <h4 className={styles.historyTitle}>Recent Queries</h4>
                    <div className={styles.historyList}>
                        {history.map((item, i) => (
                            <div key={i} className={styles.historyItem} onClick={() => handleLoadHistory(item)}>
                                <div className={styles.historyCategory}>{item.category}</div>
                                <div className={styles.historyPrompt}>{item.user_prompt.substring(0, 30)}...</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                <h1 className={styles.headerTitle}>Law Assistant</h1>

                <div className={styles.chatContainer}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
                            <h2>How can I help you today?</h2>
                            <p>Describe your legal situation below. Be as detailed as possible so I can provide accurate guidance under {userCountry} law.</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userBubble : styles.aiBubble}`}>
                                {msg.role === 'user' ? (
                                    <div style={{ lineHeight: 1.6 }}>{msg.text}</div>
                                ) : (
                                    <div className={styles.resultsGrid}>
                                        <div className={`glass-panel ${styles.resultCard} ${styles.categoryCard}`}>
                                            <h3 className={styles.cardTitle}>Legal Category</h3>
                                            <div className={styles.categoryBadge}>{msg.data?.category}</div>
                                        </div>

                                        <div className={`glass-panel ${styles.resultCard} ${styles.riskCard}`}>
                                            <h3 className={styles.cardTitle}>Risk Score</h3>
                                            <div className={styles.riskMeterContainer}>
                                                <div className={styles.riskScoreDisplay} style={{ color: getRiskColor(msg.data?.risk_score || 0) }}>
                                                    {msg.data?.risk_score} <span className={styles.riskMax}>/ 10</span>
                                                </div>
                                                <p className={styles.riskContext} style={{ marginTop: '0.5rem' }}>
                                                    {(msg.data?.risk_score || 0) >= 8 ? 'High Risk - Seek immediate counsel.' :
                                                        (msg.data?.risk_score || 0) >= 4 ? 'Moderate Risk - Monitor closely.' :
                                                            'Low Risk - General guidance sufficient.'}
                                                </p>
                                                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', marginTop: '1rem', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(msg.data?.risk_score || 0) * 10}%`, height: '100%', backgroundColor: getRiskColor(msg.data?.risk_score || 0), transition: 'width 1s ease' }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`glass-panel ${styles.resultCard} ${styles.docsCard} ${styles.fullWidth}`}>
                                            <h3 className={styles.cardTitle}>Applicable Law & Constitutional Sections</h3>
                                            <pre className={styles.docsContent} style={{ color: '#6ee7b7' }}>{msg.data?.applicable_sections}</pre>
                                        </div>

                                        <div className={`glass-panel ${styles.resultCard} ${styles.docsCard} ${styles.fullWidth}`}>
                                            <h3 className={styles.cardTitle}>Potential Penalties, Fines, & Tenure</h3>
                                            <pre className={styles.docsContent} style={{ color: '#fca5a5' }}>{msg.data?.penalties_fines_tenure}</pre>
                                        </div>

                                        <div className={`glass-panel ${styles.resultCard} ${styles.adviceCard} ${styles.fullWidth}`}>
                                            <h3 className={styles.cardTitle}>AI Legal Guidance</h3>
                                            <p className={styles.adviceContent}>{msg.data?.advice}</p>
                                        </div>

                                        <div className={`glass-panel ${styles.resultCard} ${styles.docsCard} ${styles.fullWidth}`}>
                                            <h3 className={styles.cardTitle}>Required Documentation</h3>
                                            <pre className={styles.docsContent}>{msg.data?.required_documents}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className={styles.loadingContainer} style={{ padding: '1rem' }}>
                            <div className={styles.spinner} style={{ width: '30px', height: '30px', borderWidth: '3px' }}></div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analyzing legal jurisdiction and risk factors...</p>
                        </div>
                    )}
                </div>

                <div className={styles.chatInputContainer}>
                    <form onSubmit={handleAnalyze} className={styles.inputForm}>
                        <textarea
                            className={styles.promptInput}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAnalyze(e as unknown as React.FormEvent);
                                }
                            }}
                            placeholder="Message Law Assistant..."
                            rows={1}
                            required
                        />
                        <button type="submit" className={styles.analyzeBtn} disabled={loading || !prompt.trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
