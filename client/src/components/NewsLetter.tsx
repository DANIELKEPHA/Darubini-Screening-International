"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { useCreateContactMutation } from '@/state/api';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Check, ChevronRight, Loader2, Star } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
    interests: z.array(z.string()).nonempty('Select at least one interest'),
    privacyConsent: z
        .boolean()
        .refine((val) => val, 'You must agree to the Privacy Policy'),
    message: z.string().max(500, 'Message is too long').optional(),
});

type FormData = z.infer<typeof formSchema>;

const NewsLetter = () => {
    const [createContact, { isLoading: isSubmitting }] = useCreateContactMutation();
    const [userInfo, setUserInfo] = useState<{
        tenantCognitoId: string | null;
        email: string | null;
    }>({ tenantCognitoId: null, email: null });
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // Interests options
    const interestOptions = [
        { id: 'employee-screening', label: 'Employee Screening' },
        { id: 'criminal-checks', label: 'Criminal Background Checks' },
        { id: 'education-verification', label: 'Education & Credential Checks' },
        { id: 'reference-checks', label: 'Reference Checks' },
        { id: 'compliance-updates', label: 'HR & Compliance Updates' },
        { id: 'industry-insights', label: 'Industry Insights' },
        { id: 'fraud-prevention', label: 'Fraud & Identity Risk Tips' },
    ];

    // Fetch user session on mount
    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                const session = await fetchAuthSession({ forceRefresh: true });
                const user = await getCurrentUser();
                const tenantCognitoId = user.userId.trim() !== '' ? user.userId : null;
                const email = session.tokens?.idToken?.payload?.email as string | undefined;

                setUserInfo({ tenantCognitoId, email: email || null });
            } catch (error) {
                setUserInfo({ tenantCognitoId: null, email: null });
            } finally {
                setIsLoadingSession(false);
            }
        };

        fetchUserSession();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: userInfo.email || '',
            interests: [],
            privacyConsent: false,
            message: '',
        },
    });

    // Update form email when userInfo changes
    useEffect(() => {
        if (userInfo.email) {
            setValue('email', userInfo.email);
        }
    }, [userInfo.email, setValue]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            const payload = {
                ...data,
                cognitoId: userInfo?.tenantCognitoId || null,
                interests: data.interests.join(', '),
                message: data.message || '',
            };

            await createContact(payload).unwrap();
            reset();
            toast.success('Subscription successful! Check your email for confirmation.');
        } catch (error) {
            toast.error('Failed to subscribe. Please try again.');
        }
    };

    return (
        <div className="relative bg-gradient-to-b from-primary-50 to-white py-24 overflow-hidden">
            <Toaster position="top-right" />

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-100 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content Section */}
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            Join Our <span className="text-primary-500">Trusted</span> Screening Network
                        </h2>

                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Get curated screening insights, compliance updates, and risk management tips delivered to your inbox weekly.
                        </p>

                        <div className="space-y-5 mb-10">
                            {[
                                "Weekly updates on screening regulations and compliance",
                                "Insights into hiring trends and risk mitigation strategies",
                                "Tips for improving your background check processes",
                                "Case studies on successful client verifications",
                                "Exclusive access to industry reports and fraud alerts"
                            ].map((item, index) => (
                                <div key={index} className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <Check className="h-6 w-6 text-primary-500" />
                                    </div>
                                    <p className="ml-3 text-lg text-gray-700">{item}</p>
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 max-w-md">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                <div className="text-2xl font-bold text-primary-500">15K+</div>
                                <div className="text-sm text-gray-500">Subscribers</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                <div className="text-2xl font-bold text-primary-500">92%</div>
                                <div className="text-sm text-gray-500">Satisfaction</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                <div className="text-2xl font-bold text-primary-500">24h</div>
                                <div className="text-sm text-gray-500">Avg. Response</div>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="p-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>

                        <div className="p-8 sm:p-10">
                            <div className="text-center mb-8">
                                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                                    Get Started
                                </h3>
                                <p className="text-gray-600">
                                    Join our growing community of employers and professionals who care about safe, smart hiring.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            placeholder="Daniel Kepha"
                                            {...register('name')}
                                            className={`w-full px-4 py-3 text-gray-900 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                                                errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="your@email.com"
                                            {...register('email')}
                                            className={`w-full px-4 py-3 text-gray-900 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            What are you interested in?
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {interestOptions.map((interest) => (
                                                <label key={interest.id} className="relative flex items-start">
                                                    <input
                                                        type="checkbox"
                                                        value={interest.id}
                                                        {...register('interests')}
                                                        className="peer h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 absolute opacity-0"
                                                    />
                                                    <div className="w-full min-h-10 p-3 border border-gray-300 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:ring-1 peer-checked:ring-primary-500 transition-all">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-5 w-5 rounded border border-gray-300 bg-white flex items-center justify-center mr-3 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-colors">
                                                                <Check className="h-3 w-3 text-white hidden peer-checked:block" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">{interest.label}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.interests && (
                                            <p className="mt-2 text-sm text-red-600">{errors.interests.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Notes (Optional)
                                        </label>
                                        <textarea
                                            id="message"
                                            placeholder="Tell us about your interests or questions..."
                                            {...register('message')}
                                            className={`w-full px-4 py-3 text-gray-900 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                                                errors.message ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            rows={3}
                                        />
                                        {errors.message && (
                                            <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
                                        )}
                                    </div>

                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="privacyConsent"
                                                type="checkbox"
                                                {...register('privacyConsent')}
                                                className={`h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 ${
                                                    errors.privacyConsent ? 'border-red-500' : ''
                                                }`}
                                            />
                                        </div>
                                        <label htmlFor="privacyConsent" className="ml-3 text-sm text-gray-600">
                                            I agree to the{' '}
                                            <a href="/privacy" className="text-primary-500 hover:underline font-medium">
                                                Privacy Policy
                                            </a>{' '}
                                            and consent to receiving communications.
                                        </label>
                                    </div>
                                    {errors.privacyConsent && (
                                        <p className="text-sm text-red-600">{errors.privacyConsent.message}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isLoadingSession}
                                        className={`w-full py-4 px-6 inline-flex justify-center items-center gap-x-3 text-base font-semibold rounded-lg border border-transparent bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md ${
                                            isSubmitting || isLoadingSession ? 'cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : isLoadingSession ? (
                                            'Loading...'
                                        ) : (
                                            <>
                                                Join Now <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                <p>We respect your privacy. Unsubscribe anytime.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="mt-24">
                    <h3 className="text-center text-3xl font-bold text-gray-900 mb-12">
                        Trusted by Employers and Hiring Professionals
                    </h3>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Daniel Kepha",
                                role: "HR Manager, Tech Startup",
                                content:
                                    "Darubini's background checks are thorough and fast. We’ve made smarter hiring decisions and avoided costly mistakes.",
                                image: "/placeholder-avatar1.png",
                            },
                            {
                                name: "Sarah Johnson",
                                role: "Recruiter, Healthcare Sector",
                                content:
                                    "The education and reference verification tools saved me hours. It’s now a must-have in our hiring process.",
                                image: "/placeholder-avatar2.png",
                            },
                            {
                                name: "Michael Chen",
                                role: "Compliance Officer",
                                content:
                                    "I rely on Darubini’s updates to stay informed on changing screening laws and best practices. It’s an incredible resource.",
                                image: "/placeholder-avatar3.png",
                            },
                        ].map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center mb-6">
                                    <div className="flex-shrink-0">
                                        <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                                            <Image
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                width={56}
                                                height={56}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                                        <p className="text-sm text-primary-500">{testimonial.role}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                                <div className="mt-4 flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-5 w-5 text-secondary-400 fill-current" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsLetter;