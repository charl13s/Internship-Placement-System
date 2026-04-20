"use server"

import { prisma } from "@/lib/db" // Adjust if your db import is different

export async function updateApplicationCV(applicationId: string, newCvUrl: string) {
    try {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { listing: true }
        });

        if (!application) throw new Error("Application not found");
        // Note: Based on your Prisma schema, the default status is "Pending"
        if (application.status !== "Pending") throw new Error("Cannot update closed applications");

        // Ping the Python AI Server
        const aiResponse = await fetch("https://elevate-ai-engine.onrender.com/api/applications/screen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                internId: application.internId,
                cvUrl: newCvUrl,
                requiredSkills: application.listing.requiredSkills
            })
        });

        if (!aiResponse.ok) throw new Error("AI Server Error");
        const aiData = await aiResponse.json();

        // Overwrite the old database score
        await prisma.application.update({
            where: { id: applicationId },
            data: {
                matchScore: aiData.matchScore,
                extractedSkills: aiData.extractedSkills
            }
        });

        return { success: true };

    } catch (error) {
        console.error("Failed to update CV:", error);
        return { success: false, error: "Failed to recalculate score" };
    }
}