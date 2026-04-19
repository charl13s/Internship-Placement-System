from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # 🚨 THIS IS THE CRITICAL MISSING LINE
from pydantic import BaseModel
from typing import List, TypedDict
import json
from dotenv import load_dotenv

# LangGraph & Gemini Imports
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI

# 1. Load Environment Variables (This grabs your GEMINI_API_KEY from .env)
load_dotenv()

# Initialize FastAPI server
app = FastAPI()

# 🚨 THIS OPENS THE GATES FOR NEXT.JS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------------------------------------
# PHASE 1: DEFINE THE CLIPBOARD (The State)
# ---------------------------------------------------------
class AgentState(TypedDict):
    intern_id: str
    cv_url: str
    required_skills: List[str]
    extracted_skills: List[str]
    match_score: int

# ---------------------------------------------------------
# PHASE 2: HIRE THE WORKERS (The Nodes)
# ---------------------------------------------------------

# Worker 1: The Extractor (Reads the CV using Gemini AI)
def extract_skills(state: AgentState):
    print(f"🕵️‍♂️ Extracting skills from CV: {state['cv_url']}")
    
    # Wake up the Gemini 2.5 Pro model
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")    
    # We explicitly tell Gemini to only give us a JSON array back
    prompt = f"""
    Read the CV located at this URL: {state['cv_url']}
    Extract the top technical skills. 
    Return ONLY a valid JSON array of strings (e.g. ["Python", "React", "SQL"]). 
    Do not include markdown formatting or extra text.
    """
    
    response = llm.invoke(prompt)
    
    try:
        # Clean up the response in case Gemini adds ```json markdown blocks
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        skills = json.loads(clean_text)
    except Exception as e:
        print("Error parsing JSON from Gemini:", e)
        skills = [] # Fallback if the AI gives a weird answer
        
    print(f"✅ Found skills: {skills}")
    return {"extracted_skills": skills}

# Worker 2: The Evaluator (Calculates the Match Score)
def evaluate_match(state: AgentState):
    print("⚖️ Evaluating dynamic match score...")
    
    student_skills = state.get("extracted_skills", [])
    job_skills = state.get("required_skills", [])
    
    # Edge case: If the HR manager didn't require any skills, it's an automatic 100% match!
    if len(job_skills) == 0:
        return {"match_score": 100}
    
    # 1. Standardize both lists to UPPERCASE so capitalization doesn't break the math
    student_upper = [skill.upper() for skill in student_skills]
    job_upper = [skill.upper() for skill in job_skills]
    
    # 2. Count how many required skills the student actually has
    matches_found = 0
    for required_skill in job_upper:
        if required_skill in student_upper:
            matches_found += 1
            
    # 3. Calculate the percentage (Matches / Total Required * 100)
    # Example: Student has 3 out of 4 required skills. (3 / 4) * 100 = 75%
    final_percentage = int((matches_found / len(job_upper)) * 100)
    
    print(f"✅ Dynamic Score: {final_percentage}% ({matches_found}/{len(job_upper)} skills matched)")
    return {"match_score": final_percentage}

# ---------------------------------------------------------
# PHASE 3: BUILD THE FACTORY (The Workflow)
# ---------------------------------------------------------
workflow = StateGraph(AgentState)

# Put the workers at their stations
workflow.add_node("extractor", extract_skills)
workflow.add_node("evaluator", evaluate_match)

# Set up the conveyor belt order
workflow.set_entry_point("extractor")       # Start here
workflow.add_edge("extractor", "evaluator") # Pass to evaluator
workflow.add_edge("evaluator", END)         # Finish the job

# Turn the factory on
app_runner = workflow.compile()

# ---------------------------------------------------------
# PHASE 4: OPEN THE DOORS (The API Route)
# ---------------------------------------------------------
# This tells Python what data Next.js is going to send over
class ApplicationRequest(BaseModel):
    internId: str
    cvUrl: str
    requiredSkills: List[str]

@app.post("/api/applications/screen")
async def screen_application(request: ApplicationRequest):
    try:
        # 1. Create a blank clipboard with the data Next.js just sent us
        initial_state = {
            "intern_id": request.internId,
            "cv_url": request.cvUrl,
            "required_skills": request.requiredSkills,
            "extracted_skills": [],
            "match_score": 0
        }
        
        # 2. Hand the clipboard to the LangGraph factory!
        final_state = app_runner.invoke(initial_state)
        
        # 3. Send the final results back to Next.js
        return {
            "success": True,
            "internId": final_state["intern_id"],
            "extractedSkills": final_state["extracted_skills"],
            "matchScore": final_state["match_score"]
        }
        
    except Exception as e:
        # If anything crashes, tell Next.js there was a Server Error (500)
        raise HTTPException(status_code=500, detail=str(e))


# 1. Define what data Next.js will send us for the job description
class JobDescriptionRequest(BaseModel):
    description: str

# 2. Create the new AI Extraction Route
@app.post("/api/skills/extract")
def extract_job_skills(request: JobDescriptionRequest):
    print("🧠 AI is analyzing the job description...")
    
    # Wake up Gemini
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash") # or "gemini-pro"    
    # Prompt Gemini to act as an HR assistant
    prompt = f"""
    You are an expert HR assistant. Read the following internship job description.
    Extract the top 5 most important technical or soft skills required for the role.
    
    Job Description: "{request.description}"
    
    Return ONLY a valid JSON array of strings (e.g. ["Python", "Communication", "Git"]).
    Do not include any extra text or markdown blocks.
    """
    
    response = llm.invoke(prompt)
    
    try:
        # Clean the response and turn it into a real Python list
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        suggested_skills = json.loads(clean_text)
    except Exception as e:
        print("Error parsing JSON:", e)
        suggested_skills = [] 
        
    print(f"✅ AI Suggested Skills: {suggested_skills}")
    
    # Send the list back to the Next.js frontend!
    return {
        "success": True,
        "skills": suggested_skills
    }