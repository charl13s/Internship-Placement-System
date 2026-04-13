import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import DashboardShell from "@/components/DashboardShell"
import { ArrowLeft, Building2 } from "lucide-react"

// Shadcn Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function CreateJobPage() {
    const user = await currentUser()
    if (!user) redirect("/")

    const company = await prisma.organization.findUnique({
        where: { clerkId: user.id }
    })

    if (!company) redirect("/hr-onboarding")

    // SERVER ACTION
    async function createListing(formData: FormData) {
        "use server"

        const title = formData.get("title") as string
        const skillsString = formData.get("skills") as string
        const skillsArray = skillsString.split(",").map(skill => skill.trim()).filter(Boolean)

        const closingDateStr = formData.get("closingDate") as string
        const closingDate = closingDateStr ? new Date(closingDateStr) : null

        await prisma.listing.create({
            data: {
                title: title,
                requiredSkills: skillsArray,
                closingDate: closingDate,
                organizationId: company!.id
            }
        })

        redirect("/hr-dashboard")
    }

    return (
        <DashboardShell title="Post New Job" userRole="HR">
            <div className="max-w-2xl mx-auto mt-4">

                {/* 🚨 The New Back Button */}
                <Link href="/hr-dashboard" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2 mb-6 transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <Card className="w-full shadow-sm border-neutral-200">
                    <CardHeader className="pb-6">
                        {/* 🚨 The Company Name Context */}
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{company.name}</span>
                        </div>

                        <CardTitle className="text-2xl font-bold text-neutral-900">Post a New Internship</CardTitle>
                        <CardDescription className="text-neutral-500 text-sm mt-1">
                            Create a targeted listing to attract top student talent.
                        </CardDescription>
                    </CardHeader>

                    <form action={createListing}>
                        <CardContent className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-neutral-900 font-medium">Job Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    required
                                    placeholder="e.g. Software Engineering Intern"
                                    className="bg-white focus-visible:ring-neutral-900 text-neutral-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skills" className="text-neutral-900 font-medium">Required Skills</Label>
                                <Input
                                    id="skills"
                                    name="skills"
                                    required
                                    placeholder="Python, React, Data Analysis"
                                    className="bg-white focus-visible:ring-neutral-900 text-neutral-900"
                                />
                                <p className="text-[11px] text-neutral-500">Please separate skills with commas.</p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-neutral-100">
                                <Label htmlFor="closingDate" className="text-neutral-900 font-medium">Application Deadline</Label>
                                <Input
                                    id="closingDate"
                                    type="date"
                                    name="closingDate"
                                    min={new Date().toISOString().split("T")[0]} /* 🚨 Prevents past dates */
                                    className="bg-white text-neutral-900 focus-visible:ring-neutral-900 w-full"
                                />
                                <p className="text-[11px] text-neutral-500">Leave blank to keep the listing open indefinitely.</p>
                            </div>

                        </CardContent>

                        <CardFooter className="pt-6 pb-6 px-6 flex justify-start gap-3 bg-neutral-50/50 rounded-b-xl border-t border-neutral-100">
                            <Button asChild variant="outline" className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 bg-white">
                                <Link href="/hr-dashboard">Cancel</Link>
                            </Button>
                            <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white">
                                Publish Listing
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardShell>
    )
}