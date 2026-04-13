import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import DashboardShell from "@/components/DashboardShell"
import { CheckCircle2, XCircle, Globe, Mail, MapPin, Building2 } from "lucide-react"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const dynamic = "force-dynamic"

// 🚨 THE MASTER KEY
const ADMIN_EMAILS = [
    "charlesmuragey.gm@gmail.com"
]

export default async function AdminDashboard() {
    const user = await currentUser()
    if (!user) redirect("/")

    const userEmail = user.emailAddresses[0].emailAddress
    if (!ADMIN_EMAILS.includes(userEmail)) {
        redirect("/welcome")
    }

    // FETCH DATA: The "Ghost Filter" is active
    const allCompanies = await prisma.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }
    })

    const pendingCompanies = allCompanies.filter(c => !c.isVerified)
    const verifiedCompanies = allCompanies.filter(c => c.isVerified)

    // --- SERVER ACTIONS ---
    async function verifyCompany(formData: FormData) {
        "use server"
        const orgId = formData.get("orgId") as string
        await prisma.organization.update({ where: { id: orgId }, data: { isVerified: true } })
        revalidatePath("/admin")
        revalidatePath("/")
    }

    async function revokeAccess(formData: FormData) {
        "use server"
        const orgId = formData.get("orgId") as string
        await prisma.organization.update({ where: { id: orgId }, data: { isVerified: false } })
        revalidatePath("/admin")
        revalidatePath("/")
    }

    async function rejectAndDelete(formData: FormData) {
        "use server"
        const orgId = formData.get("orgId") as string
        await prisma.listing.updateMany({ where: { organizationId: orgId }, data: { deletedAt: new Date() } })
        await prisma.organization.update({ where: { id: orgId }, data: { deletedAt: new Date(), isVerified: false } })
        revalidatePath("/admin")
        revalidatePath("/")
    }

    // --- THE UI ---
    return (
        <DashboardShell title="Platform Command Center" userRole="Admin">

            {/* SECTION 1: PENDING COMPANIES */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Pending Verification</h2>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {pendingCompanies.length} Action Required
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {pendingCompanies.length === 0 ? (
                        <Card className="border-dashed bg-neutral-50 shadow-none">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <CheckCircle2 className="w-12 h-12 text-neutral-300 mb-4" />
                                <p className="text-neutral-500 font-medium">Inbox zero! All organizations are verified.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingCompanies.map((company) => (
                            <Card key={company.id} className="overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-neutral-400" />
                                                {company.name}
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-neutral-500">
                                                Requested access to post on the platform.
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                            Pending Review
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600 bg-neutral-50 p-4 rounded-md border border-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-neutral-400" />
                                            <a href={`mailto:${company.email}`} className="hover:text-neutral-900 hover:underline">{company.email}</a>
                                        </div>
                                        {company.website && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-neutral-400" />
                                                <a href={company.website} target="_blank" className="hover:text-neutral-900 hover:underline">{company.website}</a>
                                            </div>
                                        )}
                                        {company.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-neutral-400" />
                                                <span>{company.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="bg-neutral-50/50 border-t px-6 py-4 flex gap-3 justify-end">
                                    <form action={rejectAndDelete}>
                                        <input type="hidden" name="orgId" value={company.id} />
                                        <Button type="submit" variant="destructive" className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            Reject & Delete
                                        </Button>
                                    </form>
                                    <form action={verifyCompany}>
                                        <input type="hidden" name="orgId" value={company.id} />
                                        <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Approve & Verify
                                        </Button>
                                    </form>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* SECTION 2: VERIFIED COMPANIES (DATA TABLE) */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Active Organizations</h2>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        {verifiedCompanies.length} Active
                    </Badge>
                </div>

                <Card>
                    {verifiedCompanies.length === 0 ? (
                        <CardContent className="p-8 text-center text-neutral-500">
                            No active companies on the platform yet.
                        </CardContent>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Contact Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {verifiedCompanies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">{company.name}</TableCell>
                                        <TableCell className="text-neutral-500">{company.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                Verified
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <form action={revokeAccess}>
                                                <input type="hidden" name="orgId" value={company.id} />
                                                <Button type="submit" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 px-3 text-xs">
                                                    Revoke Access
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

        </DashboardShell>
    )
}