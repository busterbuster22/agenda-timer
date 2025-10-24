# Greens Meeting Timer - Google Meet Add-on

A minimal viable product for managing meeting agendas and timers in Google Meet.

## Features

### For All Participants (Main Stage View)
- View all agenda items with their durations
- See current agenda item timer (countdown)
- See speaker timer (counts up)
- Visual indicators for active, completed, and upcoming items
- Color warnings when time is running low

### For Facilitator (Side Panel Controls)
- Add/remove agenda items with durations
- Select and navigate through agenda items
- Start/pause/stop agenda timer
- Start/pause/stop/reset speaker timer
- Launch display visible to all participants

## Setup Instructions

### 1. Install Required Software
- Node.js (v18 or higher): https://nodejs.org/
- A text editor (VS Code recommended): https://code.visualstudio.com/

### 2. Install Dependencies
Open a terminal in the project folder and run:
```bash
npm install
```

### 3. Configure Google Cloud Project

#### A. Create a Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click "Create Project"
3. Give it a name (e.g., "Greens Meeting Timer")
4. Note your **Project Number** (found in project settings)

#### B. Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable:
   - **Google Workspace Marketplace SDK** (not the API!)
   - **Google Workspace Add-ons API**

#### C. Update the Code
Replace `'YOUR_CLOUD_PROJECT_NUMBER'` in both files:
- `sidepanel.js` (line 18)
- `mainstage.js` (line 17)

With your actual project number (numbers only, no quotes if it's purely numeric).

### 4. Test Locallyasdasdasd

Run the local server:
```bash
npm start
```
###cinnebt 
Your app will be available at:
- Side Panel: http://localhost:8080/sidepanel.html
- Main Stage: http://localhost:8080/mainstage.html

You can test the interface, but the Google Meet integration won't work until you deploy to a public URL.

### 5. Deploy to a Public URL

You need to host your files on a public website. Options include:

#### Option A: GitHub Pages (Recommended for testing)
1. Create a GitHub account if you don't have one
2. Create a new repository
3. Upload all your files
4. Enable GitHub Pages in repository settings
5. Your URL will be: `https://yourusername.github.io/repository-name/`

#### Option B: Netlify (Easiest)
1. Go to https://www.netlify.com/
2. Sign up for free account
3. Drag and drop your project folder
4. Get your URL: `https://your-site-name.netlify.app/`

#### Option C: Vercel
1. Go to https://vercel.com/
2. Sign up and connect your GitHub
3. Deploy your repository
4. Get your URL: `https://your-project.vercel.app/`

### 6. Create the Add-on Deployment

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Navigate to "APIs & Services" > "Google Workspace Marketplace SDK"
3. Click "HTTP deployments" tab
4. Click "Create new deployment"
5. Enter a deployment ID (e.g., "greens-timer-v1")
6. In the JSON configuration, paste:

```json
{
  "oauthScopes": [],
  "addOns": {
    "meet": {
      "sidePanelUrl": "https://YOUR-DEPLOYED-URL/sidepanel.html",
      "mainStageUrl": "https://YOUR-DEPLOYED-URL/mainstage.html",
      "supportsAddonActivation": true
    },
    "common": {
      "name": "Greens Meeting Timer",
      "logoUrl": "https://YOUR-DEPLOYED-URL/icon.png",
      "useLocaleFromApp": true
    }
  }
}
```

Replace `YOUR-DEPLOYED-URL` with your actual deployment URL.

7. Click "Submit"

### 7. Install the Add-on

1. Go to "App configuration" tab
2. Under "App integration", select "Google Workspace add-on"
3. Choose your HTTP deployment
4. Click "Install"
5. Select your Google account
6. Allow the permissions

### 8. Use in Google Meet

1. Join or start a Google Meet call
2. Click the "Activities" button (sparkle icon) in the bottom toolbar
3. Find and click "Greens Meeting Timer"
4. The side panel opens - add your agenda items
5. Click "Show Timers to All Participants" to display on main stage

## Usage Guide

### Adding Agenda Items
1. In the side panel, enter agenda item name
2. Set duration in minutes
3. Click "Add Item"

### Running the Meeting
1. Click "Select" on an agenda item to make it current
2. Click "Start" to begin the countdown timer
3. Use "Pause" or "Stop" to control the timer
4. Click "Next Item" to move to the next agenda item (marks current as complete)

### Speaker Timer
- Independent of agenda timer
- Counts up from 00:00
- Use "Start" when someone begins speaking
- Use "Stop/Reset" to clear and start fresh for next speaker
- Visual warnings appear at 3 minutes (yellow) and 5 minutes (red)

## Troubleshooting

### "Add-on not loading"
- Check that your Cloud Project Number is correct in the JavaScript files
- Verify both APIs are enabled in Google Cloud Console
- Make sure your deployment URL is publicly accessible

### "Can't see the timer"
- Make sure you clicked "Show Timers to All Participants"
- Check that other participants have the Activities panel open
- Refresh the meeting if needed

### "Timers not syncing"
- The facilitator controls the state from the side panel
- Main stage updates automatically when facilitator makes changes
- There may be a 1-2 second delay, this is normal

## File Structure

```
greens-meeting-timer/
├── sidepanel.html      # Facilitator control interface
├── sidepanel.js        # Facilitator control logic
├── mainstage.html      # Participant display interface
├── mainstage.js        # Participant display logic
├── styles.css          # All styling
├── package.json        # Dependencies
└── README.md          # This file
```

## Future Enhancements

Potential features to add:
- Save/load agenda templates
- Meeting notes/minutes
- Export meeting summary
- Customizable time warnings
- Sound alerts
- Participant voting/polls

## License

Created for Greens meetings. Free to use and modify.
