import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, Briefcase, PlusCircle, Building2, Settings } from "lucide-react"

export default function DashboardShell({
    children,
    title,
    userRole
}: {
    children: React.ReactNode;
    title: string;
    userRole: "Admin" | "HR" | "Student"
}) {

    // 🚨 SMART NAVIGATION: Different links for different users!
    const adminLinks = [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        // You can build these pages later if you want a dedicated view!
        // { name: "All Organizations", href: "/admin/organizations", icon: Building2 },
        // { name: "Platform Jobs", href: "/admin/jobs", icon: Briefcase },
    ]

    const hrLinks = [
        { name: "Dashboard", href: "/hr-dashboard", icon: LayoutDashboard },
        { name: "Post New Job", href: "/hr-dashboard/create", icon: PlusCircle },
    ]

    // Decide which links to show
    const navLinks = userRole === "Admin" ? adminLinks : hrLinks;

    return (
        <div className="flex min-h-screen w-full bg-white text-neutral-950 font-sans">

            {/* 1. THE SIDEBAR */}
            <aside className="w-64 border-r border-neutral-200 bg-neutral-50 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-neutral-200">
                    <h1 className="font-bold tracking-tight text-lg text-neutral-900">
                        {/* 🚨 Fixed the title! */}
                        {userRole === "Admin" ? "Admin Console" : "Employer Portal"}
                    </h1>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {/* 🚨 Map through our smart links so they actually work */}
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-md text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 font-medium text-sm transition-colors"
                            >
                                <Icon className="w-4 h-4" />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-neutral-200">
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-neutral-500 hover:text-neutral-900 font-medium text-sm transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Link>
                </div>
            </aside>

            {/* 2. THE MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-neutral-50/50">

                {/* Top Header */}
                <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8 shadow-sm z-10">
                    <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8 ring-2 ring-neutral-200", // Adds a subtle border
                            },
                            variables: {
                                colorPrimary: "#171717", // Changes the default purple to deep neutral/black
                            }
                        }}
                    />
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 p-8 overflow-auto">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>

            </main>

        </div>
    )
}