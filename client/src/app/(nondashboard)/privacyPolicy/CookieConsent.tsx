'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {useCookieConsent} from "@/app/(nondashboard)/privacyPolicy/privacyPolicy";

const CookieConsent: React.FC = () => {
    const { consent, updateConsent, isConsentGiven } = useCookieConsent();
    const [showPreferences, setShowPreferences] = useState(false);

    if (isConsentGiven) return null;

    const handleAcceptAll = () => {
        updateConsent({ necessary: true, analytics: true, marketing: true });
        toast.success('Cookie preferences saved!');
    };

    const handleSavePreferences = () => {
        updateConsent(consent);
        setShowPreferences(false);
        toast.success('Cookie preferences saved!');
    };

    const togglePreference = (key: keyof typeof consent) => {
        updateConsent({ ...consent, [key]: !consent[key] });
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto lg:max-w-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">We value your privacy</h2>
            <p className="text-gray-600 text-sm mb-4">
                We use cookies to enhance your experience, analyze site usage, and deliver personalized content. By continuing, you agree to our{' '}
                <a
                    href="/privacyPolicy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 underline hover:text-green-600"
                >
                    Privacy Policy
                </a>{' '}
                and{' '}
                <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 underline hover:text-green-600"
                >
                    Terms and Conditions
                </a>.
            </p>

            {!showPreferences ? (
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowPreferences(true)}
                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                        Customize
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-500 transition"
                    >
                        Accept All
                    </button>
                </div>
            ) : (
                <div>
                    <div className="mb-4">
                        <label className="flex items-center text-gray-600 text-sm">
                            <input
                                type="checkbox"
                                checked={consent.necessary}
                                disabled
                                className="h-4 w-4 mr-2 text-green-500"
                            />
                            Necessary Cookies (Always Enabled)
                        </label>
                        <p className="text-gray-500 text-xs ml-6">Required for the website to function properly.</p>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center text-gray-600 text-sm">
                            <input
                                type="checkbox"
                                checked={consent.analytics}
                                onChange={() => togglePreference('analytics')}
                                className="h-4 w-4 mr-2 text-green-500"
                            />
                            Analytics Cookies
                        </label>
                        <p className="text-gray-500 text-xs ml-6">Help us understand how visitors interact with our site.</p>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center text-gray-600 text-sm">
                            <input
                                type="checkbox"
                                checked={consent.marketing}
                                onChange={() => togglePreference('marketing')}
                                className="h-4 w-4 mr-2 text-green-500"
                            />
                            Marketing Cookies
                        </label>
                        <p className="text-gray-500 text-xs ml-6">Used to deliver personalized ads and content.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSavePreferences}
                            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-500 transition"
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CookieConsent;