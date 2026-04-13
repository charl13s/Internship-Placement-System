import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function InternDashboard() {
    const user = await currentUser()
    if (!user) redirect("/")

    // Fetch the intern profile AND all their applications
    const intern = await prisma.intern.findUnique({
        where: { clerkId: user.id },
        include: {
            applications: {
                include: {
                    listing: {
                        include: {
                            organization: true
                        }
                    }
                }
            }
        }
    })

    // If they somehow got here without a profile, send them to onboarding
    if (!intern) redirect("/onboarding")

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Welcome, {intern.firstName} {intern.lastName}
                        </h1>
                        <p className="text-slate-500">{intern.course} Student</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
                            Find More Jobs
                        </Link>
                        <UserButton />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Profile Summary */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="font-semibold text-slate-800 mb-4">Profile Summary</h2>
                            <div className="space-y-3 text-sm">
                                <p><span className="text-slate-500">Email:</span> <br /> {intern.email}</p>
                                <div>
                                    <span className="text-slate-500">Skills:</span> <br />
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {intern.keySkills.map(skill => (
                                            <span key={skill} className="bg-slate-100 px-2 py-0.5 rounded text-xs">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                                {intern.cvUrl && (
                                    <a
                                        href={intern.cvUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-4 text-center bg-blue-50 text-blue-700 py-2 rounded-md hover:bg-blue-100 transition-colors"
                                    >
                                        View Resume PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Applications List */}
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">My Applications</h2>

                        {intern.applications.length === 0 ? (
                            <div className="bg-white p-10 text-center rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">You haven't applied for any internships yet.</p>
                                <Link href="/" className="text-blue-600 font-semibold mt-2 inline-block">
                                    Browse Listings →
                                </Link>
                            </div>
                        ) : (
                            intern.applications.map((app) => (
                                <div key={app.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{app.listing.title}</h3>
                                        <p className="text-sm text-slate-500">{app.listing.organization.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${app.status === "Accepted" ? "bg-green-100 text-green-700" :
                                                app.status === "Rejected" ? "bg-red-100 text-red-700" :
                                                    "bg-amber-100 text-amber-700"
                                            }`}>
                                            {app.status}
                                        </span>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            Applied on {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </main>
    )
}