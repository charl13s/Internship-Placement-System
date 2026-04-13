import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
    const user = await currentUser()

    if (!user) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center border-2 border-red-500">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Wait a minute!</h1>
                    <p className="text-slate-600">The server thinks you are NOT logged in.</p>
                </div>
            </main>
        )
    }

    // 1. GATEKEEPER: If they already have a profile, kick them to the homepage
    const existingProfile = await prisma.intern.findUnique({
        where: { clerkId: user.id }
    })

    if (existingProfile) {
        redirect("/")
    }

    // 2. EXTRACT STRINGS FOR THE SERVER ACTION
    const clerkId = user.id;
    const userEmail = user.emailAddresses[0].emailAddress;

    // 3. SERVER ACTION (Database & File Upload)
    async function completeProfile(formData: FormData) {
        "use server"

        const firstName = formData.get("firstName") as string
        const middleName = formData.get("middleName") as string
        const lastName = formData.get("lastName") as string
        const course = formData.get("course") as string
        const skillsString = formData.get("skills") as string
        const cvFile = formData.get("cv") as File

        const skillsArray = skillsString.split(",").map(skill => skill.trim())

        let uploadedCvUrl = null;

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
                course: course,
                keySkills: skillsArray,
                cvUrl: uploadedCvUrl,
            }
        })

        redirect("/")
    }

    // 4. THE UI
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full border-t-4 border-blue-600">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
                <p className="text-slate-500 mb-6">Let the HR departments know what you can do.</p>

                <form action={completeProfile} className="flex flex-col gap-4">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name *</label>
                            <input name="firstName" required className="w-full border rounded-md p-2" placeholder="Charles" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Middle Name</label>
                            <input name="middleName" className="w-full border rounded-md p-2" placeholder="(Optional)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name *</label>
                            <input name="lastName" required className="w-full border rounded-md p-2" placeholder="Murage" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">University Course *</label>
                        <input name="course" required className="w-full border rounded-md p-2" placeholder="Computer Science" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Top Skills (comma separated) *</label>
                        <input name="skills" required className="w-full border rounded-md p-2" placeholder="React, Python, Data Analysis" />
                    </div>

                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-md">
                        <label className="block text-sm font-medium mb-1 text-slate-700">Upload Resume (PDF) *</label>
                        <input
                            type="file"
                            name="cv"
                            accept=".pdf"
                            required
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                        Save Profile & Continue
                    </Button>
                </form>
            </div>
        </main>
    )
}