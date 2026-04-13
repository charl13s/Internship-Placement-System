import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import DashboardShell from "@/components/DashboardShell"
import { Briefcase, Calendar, Users, Plus, Power, PowerOff } from "lucide-react"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function HRDashboard() {
    const user = await currentUser()
    if (!user) redirect("/")
    // 🚨 THE AUTO-SWEEP: Close any jobs where the deadline has passed!
    await prisma.listing.updateMany({
        where: {
            organization: { clerkId: user.id }, // Only sweep their own jobs
            status: "OPEN",                     // Only look at open jobs
            closingDate: {
                lt: new Date()                    // "lt" means Less Than right now!
            }
        },
        data: {
            status: "CLOSED"                    // Snap them shut!
        }
    })

    const company = await prisma.organization.findUnique({
        where: { clerkId: user.id },
        include: {
            listings: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                include: { applications: true }
            }
        }
    })

    if (!company) redirect("/hr-onboarding")

    // --- SERVER ACTIONS ---
    async function toggleJobStatus(formData: FormData) {
        "use server"
        const jobId = formData.get("jobId") as string
        const currentStatus = formData.get("currentStatus") as string

        if (currentStatus === "OPEN") {
            // If it's open, just close it normally.
            await prisma.listing.update({
                where: { id: jobId },
                data: { status: "CLOSED" }
            })
        } else {
            // 🚨 THE FIX: If reopening, flip status AND wipe the old date!
            await prisma.listing.update({
                where: { id: jobId },
                data: {
                    status: "OPEN",
                    closingDate: null // Clears the past date so the auto-sweep ignores it
                }
            })
        }

        revalidatePath("/hr-dashboard")
        revalidatePath("/")
    }

    async function updateDeadline(formData: FormData) {
        "use server"
        const jobId = formData.get("jobId") as string
        const dateStr = formData.get("closingDate") as string
        const newDate = dateStr ? new Date(dateStr) : null

        await prisma.listing.update({ where: { id: jobId }, data: { closingDate: newDate } })
        revalidatePath("/hr-dashboard")
        revalidatePath("/")
    }

    // --- THE UI ---
    return (
        <DashboardShell title={company.name} userRole="HR">

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Your Listings</h2>
                    <p className="text-neutral-500">Manage your internship posts and track incoming applicants.</p>
                </div>

                <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm transition-all">
                    <Link href="/hr-dashboard/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Internship
                    </Link>
                </Button>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {company.listings.length === 0 ? (
                    <Card className="col-span-full border-dashed bg-neutral-50 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <Briefcase className="w-12 h-12 text-neutral-300 mb-4" />
                            <p className="text-neutral-500 font-medium mb-4">You haven't posted any internships yet.</p>

                            <Button asChild variant="outline">
                                <Link href="/hr-dashboard/create">Create your first listing</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    company.listings.map((job) => (
                        <Card key={job.id} className={`flex flex-col transition-all ${job.status === 'CLOSED' ? 'opacity-75 bg-neutral-50' : ''}`}>

                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl leading-tight text-neutral-900">
                                        {job.title}
                                    </CardTitle>
                                    <Badge variant={job.status === "OPEN" ? "default" : "secondary"} className={
                                        job.status === "OPEN"
                                            ? "bg-emerald-100 text-emerald-800 shadow-none hover:bg-emerald-100"
                                            : "bg-neutral-200 text-neutral-600 hover:bg-neutral-200"
                                    }>
                                        {job.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 pb-4">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {job.requiredSkills.map(skill => (
                                        <Badge key={skill} variant="secondary" className="bg-neutral-100 text-neutral-600 font-normal hover:bg-neutral-100">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                                    <div>
                                        <form action={updateDeadline} className="flex flex-col gap-2">
                                            <input type="hidden" name="jobId" value={job.id} />
                                            <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1 uppercase tracking-wider">
                                                <Calendar className="w-3 h-3" /> Deadline
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    name="closingDate"
                                                    min={new Date().toISOString().split("T")[0]} /* 🚨 Added the min attribute here too */
                                                    defaultValue={job.closingDate ? job.closingDate.toISOString().split('T')[0] : ''}
                                                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                                                />
                                                <Button type="submit" variant="secondary" size="sm" className="h-9">Save</Button>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="flex flex-col justify-center">
                                        <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1 uppercase tracking-wider mb-2">
                                            <Users className="w-3 h-3" /> Applicants
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-neutral-900 leading-none">{job.applications.length}</span>
                                            <span className="text-sm text-neutral-500 leading-none">students</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-neutral-50/50 border-t px-6 py-4 flex gap-3 justify-between items-center">
                                <form action={toggleJobStatus}>
                                    <input type="hidden" name="jobId" value={job.id} />
                                    <input type="hidden" name="currentStatus" value={job.status} />
                                    <Button type="submit" variant="ghost" className={`h-9 px-3 text-sm flex items-center gap-2 ${job.status === 'OPEN' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                                        {job.status === "OPEN" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                        {job.status === "OPEN" ? "Close Listing" : "Reopen Listing"}
                                    </Button>
                                </form>

                                <Button asChild variant="default" className="bg-neutral-900 hover:bg-neutral-800 text-white">
                                    <Link href={`/hr-dashboard/job/${job.id}`}>
                                        Review Applicants →
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </DashboardShell>
    )
}