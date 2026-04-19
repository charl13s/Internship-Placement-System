"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { updateApplicationCV } from "@/app/actions/application"
import { useRouter } from "next/navigation"

export function UpdateCVButton({ applicationId, currentCvUrl }: { applicationId: string, currentCvUrl: string | null }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleUpdate = async () => {
        if (!currentCvUrl) return alert("Please upload a CV to your profile first!")

        setIsLoading(true)
        const result = await updateApplicationCV(applicationId, currentCvUrl)
        setIsLoading(false)

        if (result.success) {
            router.refresh() // This automatically reloads the page to show the new score
        } else {
            alert("Failed to update AI score.")
        }
    }

    return (
        <Button
            onClick={handleUpdate}
            disabled={isLoading || !currentCvUrl}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 rounded-full"
        >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Recalculating..." : "Update AI Score"}
        </Button>
    )
}