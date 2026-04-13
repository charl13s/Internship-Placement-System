import { Intern, Organization } from "@prisma/client"
import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export default async function JobCard({ job }: { job: any }) {
    const user = await currentUser()

    let intern: Intern | null = null;
    let hr: Organization | null = null;
    let hasApplied: boolean = false;

    if (user) {
        intern = await prisma.intern.findUnique({ where: { clerkId: user.id } })
        hr = await prisma.organization.findUnique({ where: { clerkId: user.id } })

        if (intern) {
            const application = await prisma.application.findUnique({
                where: {
                    internId_listingId: {
                        internId: intern.id,
                        listingId: job.id
                    }
                }
            })
            if (application) {
                hasApplied = true;
            }
        }
    }

    // Extract ONLY the simple strings/IDs needed for the action
    const safeUserId = user?.id;
    const safeInternId = intern?.id;
    const safeJobId = job.id;

    // THE SERVER ACTION
    async function applyForJob() {
        "use server"

        // Use the safe strings instead of the complex objects
        if (!safeUserId || !safeInternId) return redirect("/welcome")

        try {
            await prisma.application.create({
                data: {
                    internId: safeInternId, // Use the extracted ID string
                    listingId: safeJobId,   // Use the extracted ID string
                    status: "Pending"
                }
            })

            revalidatePath("/")
        } catch (error) {
            console.error("Application failed or already exists:", error)
        }

        redirect("/dashboard")
    }

    // THE UI
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h3>
                <p className="text-blue-600 font-medium mb-2">{job.organization.name}</p>

                {/* The Deadline Display */}
                {job.closingDate && (
                    <p className="text-xs font-semibold text-red-500 bg-red-50 inline-block px-2 py-1 rounded-md mb-4 border border-red-100">
                        ⏳ Closes on: {new Date(job.closingDate).toLocaleDateString()}
                    </p>
                )}

                <div className="flex flex-wrap gap-2 mb-6 mt-2">
                    {job.requiredSkills.map((skill: string) => (
                        <span key={skill} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <form action={applyForJob}>
                {hr ? (
                    <button disabled className="w-full py-2 rounded-md font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                        HR Cannot Apply
                    </button>
                ) : !user ? (
                    <button formAction={async () => { "use server"; redirect("/welcome") }} className="w-full py-2 rounded-md font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                        Sign In to Apply
                    </button>
                ) : hasApplied ? (
                    <button disabled className="w-full py-2 rounded-md font-semibold bg-green-50 text-green-600 border border-green-200 cursor-not-allowed">
                        Applied ✅
                    </button>
                ) : (
                    <button type="submit" className="w-full py-2 rounded-md font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                        Apply Now
                    </button>
                )}
            </form>
        </div>
    )
}