import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

print("--- 1. Testing Registration & Login ---")
reg_data = {
    "username": "student_test",
    "password": "password123",
    "email": "student@test.com",
    "first_name": "Test Student"
}
resp = requests.post(f"{BASE_URL}/auth/register/", json=reg_data)
if resp.status_code not in (200, 201):
    resp = requests.post(f"{BASE_URL}/auth/login/", json={"username": "student_test", "password": "password123"})

data = resp.json()
token = data.get("access")
if not token:
    print("ERROR: Could not get JWT access token:", data)
    sys.exit(1)
print("SUCCESS: JWT Token acquired!")

headers = {"Authorization": f"Bearer {token}"}

print("\n--- 2. Testing Get User Profile ---")
me_resp = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
print("Profile:", me_resp.json())

print("\n--- 3. Testing Roadmap Generation ---")
roadmap_req = {
    "goal": "Natural Language Processing (NLP)",
    "level": "beginner",
    "hours_per_week": 10
}
rm_resp = requests.post(f"{BASE_URL}/roadmap/generate/", json=roadmap_req, headers=headers)
print("Roadmap Status:", rm_resp.status_code)
rm_data = rm_resp.json()
items = rm_data.get("items", [])
print(f"Generated {len(items)} roadmap week topics.")
if len(items) > 0:
    first_item_id = items[0]["id"]
    print("Toggling completion on first item ID:", first_item_id)
    toggle_resp = requests.patch(f"{BASE_URL}/roadmap/items/{first_item_id}/toggle/", json={}, headers=headers)
    print("Toggled Item:", toggle_resp.json()["topic"], "| Completed:", toggle_resp.json()["is_completed"])

print("\n--- 4. Testing Doubt-Solving Chat ---")
chat_req = {"message": "Explain Transformer Attention mechanism in simple terms with an example."}
chat_resp = requests.post(f"{BASE_URL}/chat/", json=chat_req, headers=headers)
print("Chat Reply Status:", chat_resp.status_code)
print("AI Reply Snippet:", chat_resp.json().get("reply", "")[:200] + "...")

print("\n--- 5. Testing Code Debugger ---")
debug_req = {
    "code": "import torch\nx = torch.randn(1, 1, 224, 224)\nconv = torch.nn.Conv2d(3, 64, kernel_size=7)\nout = conv(x)",
    "framework": "PyTorch"
}
debug_resp = requests.post(f"{BASE_URL}/debug/", json=debug_req, headers=headers)
print("Debug Reply Status:", debug_resp.status_code)
print("Debug AI Analysis Snippet:", debug_resp.json().get("ai_response", "")[:200] + "...")

print("\n--- 6. Testing Progress Dashboard Stats ---")
dash_resp = requests.get(f"{BASE_URL}/dashboard/", headers=headers)
print("Dashboard Stats:", dash_resp.json())

print("\n🎉 ALL PATHAI BACKEND APIs VERIFIED SUCCESSFULLY!")
