Landing page.
General landing page with what project is about and login button. 

Dashboard
Personal info
Top section — student info Pulled from Google auth automatically. Name, photo, university. No form needed.
Bottom section — courses & deadlines A "Connect to Canvas" button. When clicked, it loads mock data instantly — a few realistic SLU courses with deadlines already populated. Each course appears as a collapsible dropdown showing its deadlines. Done.
The mock data should look realistic though. Something like:
CMPS 4700 Machine Learning — midterm Apr 28, final project May 5, homework due Apr 27
CMPS 3750 Computer Architecture — lab report Apr 26, final exam May 3
MATH 2850 Calculus III — quiz Apr 25, final May 8
It shows all deadlines available for the semester. 
That way when you demo it, judges see a real student's semester, not obviously fake placeholder text. It also feeds directly into the stress forecast with actual date math so the curve looks meaningful.
The one thing to make sure is that those mock deadlines are close enough to the demo date that the stress curve actually shows peaks and urgency — don't set everything in June or the forecast will look flat and boring.

Stress forecast
Stress calculator - 
Proximity (1-4 points based on days away)
Academic weight (1-4 points from percentage or type fallback)
Clustering multiplier (1x to 2.2x when deadlines pile up in the same window)
Mood now feeds in directly - checking in as Overwhelmed adds 3 points to the final 0-10 score, Anxious adds 2, Tired adds 1, Calm/Focused add nothing
Thresholds are now 0-3 green, 4-6 yellow, 7-10 red
Section 1 — Daily check-in
A prompt at the top: "How are you feeling today?" with five selectable options displayed as cards or pills the student taps once:
 Calm
 Focused
 Anxious
 Overwhelmed
 Tired
Only one can be selected at a time. Once selected it stays highlighted and feeds into the stress calculation immediately, updating the bar graph in real time. The check-in should be saved to localStorage so if they navigate away and come back it remembers their answer for the day.
Section 2 — 7-day stress bar graph
A bar chart with 7 bars, one per day, labeled Mon / Tue / Wed etc. with the actual date below. Each bar is colored by threshold — green for 0–3, yellow for 4–6, red for 7–10.
The stress score per day is calculated as:
Proximity points — deadlines due that day get 4 points, 1 day away gets 3, 2–3 days away get 2, 4–6 days away get 1
Academic weight — if weight percentage is known, map it to 1–4 points. If not, use type fallback: final = 4, midterm = 3, assignment = 2, quiz = 1
Sum all deadline scores for that day then apply the clustering multiplier — 1 deadline = 1x, 2 deadlines = 1.5x, 3+ deadlines = 2.2x
Add mood modifier last — Overwhelmed +3, Anxious +2, Tired +1, Calm/Focused +0
Cap the final score at 10
The bar heights scale to the score out of 10. Hovering or tapping a bar shows a tooltip with exactly which deadlines are contributing to that day's score.
Section 3 — Next 7 days deadline list
A clean list of everything due in the next 7 days sorted by date. Each row shows:
Deadline title (e.g. "Midterm Exam")
Course name
Due date (e.g. "Mon Apr 28")
A type badge — final / midterm / assignment / quiz, color coded
If nothing is due in the next 7 days, show a green empty state: "Clear week ahead."

Support
Header
A short header with the Serene nav at the top, then directly below it two tab buttons: "Campus Resources" (default) and "AI Assistant." Switching between them swaps the content below without any page navigation — just a tab toggle.
Campus Resources tab
Five cards, one per resource. Each card has:
Resource name
One sentence description of what they offer
A "Visit site" or "Learn more" button that links directly to the official SLU page
The five cards and their links:
Counseling Services — Mental health support, individual and group counseling. Links to southeastern.edu/student-life/counseling
Student Health Center — Medical care, prescriptions, and wellness services on campus. Links to the SLU Student Health Center page.
Food Pantry — Free groceries and household essentials for students in need. Links to the SLU Lion's Pantry page.
Academic Success Center — Tutoring, academic coaching, and study skills support. Links to southeastern.edu/academic-success
Student Disability Services — Accommodations and support for students with disabilities. Links to the SLU disability services page.
Before you build this, verify those actual URLs by checking southeastern.edu — you want real working links for the demo, not 404s. Nothing kills a demo faster than a broken link in front of judges.

AI Assistant tab
A clean full-height Gemini chat interface. A few things to nail here:
Gemini should open with a context-aware first message — it already knows the student's stress tier and mood from the forecast page, so the opening message should reference that. Something like "Hey Alex, looks like you've got a heavy week ahead. What's on your mind?" feels warmer than a cold "How can I help you?"
The system prompt you send behind the scenes should tell Gemini to act as a compassionate peer support companion, keep responses concise and warm, never try to be a therapist, and always suggest the counseling center or 988 if the conversation signals genuine distress.
Chat input bar pinned at the bottom, messages scroll upward, Gemini responses clearly differentiated from student messages visually.





