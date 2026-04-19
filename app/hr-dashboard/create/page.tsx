import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import DashboardShell from "@/components/DashboardShell"
import { ArrowLeft, Building2 } from "lucide-react"

// Import our new intelligent Client Component
import CreateJobForm from "@/components/CreateJobForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function CreateJobPage() {
    const user = await currentUser()
    if (!user) redirect("/")

    const company = await prisma.organization.findUnique({
        where: { clerkId: user.id }
    })

    if (!company) redirect("/hr-onboarding")

    return (
        <DashboardShell title="Post New Job" userRole="HR">
            <div className="max-w-2xl mx-auto mt-4">

                <Link href="/hr-dashboard" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2 mb-6 transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <Card className="w-full shadow-sm border-neutral-200">
                    <CardHeader className="pb-6">
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{company.name}</span>
                        </div>

                        <CardTitle className="text-2xl font-bold text-neutral-900">Post a New Internship</CardTitle>
                        <CardDescription className="text-neutral-500 text-sm mt-1">
                            Create a targeted listing to attract top student talent using our AI assistant.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* Render the interactive form and pass it the required ID */}
                        <CreateJobForm companyId={company.id} />
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}