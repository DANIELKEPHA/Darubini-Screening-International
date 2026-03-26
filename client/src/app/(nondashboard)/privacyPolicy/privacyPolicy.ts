'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface Consent {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

export const useCookieConsent = () => {
    const [consent, setConsent] = useState<Consent>({
        necessary: true, // Always true as these are required
        analytics: false,
        marketing: false,
    });
    const [isConsentGiven, setIsConsentGiven] = useState<boolean>(false);

    useEffect(() => {
        const savedConsent = Cookies.get('cookieConsent');
        if (savedConsent) {
            const parsedConsent: Consent = JSON.parse(savedConsent);
            setConsent({
                necessary: true, // Ensure necessary is always true
                analytics: parsedConsent.analytics || false,
                marketing: parsedConsent.marketing || false,
            });
            setIsConsentGiven(true);
        }
    }, []);

    const updateConsent = (newConsent: Consent) => {
        const updatedConsent = {
            necessary: true, // Enforce necessary cookies
            analytics: newConsent.analytics,
            marketing: newConsent.marketing,
        };
        setConsent(updatedConsent);
        Cookies.set('cookieConsent', JSON.stringify(updatedConsent), {
            expires: 365, // 1 year
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });
        setIsConsentGiven(true);
    };

    return { consent, updateConsent, isConsentGiven };
};