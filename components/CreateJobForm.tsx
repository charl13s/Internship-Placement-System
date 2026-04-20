"use client"

import { useState } from "react"
import { Sparkles, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createListing } from "@/app/actions/listing"

export default function CreateJobForm({ companyId }: { companyId: string }) {
    const [description, setDescription] = useState("")
    const [skills, setSkills] = useState<string[]>([])
    const [newSkill, setNewSkill] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)

    // 🧠 1. Talk to the Python AI Server
    const handleAIGenerate = async () => {
        if (!description.trim()) {
            alert("Please type a job description first so the AI knows what to read!")
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch("https://elevate-ai-engine.onrender.com/api/skills/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description })
            })

            const data = await response.json()
            if (data.success) {
                setSkills(data.skills)
            }
        } catch (error) {
            console.error("AI Server Error:", error)
            alert("Failed to connect to the AI engine. Is the Python server running?")
        }
        setIsGenerating(false)
    }

    // 2. Human-in-the-loop: Remove a skill
    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove))
    }

    // 3. Human-in-the-loop: Add a skill manually
    const addManualSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()])
            setNewSkill("")
        }
    }

    return (
        // We bind the server action and pass the companyId using standard React bindings
        <form action={createListing.bind(null, companyId)} className="space-y-6">

            <div className="space-y-2">
                <Label htmlFor="title" className="text-neutral-900 font-medium">Job Title</Label>
                <Input
                    id="title"
                    name="title"
                    required
                    placeholder="e.g. Software Engineering Intern"
                    className="bg-white focus-visible:ring-neutral-900 text-neutral-900"
                />
            </div>

            {/* AI Generation Section */}
            <div className="space-y-3 p-5 bg-neutral-50 border border-neutral-200 rounded-xl">
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-neutral-900 font-medium flex items-center gap-2">
                        Job Description <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">AI Assistant</span>
                    </Label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the role and responsibilities. The AI will extract the required skills automatically..."
                        className="flex min-h-[100px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    />
                </div>

                <Button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                >
                    <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                    {isGenerating ? "Analyzing Description..." : "Auto-Generate Required Skills"}
                </Button>
            </div>

            {/* The Skill "Pills" UI */}
            <div className="space-y-3">
                <Label className="text-neutral-900 font-medium">Required Skills</Label>

                {/* We securely pass the finalized array to the server action as a hidden string */}
                <input type="hidden" name="skills" value={JSON.stringify(skills)} />

                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-neutral-200 rounded-md bg-white">
                    {skills.length === 0 && <span className="text-sm text-neutral-400 italic">No skills added yet...</span>}

                    {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-neutral-900 text-white pl-3 pr-1 py-1 flex items-center gap-1 text-sm font-medium">
                            {skill}
                            <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="hover:bg-neutral-700 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill manually..."
                        className="bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualSkill())}
                    />
                    <Button type="button" variant="secondary" onClick={addManualSkill}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-neutral-100">
                <Label htmlFor="closingDate" className="text-neutral-900 font-medium">Application Deadline</Label>
                <Input
                    id="closingDate"
                    type="date"
                    name="closingDate"
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-white text-neutral-900 focus-visible:ring-neutral-900 w-full"
                />
                <p className="text-[11px] text-neutral-500">Leave blank to keep the listing open indefinitely.</p>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex justify-end">
                <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white w-full sm:w-auto px-8">
                    Publish Listing
                </Button>
            </div>
        </form>
    )
}