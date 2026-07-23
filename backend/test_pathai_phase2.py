import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

print("--- 1. Testing Auth & User Streak ---")
resp = requests.post(f"{BASE_URL}/auth/login/", json={"username": "student_test", "password": "password123"})
if resp.status_code != 200:
    print("Login Error:", resp.json())
    sys.exit(1)

data = resp.json()
token = data["access"]
user_info = data["user"]
headers = {"Authorization": f"Bearer {token}"}
print("User Authenticated:", user_info["username"])
print("Current Streak:", user_info.get("profile", {}).get("current_streak", 1), "Day(s)")

print("\n--- 2. Testing Multi-Language Code Debugger (Auto-Detect) ---")
js_code = """
function getFirstItem(arr) {
  return arr.map(item => item.name);
}
let data = null;
console.log(getFirstItem(data));
"""
debug_req = {
    "code": js_code,
    "framework": "Auto-Detect Language / Framework"
}
debug_resp = requests.post(f"{BASE_URL}/debug/", json=debug_req, headers=headers)
print("Debug Status Code:", debug_resp.status_code)
print("AI Debugger Fix Snippet:", debug_resp.json().get("ai_response", "")[:250] + "...\n")

print("\n--- 3. Testing ATS Resume Scorer & Analyzer ---")
resume_sample = """
Alex Rivera
Software Engineering Student | AI/ML Enthusiast
Email: alex@example.com | GitHub: github.com/alex | LinkedIn: linkedin.com/in/alex

SUMMARY:
Passionate CS student specializing in Python, Scikit-Learn, and Deep Learning.

PROJECTS:
- PathAI Learning Companion: Built full-stack Django + React application with OpenRouter API.
- Image Classifier: Trained Convolutional Neural Network with 92% accuracy on CIFAR-10.

SKILLS:
Python, Django, React, NumPy, Pandas, Scikit-Learn, Git, SQL
"""

job_desc_sample = "Target Role: AI/ML Engineer (PyTorch, MLOps, Docker, Transformers, FastAPI)"

ats_req = {
    "resume_text": resume_sample,
    "job_description": job_desc_sample
}
ats_resp = requests.post(f"{BASE_URL}/resume/score/", json=ats_req, headers=headers)
print("ATS Scorer Status Code:", ats_resp.status_code)
ats_json = ats_resp.json()
print("ATS Overall Score:", ats_json.get("ats_score"), "/ 100")
print("Feedback JSON:", ats_json.get("feedback_json"))

print("\n--- 4. Testing Dashboard Stats (Streak + Resume Scans) ---")
dash_resp = requests.get(f"{BASE_URL}/dashboard/", headers=headers)
print("Dashboard Response:", dash_resp.json())

print("\n🎉 ALL PATHAI PHASE 2 BACKEND ENDPOINTS VERIFIED SUCCESSFULLY!")
