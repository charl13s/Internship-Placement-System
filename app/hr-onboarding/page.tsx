import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function HROnboardingPage() {
    const user = await currentUser()
    if (!user) redirect("/")

    const existingCompany = await prisma.organization.findUnique({ where: { clerkId: user.id } })
    if (existingCompany) redirect("/hr-dashboard")

    const clerkId = user.id;
    const userEmail = user.emailAddresses[0].emailAddress;

    async function registerCompany(formData: FormData) {
        "use server"

        const companyName = formData.get("companyName") as string
        const website = formData.get("website") as string
        const location = formData.get("location") as string
        const description = formData.get("description") as string

        await prisma.organization.create({
            data: {
                clerkId: clerkId,
                email: userEmail,
                name: companyName,
                website: website,
                location: location,
                description: description,
            }
        })

        redirect("/hr-dashboard")
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full border-t-4 border-emerald-500">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Company Registration</h1>
                <p className="text-slate-500 mb-6">Complete your organization profile to build trust with students.</p>

                <form action={registerCompany} className="flex flex-col gap-4">

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Official Company Name *</label>
                        <input name="companyName" required className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. KCB Group" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700">Company Website</label>
                            <input name="website" type="url" className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700">Headquarters Location</label>
                            <input name="location" className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Nairobi, Kenya" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700">Company Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Briefly describe what your organization does..."
                        />
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md">
                        <p className="text-xs text-emerald-800">
                            <strong>Verification Tip:</strong> Providing a valid company website and physical office location speeds up the verification process significantly.
                        </p>
                    </div>

                    <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Register Organization
                    </Button>
                </form>
            </div>
        </main>
    )
}