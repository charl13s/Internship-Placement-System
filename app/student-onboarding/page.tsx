import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"
import { GraduationCap, Sparkles, Phone, FileText, UploadCloud } from "lucide-react"

// Shadcn Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import SiteHeader from "@/components/SiteHeader"
export const dynamic = "force-dynamic"

export default async function StudentOnboardingPage() {
    const user = await currentUser()
    if (!user) redirect("/")

    const existingProfile = await prisma.intern.findUnique({
        where: { clerkId: user.id }
    })

    if (existingProfile) redirect("/")

    const clerkId = user.id
    const userEmail = user.emailAddresses[0].emailAddress

    // SERVER ACTION (Database & Supabase File Upload)
    async function completeProfile(formData: FormData) {
        "use server"

        const firstName = formData.get("firstName") as string
        const middleName = formData.get("middleName") as string
        const lastName = formData.get("lastName") as string
        const phone = formData.get("phone") as string
        const course = formData.get("course") as string
        const skillsString = formData.get("skills") as string
        const cvFile = formData.get("cv") as File

        const skillsArray = skillsString.split(",").map(skill => skill.trim()).filter(Boolean)

        let uploadedCvUrl = null

        if (cvFile && cvFile.size > 0) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const fileName = `${clerkId}-${Date.now()}.pdf`

            const { data, error } = await supabase.storage
                .from('resumes')
                .upload(fileName, cvFile, {
                    contentType: 'application/pdf',
                })

            if (!error) {
                const { data: publicUrlData } = supabase.storage
                    .from('resumes')
                    .getPublicUrl(fileName)

                uploadedCvUrl = publicUrlData.publicUrl
            }
        }

        await prisma.intern.create({
            data: {
                clerkId: clerkId,
                email: userEmail,
                firstName: firstName,
                middleName: middleName || null,
                lastName: lastName,
                phone: phone || null,
                course: course,
                keySkills: skillsArray,
                cvUrl: uploadedCvUrl,
            }
        })

        redirect("/")
    }

    return (
        // 🎨 DESIGN UPGRADE: Added dot-matrix background pattern
        <main className="min-h-screen bg-[#FAFAFA] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-6 relative">
            <SiteHeader variant="onboarding" />
            <div className="w-full max-w-2xl relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    {/* 🎨 DESIGN UPGRADE: Premium gradient icon with shadow */}
                    <div className="inline-flex bg-gradient-to-br from-neutral-800 to-black text-white p-4 rounded-2xl mb-5 shadow-lg shadow-neutral-900/20 ring-1 ring-neutral-900/5">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">Complete Your Profile</h1>
                    <p className="text-neutral-500 text-sm md:text-base">Let companies know what you're studying and upload your CV before you apply.</p>
                </div>

                {/* Onboarding Form */}
                {/* 🎨 DESIGN UPGRADE: Glassmorphism card effect with softer shadow */}
                <Card className="shadow-2xl shadow-neutral-200/50 border-neutral-200/60 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <form action={completeProfile}>
                        <CardContent className="space-y-7 pt-8 px-6 md:px-8">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider">First Name</Label>
                                    <Input id="firstName" name="firstName" required defaultValue={user.firstName || ""} className="bg-white border-neutral-200 focus-visible:ring-neutral-900 shadow-sm rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="middleName" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex justify-between">
                                        Middle Name <span className="text-neutral-400 font-normal normal-case tracking-normal">(Optional)</span>
                                    </Label>
                                    <Input id="middleName" name="middleName" className="bg-white border-neutral-200 focus-visible:ring-neutral-900 shadow-sm rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider">Last Name</Label>
                                    <Input id="lastName" name="lastName" required defaultValue={user.lastName || ""} className="bg-white border-neutral-200 focus-visible:ring-neutral-900 shadow-sm rounded-lg" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-neutral-400" /> Phone Number
                                </Label>
                                <Input id="phone" name="phone" type="tel" required placeholder="+254 700 000 000" className="bg-white border-neutral-200 focus-visible:ring-neutral-900 shadow-sm rounded-lg" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="course" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider">University Course / Major</Label>
                                <Input id="course" name="course" required placeholder="e.g. B.Sc. Computer Science" className="bg-white border-neutral-200 focus-visible:ring-neutral-900 shadow-sm rounded-lg" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skills" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider">Top Skills</Label>
                                <Input id="skills" name="skills" required placeholder="e.g. React, Python, Data Analysis" className="bg-white border-neutral-200 focus-visible:ring-neutral-900 shadow-sm rounded-lg" />
                                <p className="text-xs text-neutral-500 mt-1">Separate your skills with commas. These will be highlighted to employers!</p>
                            </div>

                            {/* 🎨 DESIGN UPGRADE: Styled dashed dropzone area */}
                            <div className="pt-4 border-t border-neutral-100">
                                <Label className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                    <FileText className="w-3.5 h-3.5 text-neutral-400" /> Upload Resume (PDF)
                                </Label>
                                <div className="relative group bg-neutral-50/50 border-2 border-dashed border-neutral-200 hover:border-neutral-300 rounded-xl transition-all duration-200 p-4 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center shrink-0">
                                        <UploadCloud className="w-5 h-5 text-neutral-500" />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <input
                                            type="file"
                                            name="cv"
                                            accept=".pdf"
                                            required
                                            className="w-full text-sm text-neutral-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 file:transition-colors file:cursor-pointer cursor-pointer focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                        </CardContent>

                        <CardFooter className="pb-8 pt-4 px-6 md:px-8">
                            <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-6 text-lg transition-all shadow-xl shadow-neutral-900/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 rounded-xl">
                                <Sparkles className="w-5 h-5" />
                                Save Profile & Continue
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