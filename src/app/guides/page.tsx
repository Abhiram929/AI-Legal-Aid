'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import styles from '../dashboard/dashboard.module.css';

// Mock data for laws and constitution e-books
const LAW_GUIDES = [
    {
        title: "The Constitution: Basic Structure",
        type: "E-Book",
        summary: "A comprehensive guide to understanding the fundamental rights, duties, and structures laid out in the constitution.",
        readTime: "45 min read",
        color: "#60a5fa"
    },
    {
        title: "Labor & Employment Rights",
        type: "Resource",
        summary: "Detailed outlines of worker protections, wage laws, and anti-discrimination statutes in the workplace.",
        readTime: "20 min read",
        color: "#10b981"
    },
    {
        title: "Family Law & Domestic Relations",
        type: "E-Book",
        summary: "An overview of laws pertaining to marriage, divorce, child custody, and domestic violence protections.",
        readTime: "55 min read",
        color: "#f59e0b"
    },
    {
        title: "Property & Tenant Rights",
        type: "Guide",
        summary: "Crucial information on lease agreements, eviction processes, landlord responsibilities, and tenant disputes.",
        readTime: "30 min read",
        color: "#8b5cf6"
    },
    {
        title: "Criminal Procedure Code",
        type: "Legal Text",
        summary: "The formal procedures for investigation, arrest, trial, and bail in the criminal justice system.",
        readTime: "2 hrs read",
        color: "#ef4444"
    },
    {
        title: "Intellectual Property Basics",
        type: "Resource",
        summary: "How to protect your inventions, writings, and business assets using copyrights, patents, and trademarks.",
        readTime: "40 min read",
        color: "#ec4899"
    }
];

export default function LawGuides() {
    const router = useRouter();
    const [selectedGuide, setSelectedGuide] = useState<any>(null);

    return (
        <div className={styles.dashboardLayout}>
            <main className={styles.mainContent} style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <h1 className={styles.headerTitle} style={{ textAlign: 'left', padding: '0 0 0.5rem 0', border: 'none' }}>
                            Law & Constitution Guides
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Access free e-books, legal texts, and comprehensive guides to understand your rights.
                        </p>
                    </div>
                    <button className="btn" onClick={() => router.push('/dashboard')}>Back to Chat</button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    animation: 'slideUp 0.4s ease forwards'
                }}>
                    {LAW_GUIDES.map((guide, idx) => (
                        <div key={idx} className="glass-panel" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            borderTop: `3px solid ${guide.color}`
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={() => setSelectedGuide(guide)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    color: guide.color,
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {guide.type}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{guide.readTime}</span>
                            </div>

                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                                {guide.title}
                            </h2>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, flexGrow: 1, margin: 0 }}>
                                {guide.summary}
                            </p>

                            <button style={{
                                width: '100%',
                                padding: '0.75rem',
                                marginTop: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'inherit',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                alignItems: 'center'
                            }}>
                                <span>📖 Read Now</span>
                            </button>
                        </div>
                    ))}
                </div>

                {/* E-Book Reading Viewer Modal */}
                {selectedGuide && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                        zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ color: 'white', margin: 0 }}>📍 {selectedGuide.title}</h2>
                                <button className="btn" onClick={() => setSelectedGuide(null)}>Close Reader</button>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1.5rem', overflowY: 'auto' }}>
                                <div style={{ borderBottom: `2px solid ${selectedGuide.color}`, paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    <span style={{ color: selectedGuide.color, fontWeight: 'bold' }}>{selectedGuide.type}</span>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        <strong>Synopsis:</strong> {selectedGuide.summary}
                                    </p>
                                </div>
                                <p style={{ color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '1.05rem', marginTop: '1rem' }}>
                                    [DOCUMENT VIEWER MODE ACTIVATED]<br /><br />
                                    <strong>Chapter 1: Preliminary Foundations</strong><br /><br />
                                    This is a simulated reading environment for the chosen legal document or constitutional guide. In a fully-production scale system, this modal would securely fetch and render the PDF document, EPUB file, or raw text components of `{selectedGuide.title}` directly into this scrollable viewport.
                                    <br /><br />
                                    Legal text processing involves reading through complex statutory languages. The user is provided with a {selectedGuide.readTime} reading buffer to fully comprehend the constraints of the law.
                                    <br /><br />
                                    <strong>Section 1.2: Scope of Application</strong><br />
                                    The rules stipulated within this framework govern the rights and obligations of parties under this jurisdiction.
                                    <br /><br /><br /><br />
                                    [END OF PREVIEW]
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
