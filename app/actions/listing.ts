"use server"

import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export async function createListing(companyId: string, formData: FormData) {
    const title = formData.get("title") as string

    // We parse the JSON array sent from our interactive form
    const skillsString = formData.get("skills") as string
    const skillsArray = JSON.parse(skillsString)

    const closingDateStr = formData.get("closingDate") as string
    const closingDate = closingDateStr ? new Date(closingDateStr) : null

    await prisma.listing.create({
        data: {
            title: title,
            requiredSkills: skillsArray,
            closingDate: closingDate,
            organizationId: companyId
        }
    })

    redirect("/hr-dashboard")
}