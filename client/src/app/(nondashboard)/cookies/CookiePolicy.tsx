import React from 'react';
import Head from 'next/head';

const CookiePolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Head>
                <title>Cookie Policy</title>
                <meta name="description" content="Learn how we use cookies on our real estate website" />
            </Head>

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
                    <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="prose prose-lg text-gray-700 max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
                        <p>
                            Darubini Screening (&#34;we&#34;, &#34;us&#34;, or &#34;our&#34;) uses cookies on our website (the &#34;Service&#34;).
                            This policy explains what cookies are, how we use them, and your choices regarding cookies.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. What Are Cookies</h2>
                        <p>
                            Cookies are small text files stored on your device when you visit websites. They help the website
                            remember information about your visit, which can make it easier to visit the site again and make
                            the site more useful to you.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Cookies</h2>
                        <p>We use cookies for several purposes:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li><strong>Essential Cookies:</strong> Necessary for the website to function properly</li>
                            <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site</li>
                            <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization</li>
                            <li><strong>Marketing Cookies:</strong> Used to track visitors across websites for relevant advertising</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Types of Cookies We Use</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">session_id</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">Maintain user session</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Session</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">_ga</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">Google Analytics</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 years</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">cookie_consent</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">Stores cookie preferences</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 year</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Your Cookie Choices</h2>
                        <p>
                            You can control and/or delete cookies as you wish. Most web browsers allow some control of
                            cookies through browser settings. However, if you disable essential cookies, parts of our
                            website may not work.
                        </p>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Cookie Consent Banner</h3>
                            <p>
                                When you first visit our website, you&#39;ll see a cookie consent banner where you can:
                            </p>
                            <ul className="list-disc pl-6 space-y-1 mt-2">
                                <li>Accept all cookies</li>
                                <li>Reject non-essential cookies</li>
                                <li>Customize your cookie preferences</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Changes to This Policy</h2>
                        <p>
                            We may update our Cookie Policy from time to time. We will notify you of any changes by
                            posting the new policy on this page and updating the &#34;Last updated&#34; date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about this Cookie Policy, please contact us at:
                        </p>
                        <address className="not-italic mt-2">
                            Darubini Screening International<br />
                            TRV Office Plaza 58 Muthithi Road<br />
                            P.O. Box 6079-00100, Mombasa<br />
                            Email: info@darubiniscreening.com<br />
                            Phone: 0746 730 595 / 0738 743 008 / 0748 097 141
                        </address>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;