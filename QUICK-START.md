# QUICK START CHECKLIST

## What You Have
✅ Complete Google Meet Add-on code
✅ Facilitator control panel (side panel)
✅ Participant display (main stage)
✅ Professional styling and responsive design

## What You Need to Install (one-time setup)
1. [ ] Node.js from https://nodejs.org/ (get LTS version)
2. [ ] VS Code from https://code.visualstudio.com/
3. [ ] Git from https://git-scm.com/

## Setup Steps

### STEP 1: Get Your Code Ready
1. [ ] Download this folder to your computer
2. [ ] Open VS Code
3. [ ] File > Open Folder > select the greens-meeting-timer folder
4. [ ] Open Terminal in VS Code (Terminal > New Terminal)
5. [ ] Type: `npm install` and press Enter

### STEP 2: Create Google Cloud Project
1. [ ] Go to https://console.cloud.google.com/
2. [ ] Click "Create Project" 
3. [ ] Name it "Greens Meeting Timer"
4. [ ] **WRITE DOWN YOUR PROJECT NUMBER** (you'll need this!)

### STEP 3: Enable APIs
In Google Cloud Console:
1. [ ] Go to "APIs & Services" > "Library"
2. [ ] Search "Google Workspace Marketplace SDK" > Enable it
3. [ ] Search "Google Workspace Add-ons API" > Enable it

### STEP 4: Update Your Code
1. [ ] Open `sidepanel.js` in VS Code
2. [ ] Find line 18: `cloudProjectNumber: 'YOUR_CLOUD_PROJECT_NUMBER'`
3. [ ] Replace YOUR_CLOUD_PROJECT_NUMBER with your project number
4. [ ] Open `mainstage.js` in VS Code
5. [ ] Find line 17: do the same replacement
6. [ ] Save both files

### STEP 5: Test Locally (Optional)
1. [ ] In VS Code terminal, type: `npm start`
2. [ ] Open browser to http://localhost:8080/sidepanel.html
3. [ ] You should see the control panel (won't connect to Meet yet)

### STEP 6: Deploy to Internet
Choose ONE option:

**OPTION A: Netlify (Easiest)**
1. [ ] Go to https://netlify.com/ > Sign up (free)
2. [ ] Drag your entire greens-meeting-timer folder onto Netlify
3. [ ] **WRITE DOWN YOUR URL** (e.g., https://green s-timer.netlify.app)

**OPTION B: GitHub Pages**
1. [ ] Create GitHub account at https://github.com/
2. [ ] Create new repository called "greens-meeting-timer"
3. [ ] Upload all files
4. [ ] Settings > Pages > Enable
5. [ ] **WRITE DOWN YOUR URL**

### STEP 7: Register with Google
1. [ ] Go back to Google Cloud Console
2. [ ] "APIs & Services" > "Google Workspace Marketplace SDK"
3. [ ] Click "HTTP deployments" tab
4. [ ] Click "Create new deployment"
5. [ ] Deployment ID: `greens-timer-v1`
6. [ ] Copy the JSON template from README.md
7. [ ] Replace `YOUR-DEPLOYED-URL` with your actual URL
8. [ ] Click Submit

### STEP 8: Install the Add-on
1. [ ] Go to "App configuration" tab in Cloud Console
2. [ ] Under "App integration" > "Google Workspace add-on"
3. [ ] Select your HTTP deployment
4. [ ] Click "Install"
5. [ ] Allow permissions

### STEP 9: Use It!
1. [ ] Join a Google Meet call
2. [ ] Click "Activities" button (bottom toolbar, sparkle icon)
3. [ ] Find "Greens Meeting Timer"
4. [ ] Add agenda items
5. [ ] Click "Show Timers to All Participants"
6. [ ] Everyone in the meeting can now see the timers!

## Common Issues

**"Can't find my project number"**
→ Google Cloud Console > Click project dropdown > Your number is next to the name

**"APIs & Services not showing"**
→ Make sure you selected your project from the dropdown at the top

**"Add-on not appearing in Meet"**
→ Wait 5-10 minutes after installing, then refresh Meet

**"Need help deploying"**
→ Netlify is easiest - literally just drag and drop your folder

## Need Help?
- Read the full README.md for detailed instructions
- Google Cloud documentation: https://developers.google.com/meet/add-ons
- Check you've enabled the right APIs (SDK not API!)

## Your Key Info (Fill This Out!)
Project Number: ___________________________
Deployment URL: ___________________________
Deployment ID: greens-timer-v1
Date Created: ___________________________
