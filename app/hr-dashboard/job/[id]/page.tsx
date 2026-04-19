import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import DashboardShell from "@/components/DashboardShell"
import { ArrowLeft, Check, X, Mail, GraduationCap, SearchX, Sparkles } from "lucide-react"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export const dynamic = "force-dynamic"

export default async function JobPipelinePage({ params }: { params: { Id: string } }) {
    const user = await currentUser()
    if (!user) redirect("/")

    const job = await prisma.listing.findFirst({
        where: {
            id: params.Id,
            organization: { clerkId: user.id }
        },
        include: {
            applications: {
                include: { intern: true },
                // 🧠 AI MAGIC: Sort by Match Score first, then by date applied
                orderBy: [
                    { matchScore: 'desc' },
                    { createdAt: 'desc' }
                ]
            }
        }
    })

    if (!job) redirect("/hr-dashboard")

    async function updateApplicationStatus(formData: FormData) {
        "use server"
        const appId = formData.get("appId") as string
        const newStatus = formData.get("status") as string

        await prisma.application.update({
            where: { id: appId },
            data: { status: newStatus }
        })

        revalidatePath(`/hr-dashboard/job/${params.Id}`)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Accepted": return <Badge className="bg-emerald-100 text-emerald-800 shadow-none px-2 py-1 hover:bg-emerald-100">Accepted</Badge>
            case "Rejected": return <Badge variant="destructive" className="bg-red-100 text-red-800 shadow-none px-2 py-1 hover:bg-red-100">Declined</Badge>
            default: return <Badge variant="secondary" className="bg-amber-100 text-amber-800 shadow-none px-2 py-1 hover:bg-amber-100">Pending</Badge>
        }
    }

    return (
        <DashboardShell title={job.title} userRole="HR">

            <div className="mb-8">
                <Link href="/hr-dashboard" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2 mb-4 transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">{job.title}</h2>
                    <Badge variant="outline" className="text-neutral-500">
                        {job.applications.length} Total Applicants
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader className="bg-neutral-50/50 border-b pb-4">
                    <CardTitle>Applicant Pool</CardTitle>
                    <CardDescription>Review and manage incoming applications. AI auto-sorts your best matches to the top.</CardDescription>
                </CardHeader>

                {job.applications.length === 0 ? (
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <SearchX className="w-12 h-12 text-neutral-300 mb-4" />
                        <p className="text-neutral-500 font-medium">No applications yet.</p>
                        <p className="text-sm text-neutral-400 mt-1">Check back later when students start applying.</p>
                    </CardContent>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                                <TableHead className="w-[250px] py-4">Student Candidate</TableHead>
                                <TableHead className="py-4">Contact</TableHead>
                                <TableHead className="py-4">Course / Major</TableHead>
                                <TableHead className="text-center py-4">AI Score</TableHead>
                                <TableHead className="py-4">Status</TableHead>
                                <TableHead className="text-center py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {job.applications.map((app) => (
                                <TableRow key={app.id} className={`transition-colors ${app.status !== 'Pending' ? 'bg-neutral-50/30' : ''}`}>

                                    <TableCell className="py-4">
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <div className="flex items-center gap-3 cursor-pointer w-fit group">
                                                    <Avatar className="h-9 w-9 border border-neutral-200 group-hover:border-neutral-400 transition-colors">
                                                        <AvatarFallback className="bg-neutral-100 text-neutral-700 font-medium text-xs">
                                                            {app.intern.firstName[0]}{app.intern.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-neutral-900 group-hover:underline decoration-neutral-300 underline-offset-4">
                                                        {app.intern.firstName} {app.intern.lastName}
                                                    </span>
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80 p-5 shadow-lg border-neutral-200">
                                                <div className="flex justify-between space-x-4">
                                                    <Avatar className="h-12 w-12 border border-neutral-200">
                                                        <AvatarFallback className="bg-neutral-900 text-white font-medium">
                                                            {app.intern.firstName[0]}{app.intern.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1 flex-1">
                                                        <h4 className="text-sm font-bold text-neutral-900">{app.intern.firstName} {app.intern.lastName}</h4>
                                                        <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                                                            <GraduationCap className="w-3 h-3" /> {app.intern.course}
                                                        </p>

                                                        {/* 🧠 AI MAGIC: Show what the AI verified from the CV */}
                                                        {app.extractedSkills && app.extractedSkills.length > 0 && (
                                                            <div className="pt-4 mt-4 border-t border-neutral-100">
                                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                    <Sparkles className="w-3 h-3" /> Verified by AI
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {app.extractedSkills.map((skill: string) => (
                                                                        <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-50">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    </TableCell>

                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                                            <Mail className="w-3 h-3" />
                                            <a href={`mailto:${app.intern.email}`} className="hover:text-neutral-900 hover:underline">
                                                {app.intern.email}
                                            </a>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                                            <GraduationCap className="w-4 h-4 text-neutral-400" />
                                            {app.intern.course}
                                        </div>
                                    </TableCell>

                                    {/* 🧠 AI MAGIC: Visual Match Score Column */}
                                    <TableCell className="py-4 text-center">
                                        {app.matchScore !== null ? (
                                            <Badge className={`shadow-none px-3 py-1 font-bold ${app.matchScore >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                    app.matchScore >= 50 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                        'bg-red-100 text-red-800 border-red-200'
                                                }`}>
                                                {app.matchScore}% Match
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-neutral-400 font-medium">Calculating...</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="py-4">
                                        {getStatusBadge(app.status)}
                                    </TableCell>

                                    <TableCell className="text-center py-4">
                                        {app.status === "Pending" ? (
                                            <div className="flex justify-center gap-2">
                                                <form action={updateApplicationStatus}>
                                                    <input type="hidden" name="appId" value={app.id} />
                                                    <input type="hidden" name="status" value="Rejected" />
                                                    <Button type="submit" variant="outline" className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors">
                                                        <X className="w-4 h-4 mr-1" /> Decline
                                                    </Button>
                                                </form>
                                                <form action={updateApplicationStatus}>
                                                    <input type="hidden" name="appId" value={app.id} />
                                                    <input type="hidden" name="status" value="Accepted" />
                                                    <Button type="submit" className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                                                        <Check className="w-4 h-4 mr-1" /> Accept
                                                    </Button>
                                                </form>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-300 font-medium block text-center">—</span>
                                        )}
                                    </TableCell>

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </DashboardShell>
    )
}