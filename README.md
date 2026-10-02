# AI Chatbot

A minimal AI Chatbot built with Next.js and Google Gemini API.

## Setup and Deployment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add `GEMINI_API_KEY` to `.env.local`**
   Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Push to GitHub**
   Initialize git (if not already), commit your files, and push to your GitHub repository:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

5. **Import the repository into Vercel**
   Go to [vercel.com](https://vercel.com), add a new project, and select your repository.

6. **Add `GEMINI_API_KEY` under Vercel Environment Variables**
   In project settings during or after import, add an environment variable named `GEMINI_API_KEY` with your API key value.

7. **Deploy**
   Click **Deploy**. Vercel will automatically build and host your chatbot.
