import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function WelcomePage() {
    const user = await currentUser()
    if (!user) redirect("/")

    // GATEKEEPER: If they already picked a path, send them to their respective homes
    const intern = await prisma.intern.findUnique({ where: { clerkId: user.id } })
    if (intern) redirect("/")

    const hr = await prisma.organization.findUnique({ where: { clerkId: user.id } })
    if (hr) redirect("/hr-dashboard")

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                <h1 className="text-4xl font-bold text-center mb-8 text-slate-900">Welcome! How do you want to use Antigravity?</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Path A: The Student */}
                    <Link href="/onboarding" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-500 transition-all h-full">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl mb-4">🎓</div>
                            <h2 className="text-2xl font-bold mb-2">I am a Student</h2>
                            <p className="text-slate-500">I want to upload my CV, build my profile, and apply for internships.</p>
                        </div>
                    </Link>

                    {/* Path B: The Employer */}
                    <Link href="/hr-onboarding" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-transparent hover:border-emerald-500 transition-all h-full">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-2xl mb-4">🏢</div>
                            <h2 className="text-2xl font-bold mb-2">I am an Employer</h2>
                            <p className="text-slate-500">I represent a company and I want to post job listings and hire interns.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    )
}