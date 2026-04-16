import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Building2, Sparkles, MapPin, Globe, AlignLeft } from "lucide-react"

// Shadcn Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import SiteHeader from "@/components/SiteHeader"
export const dynamic = "force-dynamic"

export default async function HROnboardingPage() {
    const user = await currentUser()
    if (!user) redirect("/")

    // Ensure they haven't already registered a company
    const existingOrg = await prisma.organization.findUnique({
        where: { clerkId: user.id }
    })

    // If they already have an org, send them to the HR Dashboard (which we will build next)
    if (existingOrg) redirect("/hr-dashboard")

    const clerkId = user.id
    const userEmail = user.emailAddresses[0].emailAddress

    // SERVER ACTION: Save Organization to Database
    async function completeHROnboarding(formData: FormData) {
        "use server"

        const name = formData.get("name") as string
        const website = formData.get("website") as string
        const location = formData.get("location") as string
        const description = formData.get("description") as string

        await prisma.organization.create({
            data: {
                clerkId: clerkId,
                email: userEmail,
                name: name,
                website: website || null,
                location: location || null,
                description: description || null,
                // We set new companies as unverified by default. You can change this in the DB later!
                isVerified: false,
            }
        })

        redirect("/hr-dashboard")
    }

    return (
        <main className="min-h-screen bg-[#FAFAFA] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-6 relative">
            <SiteHeader variant="onboarding" />
            <div className="w-full max-w-2xl relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-4 rounded-2xl mb-5 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-900/5">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">Register Your Organization</h1>
                    <p className="text-neutral-500 text-sm md:text-base">Set up your company profile so students can learn more about you.</p>
                </div>

                {/* HR Onboarding Form */}
                <Card className="shadow-2xl shadow-neutral-200/50 border-neutral-200/60 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <form action={completeHROnboarding}>
                        <CardContent className="space-y-7 pt-8 px-6 md:px-8">

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider">Company Name</Label>
                                <Input id="name" name="name" required placeholder="e.g. Acme Technologies" className="bg-white border-neutral-200 focus-visible:ring-emerald-600 shadow-sm rounded-lg" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-neutral-400" /> Website (Optional)
                                    </Label>
                                    <Input id="website" name="website" type="url" placeholder="https://acme.com" className="bg-white border-neutral-200 focus-visible:ring-emerald-600 shadow-sm rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-neutral-400" /> Location / HQ
                                    </Label>
                                    <Input id="location" name="location" required placeholder="e.g. Nairobi, Kenya or Remote" className="bg-white border-neutral-200 focus-visible:ring-emerald-600 shadow-sm rounded-lg" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <AlignLeft className="w-3.5 h-3.5 text-neutral-400" /> Company Description
                                </Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    required
                                    rows={4}
                                    placeholder="Tell students about your mission, culture, and the kind of interns you are looking for..."
                                    className="w-full text-sm p-3 bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm rounded-lg resize-none"
                                />
                            </div>

                        </CardContent>

                        <CardFooter className="pb-8 pt-4 px-6 md:px-8">
                            <Button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold py-6 text-lg transition-all shadow-xl shadow-emerald-900/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 rounded-xl">
                                <Sparkles className="w-5 h-5" />
                                Save Organization & Continue
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Decorative background blur element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/40 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
            </div>
        </main>
    )
}