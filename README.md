# CivicLens AI

An AI-powered civic complaint management system. Citizens report problems like potholes, garbage and broken street lights with a photo and GPS location. AI reads the photo and the text, fixes the category, rates how serious it is, and routes it to the right department. Admins get a priority-sorted dashboard to act on the most urgent issues first.

**Live demo:** https://civiclens-ai-five.vercel.app

> The backend runs on a free server, so the first request after a break can take up to a minute.

## The problem

Civic complaints usually arrive on WhatsApp, calls or paper. There is no tracking, the same pothole gets reported many times, and authorities cannot tell which issue is urgent. CivicLens AI structures every complaint automatically so the serious ones get fixed first.

## Features

**Citizen**
- Register and login with secure cookie-based sessions
- Submit a complaint with photos, description and GPS location
- Track each complaint with a unique tracking ID and status
- Complaint detail page with department helpline, email, expected resolution date (SLA) and a full status timeline
- AI assistant chat in Hindi, Hinglish, Punjabi or English that answers questions about the citizen's own complaints (rate limited, never reveals other users' data)
- Voice input for the assistant (Chrome and Edge)

**AI (Google Gemini)**
- Reads the photo and description together
- Corrects a wrong category and gives a severity score from 1 to 5
- Calculates a priority score and routes to the right department
- If one model is busy, the next is tried; if all fail, the complaint is still saved

**Admin / Officer**
- Dashboard with totals, average resolution time, category and status charts
- Complaints sorted by priority, with status filter
- One-click status workflow with allowed transitions only

**Backend**
- Role-based access control (citizen, officer, admin)
- Passwords hashed with bcrypt, JWT in httpOnly cookies, Helmet and CORS
- 2dsphere geospatial index on complaint location

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Images | Multer, Cloudinary |
| AI | Google Gemini API |
| Hosting | Vercel (frontend), Render (backend) |

## Run locally

```bash
git clone https://github.com/Prashant00900/civiclens-ai.git
cd civiclens-ai/server && npm install && npm run dev
cd ../client && npm install && npm run dev
```

Create `server/.env` with: PORT, MONGO_URI, JWT_SECRET, CLIENT_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, GEMINI_API_KEY, GEMINI_MODEL. Then run `node utils/seed.js` once inside `server` to create departments.

## Roadmap

- Duplicate complaint detection
- Map picker for location
- Officer assignment
- Real-time updates and SLA tracking

## Author

Prashant Rajpoot
- Duplicate detection: a new report within 100 m of an open complaint of the same category is merged into it (MongoDB geo query), and the priority rises with the number of reports
- Complaint detail page with department helpline, email, expected resolution date (SLA) and a full status timeline
- AI assistant chat in Hindi, Hinglish, Punjabi or English that answers only from the citizen's own complaints (rate limited, never reveals other users' data), with voice input in Chrome and Edge
- Road-signage inspired interface with a severity meter, designed to work on mobile