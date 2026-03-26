"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FileText,
    Shield,
    Users,
    Database,
    Cookie,
    Mail,
    CheckCircle,
    ClipboardList,
    MapPin,
    Download, Calendar,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * Enterprise Privacy Policy Page — Next.js client component
 * - Comprehensive, structured privacy policy suitable for Kenyan & international audiences
 * - Includes sections: scope, data categories, lawful bases, cookies, transfers, processors, retention,
 *   rights & DSR flow, security, breach handling, contact, templates & downloads.
 * - Tailwind-ready, framer-motion micro-animations, and modal template downloads.
 */

const PrivacyPolicyPage = () => {
    const [openTemplate, setOpenTemplate] = useState<null | string>(null);

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <section className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-20">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <motion.h1 initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl md:text-5xl font-extrabold">
                        Privacy Policy
                    </motion.h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-200">
                        Our commitment to protecting personal data and meeting legal obligations under Kenya’s Data Protection Act (2019) and applicable international privacy laws.
                    </p>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="col-span-1 lg:col-span-1 sticky top-24">
                    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary-600" /> Policy quick links
                        </h3>
                        <nav className="text-sm text-gray-600 space-y-2">
                            <a href="#scope" className="block hover:text-primary-600">Scope & applicability</a>
                            <a href="#data-we-collect" className="block hover:text-primary-600">Data categories</a>
                            <a href="#lawful-basis" className="block hover:text-primary-600">Lawful bases</a>
                            <a href="#cookies" className="block hover:text-primary-600">Cookies</a>
                            <a href="#rights" className="block hover:text-primary-600">Data subject rights</a>
                            <a href="#security" className="block hover:text-primary-600">Security & breach</a>
                            <a href="#contact" className="block hover:text-primary-600">Contact & DPO</a>
                        </nav>

                        <div className="pt-4">
                            <button onClick={() => setOpenTemplate('full-policy-pdf')} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white text-sm">
                                <Download className="h-4 w-4" /> Download PDF
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow p-6 mt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick actions</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button onClick={() => setOpenTemplate('privacy-short')} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">Short privacy notice</button>
                            </li>
                            <li>
                                <button onClick={() => setOpenTemplate('dsr-form')} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">DSR form (fillable)</button>
                            </li>
                            <li>
                                <button onClick={() => setOpenTemplate('data-map')} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50">Data inventory sample</button>
                            </li>
                        </ul>
                    </div>
                </aside>

                <div className="col-span-1 lg:col-span-3 space-y-8">
                    <article id="scope" className="bg-white rounded-2xl shadow p-8">
                        <h2 className="text-2xl font-semibold flex items-center gap-3"><Shield className="h-5 w-5 text-primary-600" /> Scope & Applicability</h2>
                        <p className="mt-3 text-sm text-gray-700">This Privacy Policy explains how Darubini Screening International (&#34;we&#34;, &#34;us&#34;, &#34;our&#34;) collects, uses, discloses and safeguards personal data. It applies to personal data processed in connection with our services, websites, mobile applications and offline interactions. It covers data subjects whose personal data we process, including customers, prospects, employees, contractors and other third parties.</p>

                        <div className="mt-4 bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold">Jurisdictional note</h4>
                            <p className="text-sm text-gray-600">We operate in Kenya and internationally. Where applicable, processing is conducted in accordance with Kenya&#39;s Data Protection Act 2019 and, where relevant, EU GDPR and other regional laws. Cross-border transfers are performed under appropriate safeguards as described below.</p>
                        </div>
                    </article>

                    <article id="data-we-collect" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-primary-600" /> Categories of Personal Data Collected</h3>
                        <p className="mt-3 text-sm text-gray-700">We collect personal data necessary to provide our services and fulfil contractual and legal obligations. Categories include:</p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold">Identifiers & contact</h4>
                                <p className="text-sm text-gray-600">Name, email, phone number, postal address, national ID/passport numbers.</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold">Sensitive data</h4>
                                <p className="text-sm text-gray-600">Biometric data, health information, criminal conviction history — processed only where lawful and necessary.</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold">Employment & education</h4>
                                <p className="text-sm text-gray-600">CVs, employment history, qualifications, referees.</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold">Technical & usage</h4>
                                <p className="text-sm text-gray-600">IP address, device identifiers, cookies and analytics data.</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="font-semibold">Sources of personal data</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-600 mt-2">
                                <li>Data you provide directly (forms, email, uploads).</li>
                                <li>Data from public sources and referees (where applicable).</li>
                                <li>Data from third-party processors and partners (background checks, identity verification providers).</li>
                            </ul>
                        </div>
                    </article>

                    <article id="lawful-basis" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary-600" /> Lawful Bases for Processing</h3>
                        <p className="mt-3 text-sm text-gray-700">We rely on the following lawful bases to process personal data:</p>
                        <ul className="list-disc pl-5 mt-3 text-sm text-gray-600 space-y-2">
                            <li>Consent — where individuals have given clear permission for a specific purpose.</li>
                            <li>Contractual necessity — to perform a contract or take steps prior to entering into a contract.</li>
                            <li>Legal obligation — to comply with legal duties (e.g., tax, regulatory checks).</li>
                            <li>Vital interests — to protect someone&#34;s life in an emergency.</li>
                            <li>Legitimate interests — where our legitimate business interests are not overridden by individual rights.</li>
                        </ul>

                        <div className="mt-4 bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold">Consent management</h4>
                            <p className="text-sm text-gray-600">We obtain explicit consent for sensitive processing and for non-essential cookies. Consent records are logged, with timestamps and purposes. Individuals can withdraw consent at any time via account settings or by contacting our DPO.</p>
                        </div>
                    </article>

                    <article id="cookies" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Cookie className="h-5 w-5 text-primary-600" /> Cookies & Tracking Technologies</h3>
                        <p className="mt-3 text-sm text-gray-700">We (and our partners) use cookies and similar technologies to provide core functionality, improve user experience, and deliver analytics and advertising where consented.</p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold">Essential cookies</h4>
                                <p className="text-sm text-gray-600">Required for site operation (session management, security). These are set by default.</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold">Analytics & performance</h4>
                                <p className="text-sm text-gray-600">Used to measure and improve site performance — loaded only with user consent.</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-gray-600">See our <Link href="/cookiePolicy" className="text-primary-600 underline">Cookie Policy</Link> for a detailed cookie table and preference controls. You can change or withdraw consent via the cookie banner or by contacting the DPO.</p>
                        </div>
                    </article>

                    <article id="third-parties" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary-600" /> Sharing & Third-Party Processors</h3>
                        <p className="mt-3 text-sm text-gray-700">We may share personal data with service providers, subprocessors and legal authorities where lawful and necessary. All third-party processors are subject to contracts that require appropriate safeguards.</p>

                        <div className="mt-4 bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold">International transfers</h4>
                            <p className="text-sm text-gray-600">When transferring data outside Kenya, we rely on lawful transfer mechanisms such as standard contractual clauses, adequacy decisions, or explicit consent. Details of transfer safeguards are available on request.</p>
                        </div>
                    </article>

                    <article id="rights" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary-600" /> Data Subject Rights</h3>
                        <p className="mt-3 text-sm text-gray-700">You have rights regarding your personal data. To exercise these rights contact our DPO using the details below. We will verify identity and respond within statutory timelines.</p>
                        <ul className="list-disc pl-5 mt-3 text-sm text-gray-600 space-y-2">
                            <li>Access — obtain a copy of personal data we hold about you.</li>
                            <li>Rectification — correct inaccurate or incomplete data.</li>
                            <li>Erasure — request deletion where lawful.</li>
                            <li>Restriction — ask us to limit how we process your data.</li>
                            <li>Portability — receive your data in a structured, commonly used format.</li>
                            <li>Object — object to processing, including for direct marketing.</li>
                        </ul>

                        <div className="mt-4 bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold">How to submit a request</h4>
                            <ol className="list-decimal pl-5 mt-2 text-sm text-gray-600 space-y-2">
                                <li>Complete the DSR form (available in the quick actions) or email the DPO.</li>
                                <li>Provide sufficient information to locate your data and proof of identity where necessary.</li>
                                <li>We will acknowledge within 5 business days and provide a substantive response within statutory timelines or explain any lawful extension.</li>
                            </ol>
                        </div>
                    </article>

                    <article id="security" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary-600" /> Security & Breach Handling</h3>
                        <p className="mt-3 text-sm text-gray-700">We apply technical and organisational measures to protect personal data against unauthorised access, disclosure, alteration, and destruction. Controls include encryption, access controls, logging, and incident response plans.</p>

                        <div className="mt-4 bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold">Breach notification</h4>
                            <p className="text-sm text-gray-600">If a personal data breach is likely to result in a risk to the rights and freedoms of individuals, we will promptly notify the ODPC and affected individuals with recommended mitigation steps and remedial actions.</p>
                        </div>
                    </article>

                    <article id="retention" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary-600" /> Retention & Disposal</h3>
                        <p className="mt-3 text-sm text-gray-700">Personal data is retained only for as long as necessary to fulfil the purposes described and to comply with legal obligations. We maintain a retention schedule and securely dispose of data when no longer required.</p>

                        <div className="mt-4 bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold">Sample retention periods</h4>
                            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-2">
                                <li>Recruitment data: 12 months (unless retained with consent).</li>
                                <li>Employee records: As required by employment law.</li>
                                <li>Financial & transaction records: 7 years (tax & regulatory reasons).</li>
                            </ul>
                        </div>
                    </article>

                    <article id="contact" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-primary-600" /> Contact & Data Protection Officer (DPO)</h3>
                        <p className="mt-3 text-sm text-gray-700">If you have questions or wish to exercise your rights, contact our DPO:</p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">DPO</div>
                                <div className="font-medium">info@darubiniscreening.com</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">Address</div>
                                <div className="font-medium">TRV Plaza, 58 Muthithi Road, Westlands, Nairobi</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">ODPC</div>
                                <div className="font-medium">Office of the Data Protection Commissioner, Kenya</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link href="mailto:info@darubiniscreening.com" className="inline-block px-4 py-2 rounded-md bg-primary-600 text-white">Contact DPO</Link>
                        </div>
                    </article>

                    <article id="changes" className="bg-white rounded-2xl shadow p-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary-600" /> Updates to this Policy</h3>
                        <p className="mt-3 text-sm text-gray-700">We may update this policy to reflect changes in law, business practices or technology. Material changes will be notified on our website and, where appropriate, provided to affected individuals directly.</p>

                        <div className="mt-4 text-sm text-gray-600">Last updated: <span className="font-medium">{new Date().toLocaleDateString()}</span></div>
                    </article>
                </div>
            </section>

            <footer className="bg-gray-900 text-gray-400 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm">© {new Date().getFullYear()} Darubini Screening International. All rights reserved. | <Link href="/privacyPolicy">Privacy Policy</Link> | <Link href="/cookiePolicy">Cookie Policy</Link></p>
                </div>
            </footer>

            {/* Templates & Downloads Modal */}
            <Dialog open={!!openTemplate} onOpenChange={(v) => (v ? null : setOpenTemplate(null))}>
                <DialogContent>
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl bg-white rounded-lg p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">{openTemplate === 'full-policy-pdf' ? 'Download Full Privacy Policy (PDF)' : openTemplate === 'privacy-short' ? 'Short Privacy Notice' : openTemplate === 'dsr-form' ? 'Data Subject Request Form' : 'Data Inventory Sample'}</DialogTitle>
                            <DialogDescription className="mt-2 text-sm text-gray-600">Use these materials in your internal compliance packs or publish the short notice on client touchpoints.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 text-sm text-gray-800">
                            {openTemplate === 'full-policy-pdf' && (
                                <div className="space-y-4">
                                    <p>This will download a printer-friendly PDF version of the full privacy policy. (Placeholder — hook up server-side PDF generation or static asset.)</p>
                                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white"><Download className="h-4 w-4" /> Download PDF</button>
                                </div>
                            )}

                            {openTemplate === 'privacy-short' && (
                                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs">{`Darubini Screening International collects personal data to deliver background screening and compliance services. Lawful bases include consent, contract and legal obligation. Contact: privacy@darubiniscreening.com`}</pre>
                            )}

                            {openTemplate === 'dsr-form' && (
                                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs">{`Full name:
Email:
Phone:
Request type: (Access/Rectify/Erase/Portability/Other)
Details of request:
Proof of identity (attach):
Preferred response method:`}</pre>
                            )}

                            {openTemplate === 'data-map' && (
                                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs">{`System | Data categories | Purpose | Legal basis | Retention
CRM    | Contact, transaction | Sales & support | Contract/Legit interest | 7 years
HR     | Employee records      | Employment        | Contract/Legal obligation | As required`}</pre>
                            )}
                        </div>

                        <div className="mt-6 text-right">
                            <button onClick={() => setOpenTemplate(null)} className="px-4 py-2 rounded-md bg-slate-100">Close</button>
                        </div>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </main>
    );
};

export default PrivacyPolicyPage;
