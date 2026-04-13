import Link from "next/link"
import { GraduationCap, Building2, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function OnboardingSelectionPage() {
    return (
        <main className="min-h-screen bg-[#FAFAFA] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-6 relative">
            <div className="w-full max-w-4xl relative z-10">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-3">Welcome to InternSystem</h1>
                    <p className="text-neutral-500 text-lg">How would you like to use the platform?</p>
                </div>

                {/* Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Path 1: Student */}
                    <Link href="/student-onboarding" className="group focus:outline-none">
                        <Card className="h-full bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-lg shadow-neutral-200/40 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-200 transition-all duration-300 rounded-3xl overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-blue-500 group-hover:-translate-y-1">
                            <CardContent className="p-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <GraduationCap className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-900 mb-3">I'm a Student</h2>
                                <p className="text-neutral-500 mb-8">I want to build my profile, discover internships, and apply to top companies.</p>
                                <div className="mt-auto flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                    Build Student Profile <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Path 2: Employer / HR */}
                    <Link href="/hr-onboarding" className="group focus:outline-none">
                        <Card className="h-full bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-lg shadow-neutral-200/40 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-200 transition-all duration-300 rounded-3xl overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-emerald-500 group-hover:-translate-y-1">
                            <CardContent className="p-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-900 mb-3">I'm an Employer</h2>
                                <p className="text-neutral-500 mb-8">I want to post internship opportunities, review CVs, and hire the best talent.</p>
                                <div className="mt-auto flex items-center text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                                    Register Company <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                </div>

                {/* Decorative blur */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/40 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
            </div>
        </main>
    )
}