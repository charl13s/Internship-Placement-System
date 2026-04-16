// components/SiteHeader.tsx
import Link from "next/link"
import { Building2 } from "lucide-react"
import { UserButton, Show } from "@clerk/nextjs"

export default function SiteHeader({
    variant = "default"
}: {
    variant?: "default" | "onboarding" | "dark"
}) {
    const isDark = variant === "dark"
    const isOnboarding = variant === "onboarding"

    return (
        <header
            className={`w-full px-6 py-5 flex items-center justify-between z-50 ${isDark ? "bg-neutral-900 text-white" : "bg-transparent text-neutral-900"
                } ${isOnboarding ? "absolute top-0 left-0" : "relative border-b border-neutral-200 bg-white"
                }`}
        >
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between">

                {/* Logo & Branding */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className={`${isDark ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"} p-1.5 rounded-md`}>
                        <Building2 className="w-5 h-5" />
                    </div>
                    InternSystem
                </Link>

                {/* Navigation Links (Hidden during Onboarding) */}
                {!isOnboarding && (
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link
                            href="/"
                            className={`${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"} transition-colors`}
                        >
                            Job Feed
                        </Link>
                        <Link
                            href="/my-applications"
                            className={`${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"} transition-colors`}
                        >
                            My Applications
                        </Link>
                    </nav>
                )}

                {/* User Profile / Logout */}
                <div className="flex items-center gap-4">
                    <Show when="signed-in">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 ring-2 ring-neutral-200/50 hover:ring-neutral-300 transition-all",
                                }
                            }}
                        />
                    </Show>
                </div>

            </div>
        </header>
    )
}