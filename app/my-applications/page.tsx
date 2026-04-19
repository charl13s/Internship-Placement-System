import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Building2, Calendar, CheckCircle2, Clock, XCircle, ArrowLeft, ExternalLink, Briefcase } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UpdateCVButton } from "@/components/UpdateCVButton"

export const dynamic = "force-dynamic"

// 🎨 DESIGN UPGRADE: Helper to generate a consistent, beautiful gradient based on the company name
const getGradient = (name: string) => {
    const gradients = [
        "bg-gradient-to-br from-blue-500 to-cyan-400",
        "bg-gradient-to-br from-indigo-500 to-purple-500",
        "bg-gradient-to-br from-emerald-500 to-teal-400",
        "bg-gradient-to-br from-rose-500 to-orange-400",
        "bg-gradient-to-br from-amber-500 to-yellow-400",
        "bg-gradient-to-br from-fuchsia-500 to-pink-500"
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
}

export default async function MyApplicationsPage() {
    const user = await currentUser()
    if (!user) redirect("/")

    const intern = await prisma.intern.findUnique({
        where: { clerkId: user.id }
    })

    if (!intern) redirect("/student-onboarding")

    const applications = await prisma.application.findMany({
        where: { internId: intern.id },
        orderBy: { createdAt: 'desc' },
        include: {
            listing: {
                include: {
                    organization: true
                }
            }
        }
    })

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    }

    // 🎨 DESIGN UPGRADE: Pill-shaped badges with softer colors
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Accepted":
                return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-4 py-1.5 shadow-none rounded-full border border-emerald-200"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Offer Extended</Badge>
            case "Rejected":
                return <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50 px-4 py-1.5 shadow-none rounded-full border border-red-200"><XCircle className="w-4 h-4 mr-1.5" /> Declined</Badge>
            default:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 px-4 py-1.5 shadow-none rounded-full"><Clock className="w-4 h-4 mr-1.5" /> In Review</Badge>
        }
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] pb-20">

            {/* 🎨 DESIGN UPGRADE: Dark Hero Header to anchor the page */}
            <div className="bg-neutral-900 text-white pb-24 pt-5 px-6">
                <div className="max-w-5xl mx-auto">

                    {/* Top Navigation Bar */}
                    <header className="flex items-center justify-between mb-16">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                                <div className="bg-white text-neutral-900 p-1 rounded-md">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                InternSystem
                            </div>
                            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                                <Link href="/" className="hover:text-white transition-colors">Job Feed</Link>
                                <span className="text-white border-b-2 border-white pb-1">My Applications</span>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <UserButton />
                        </div>
                    </header>

                    {/* Page Title */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-3">My Applications</h1>
                            <p className="text-neutral-400 text-lg">Track the status of your internship applications here.</p>
                        </div>
                        <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                            <Link href="/">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Browse More Jobs
                            </Link>
                        </Button>
                    </div>

                </div>
            </div>

            {/* Main Content (Pulls up over the dark header slightly) */}
            <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-10">

                {applications.length === 0 ? (
                    // Empty State
                    <div className="text-center py-24 bg-white rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-200/40">
                        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-100">
                            <Briefcase className="w-10 h-10 text-neutral-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-2">No applications yet</h3>
                        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-lg">You haven't applied to any roles yet. Head over to the feed to find your perfect match.</p>
                        <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-6 rounded-xl text-lg shadow-lg shadow-neutral-900/20 hover:-translate-y-0.5 transition-all">
                            <Link href="/">Explore Internships</Link>
                        </Button>
                    </div>
                ) : (
                    // Applications List
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <Card key={app.id} className="bg-white border-neutral-200/60 shadow-md shadow-neutral-200/30 hover:shadow-lg hover:shadow-neutral-200/50 transition-all rounded-2xl overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                                        {/* Left Side: Job & Company Info */}
                                        <div className="flex items-start gap-5">
                                            {/* 🎨 DESIGN UPGRADE: Dynamic Gradient Avatar */}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-inner ${getGradient(app.listing.organization.name)}`}>
                                                <span className="font-bold text-xl drop-shadow-md">
                                                    {app.listing.organization.name.substring(0, 1)}
                                                </span>
                                            </div>
                                            <div className="pt-1">
                                                <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                    {app.listing.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-500">
                                                    <span className="flex items-center gap-1.5 text-neutral-700">
                                                        <Building2 className="w-4 h-4 text-neutral-400" /> {app.listing.organization.name}
                                                    </span>
                                                    <span className="hidden sm:inline text-neutral-300">•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-neutral-400" /> Applied {formatDate(app.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Status & Action */}
                                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full border-t sm:border-0 border-neutral-100 pt-5 sm:pt-0 mt-3 sm:mt-0">

                                            {/* If the application is still Pending, show the Update button! */}
                                            {app.status === "Pending" && (
                                                <UpdateCVButton applicationId={app.id} currentCvUrl={intern.cvUrl} />
                                            )}

                                            {getStatusBadge(app.status)}

                                            <Button asChild variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full h-10 w-10 hidden sm:flex">
                                                <Link href={`/jobs/${app.listing.id}`}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

            </div>
        </main>
    )
}