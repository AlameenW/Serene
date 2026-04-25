**Header**
- Serene top nav
- Two tab toggles below: "Campus Resources" (default) | "AI Assistant"
- Tab switch swaps content in place — no navigation
**Campus Resources tab**
Five resource cards. Each card: resource name, one-line description, "Visit site" button linking to the official SLU URL.
 
| Resource | Description | URL |
|---|---|---|
| Counseling Services | Mental health support, individual and group counseling | https://www.southeastern.edu/admin/counseling/ |
| Student Health Center | Medical care, prescriptions, and wellness services on campus | https://www.southeastern.edu/admin/health_ctr/ |
| Food Pantry | Free groceries and essentials for students in need | https://www.southeastern.edu/admin/misa/pantry/ |
| Academic Success Center | Tutoring, academic coaching, and study skills support | https://www.southeastern.edu/college-of-honors-and-excellence/tutoring/ |
| Student Disability Services | Accommodations and support for students with disabilities | https://www.southeastern.edu/college-of-honors-and-excellence/tutoring/ |
 
 
**AI Assistant tab**
- Full Gemini chat interface
- On tab open, Gemini sends an automatic opening message using the student's stress context
- Example: "Hey Alex, looks like you've got a heavy week ahead with 3 deadlines coming up. What's on your mind?"
- Chat history kept in React state for the session
- Student messages right-aligned (violet), Gemini messages left-aligned (gray/white)
- Input bar pinned at the bottom, messages scroll upward
---
