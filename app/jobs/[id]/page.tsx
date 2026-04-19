import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { SignInButton } from "@clerk/nextjs"
import { ArrowLeft, Building2, Calendar, MapPin, CheckCircle2, Briefcase, Zap, CheckCircle } from "lucide-react"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params

    // 1. FETCH THE JOB
    const job = await prisma.listing.findUnique({
        where: { id: resolvedParams.id },
        include: { organization: true }
    })

    if (!job) redirect("/")

    // 2. CHECK USER STATUS
    const user = await currentUser()
    let hasApplied = false
    let isInternProfileComplete = false

    if (user) {
        const intern = await prisma.intern.findUnique({ where: { clerkId: user.id } })
        if (intern) {
            isInternProfileComplete = true
            const application = await prisma.application.findFirst({
                where: { listingId: job.id, internId: intern.id }
            })
            if (application) hasApplied = true
        }
    }

    // 3. THE 1-CLICK APPLY SERVER ACTION
    // 3. THE 1-CLICK APPLY SERVER ACTION
    async function applyForJob() {
        "use server"
        const currentUserObj = await currentUser()
        if (!currentUserObj) redirect("/")

        const currentIntern = await prisma.intern.findUnique({
            where: { clerkId: currentUserObj.id }
        })

        if (!currentIntern) redirect("/student-onboarding")

        // We must ensure they have a CV uploaded before the AI can read it!
        if (!currentIntern.cvUrl) {
            throw new Error("You must upload a CV to your profile before applying.");
        }

        let finalMatchScore = null;
        let aiExtractedSkills: string[] = [];

        // 🧠 Call the Python AI Engine!
        try {
            const aiResponse = await fetch("http://127.0.0.1:8000/api/applications/screen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    internId: currentIntern.id,
                    cvUrl: currentIntern.cvUrl,
                    requiredSkills: job!.requiredSkills
                })
            });

            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                finalMatchScore = aiData.matchScore;
                aiExtractedSkills = aiData.extractedSkills;
            } else {
                console.error("AI Engine returned an error status.");
            }
        } catch (error) {
            console.error("Could not reach the Python AI Server. Is it running?", error);
        }

        // Save the Application AND the AI's math to the database
        await prisma.application.create({
            data: {
                listingId: job!.id,
                internId: currentIntern.id,
                status: "Pending",
                matchScore: finalMatchScore,
                extractedSkills: aiExtractedSkills
            }
        })

        revalidatePath(`/jobs/${job!.id}`)
        revalidatePath(`/my-applications`) // Ensure the student dashboard updates too!
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
    }

    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-20">

            {/* Top Navigation Bar */}
            <header className="w-full px-6 py-5 bg-white border-b border-neutral-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Feed
                    </Link>
                    <div className="flex items-center gap-2 text-neutral-900 font-bold text-lg tracking-tight">
                        <div className="bg-neutral-900 text-white p-1 rounded-md">
                            <Building2 className="w-4 h-4" />
                        </div>
                        InternSystem
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT COLUMN: Job Details */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Header Info */}
                        <div>
                            {/* Premium Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center mb-6 shadow-md border border-neutral-800">
                                <span className="font-bold text-white text-3xl">
                                    {job.organization.name.substring(0, 1)}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-neutral-600 font-medium mb-6">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" /> {job.organization.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-neutral-300">
                                    <span>•</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" /> Remote / Hybrid
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {job.status === "OPEN" ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none hover:bg-emerald-50 px-3 py-1 text-sm font-semibold">
                                        Actively Hiring
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-neutral-200 text-neutral-600 shadow-none px-3 py-1 text-sm">
                                        Listing Closed
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <hr className="border-neutral-200" />

                        {/* Required Skills */}
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 mb-4">Required Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {job.requiredSkills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="bg-white border border-neutral-200 text-neutral-700 font-medium text-sm px-4 py-2 shadow-sm hover:border-neutral-300 transition-colors">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Job Description */}
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 mb-4">About the Role</h2>
                            <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed space-y-6">
                                <p>
                                    As a {job.title} at {job.organization.name}, you will have the opportunity to work alongside experienced professionals and make a direct impact on our core products. We are looking for passionate, driven students who are eager to learn and grow in a fast-paced environment.
                                </p>

                                {/* Visual Breakup: Responsibilities List */}
                                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">What you'll do</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Collaborate cross-functionally with engineering and design teams.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Tackle real-world challenges and contribute to production-level code/projects.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Gain hands-on experience that will accelerate your career in the tech industry.</span>
                                        </li>
                                    </ul>
                                </div>

                                <p>
                                    If you are ready to take the next step in your career and build things that matter, we encourage you to apply.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Action Card */}
                    <div className="lg:col-span-1">
                        {/* Added a subtle top border color to make the card pop */}
                        <Card className="sticky top-28 shadow-xl border-neutral-200 border-t-4 border-t-neutral-900 bg-white">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-neutral-900 text-lg mb-6">Apply for this Role</h3>

                                <div className="space-y-5 mb-8">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-neutral-100 p-2 rounded-lg">
                                            <Briefcase className="w-5 h-5 text-neutral-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900">Experience Level</p>
                                            <p className="text-sm text-neutral-500">Student / Internship</p>
                                        </div>
                                    </div>

                                    {job.closingDate && (
                                        <div className="flex items-start gap-3">
                                            <div className="bg-neutral-100 p-2 rounded-lg">
                                                <Calendar className="w-5 h-5 text-neutral-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-900">Application Deadline</p>
                                                <p className="text-sm text-neutral-500">{formatDate(job.closingDate)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* THE SMART BUTTON LOGIC */}
                                {job.status === "CLOSED" ? (
                                    <Button disabled className="w-full bg-neutral-100 text-neutral-400 cursor-not-allowed py-6 text-lg font-bold">
                                        Listing Closed
                                    </Button>
                                ) : !user ? (
                                    <SignInButton mode="modal">
                                        <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-6 text-lg shadow-md transition-all">
                                            Sign in to Apply
                                        </Button>
                                    </SignInButton>
                                ) : hasApplied ? (
                                    <Button disabled className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-100 font-bold py-6 text-lg">
                                        <CheckCircle2 className="w-5 h-5 mr-2" /> Applied
                                    </Button>
                                ) : (
                                    <form action={applyForJob}>
                                        <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-6 text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                            <Zap className="w-5 h-5 fill-current" />
                                            Apply
                                        </Button>
                                    </form>
                                )}

                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </main>
    )
}