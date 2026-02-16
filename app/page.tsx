import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>

            <div className="relative container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto">
                    {/* Header with Animation */}
                    <div className="text-center mb-16 animate-fadeInUp">
                        <div className="inline-block mb-6">
                            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                <span className="text-4xl">🏥</span>
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-extrabold mb-6">
                            <span className="text-gradient">MediConsult</span>
                        </h1>
                        <p className="text-2xl md:text-3xl text-gray-700 font-medium mb-4">
                            Secure Medical Consultation Platform
                        </p>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Production-grade healthcare platform with military-level security, audit logging, and HIPAA-aligned principles
                        </p>
                    </div>

                    {/* Features Grid with Staggered Animation */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="medical-card hover-lift animate-fadeInUp group" style={{ animationDelay: '0.1s' }}>
                            <div className="stat-icon mb-4 group-hover:scale-110 transition-transform duration-300">
                                🔒
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-gray-900">Secure & Private</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Role-based access control with comprehensive audit logging and end-to-end encryption
                            </p>
                            <div className="mt-4 flex items-center text-sm text-blue-600 font-semibold">
                                <span>Learn more</span>
                                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>

                        <div className="medical-card hover-lift animate-fadeInUp group" style={{ animationDelay: '0.2s' }}>
                            <div className="stat-icon mb-4 group-hover:scale-110 transition-transform duration-300">
                                📋
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-gray-900">Immutable Records</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Medical data immutability with SHA256 verification for legal compliance and forensic integrity
                            </p>
                            <div className="mt-4 flex items-center text-sm text-purple-600 font-semibold">
                                <span>Learn more</span>
                                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>

                        <div className="medical-card hover-lift animate-fadeInUp group" style={{ animationDelay: '0.3s' }}>
                            <div className="stat-icon mb-4 group-hover:scale-110 transition-transform duration-300">
                                ✓
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-gray-900">Verified Doctors</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Only verified medical professionals can prescribe medications and order diagnostic tests
                            </p>
                            <div className="mt-4 flex items-center text-sm text-green-600 font-semibold">
                                <span>Learn more</span>
                                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section with Glassmorphism */}
                    <div className="glass-card max-w-md mx-auto p-8 rounded-3xl shadow-premium animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Get Started</h2>
                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="block btn-primary text-center text-lg group"
                            >
                                <span className="flex items-center justify-center">
                                    Login
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </Link>
                            <Link
                                href="/register"
                                className="block btn-secondary text-center text-lg group"
                            >
                                <span className="flex items-center justify-center">
                                    Create Account
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </span>
                            </Link>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Quick Access Portals:</p>
                            <div className="flex gap-2 text-xs justify-center flex-wrap">
                                <Link href="/patient" className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:shadow-md transition-all font-medium">
                                    👤 Patient Dashboard
                                </Link>
                                <Link href="/doctor" className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg hover:shadow-md transition-all font-medium">
                                    🩺 Doctor Portal
                                </Link>
                                <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-lg hover:shadow-md transition-all font-medium">
                                    ⚙️ Admin Panel
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid md:grid-cols-4 gap-6 mt-16 mb-12">
                        <div className="stat-card text-center animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                            <div className="text-4xl font-bold text-gradient mb-2">100%</div>
                            <div className="text-sm font-medium text-gray-600">Secure & Compliant</div>
                        </div>
                        <div className="stat-card text-center animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                            <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
                            <div className="text-sm font-medium text-gray-600">Audit Logging</div>
                        </div>
                        <div className="stat-card text-center animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
                            <div className="text-4xl font-bold text-gradient mb-2">SHA256</div>
                            <div className="text-sm font-medium text-gray-600">File Integrity</div>
                        </div>
                        <div className="stat-card text-center animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
                            <div className="text-4xl font-bold text-gradient mb-2">RBAC</div>
                            <div className="text-sm font-medium text-gray-600">Access Control</div>
                        </div>
                    </div>

                    {/* Footer Notice */}
                    <div className="emergency-notice max-w-3xl mx-auto text-center animate-fadeInUp" style={{ animationDelay: '0.9s' }}>
                        <p className="text-sm font-semibold text-yellow-900 mb-2">
                            ⚠️ Enterprise-Grade Security
                        </p>
                        <p className="audit-notice text-gray-700">
                            All consultations are encrypted, logged, and legally auditable. Every action is tracked for
                            your protection and compliance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
