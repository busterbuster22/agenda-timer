# 👋 START HERE!

Welcome to your Greens Meeting Timer for Google Meet!

## 📋 What to Read First

1. **PROJECT-SUMMARY.md** ← Read this first to understand what you have
2. **QUICK-START.md** ← Follow this checklist to get set up
3. **README.md** ← Reference this for detailed technical info

## 📁 Your Files

### Main Application Files (don't edit unless you know what you're doing)
- `sidepanel.html` + `sidepanel.js` = Facilitator controls
- `mainstage.html` + `mainstage.js` = What everyone sees
- `styles.css` = All the pretty design

### Configuration Files
- `package.json` = Node.js configuration
- `deployment-template.json` = Template for Google Cloud setup

### Help Files
- `PROJECT-SUMMARY.md` = Overview of what you have
- `QUICK-START.md` = Step-by-step setup guide
- `README.md` = Complete documentation
- `ICON-INSTRUCTIONS.txt` = How to create your icon

## 🚀 Quick Setup Path

1. Install Node.js from https://nodejs.org/
2. Open this folder in VS Code
3. Run `npm install` in the terminal
4. Read QUICK-START.md and follow the steps
5. You'll be running in about an hour!

## ⚙️ Before You Can Use It

You MUST update these 2 files with your Google Cloud Project Number:
- `sidepanel.js` (line 18)
- `mainstage.js` (line 17)

Look for: `cloudProjectNumber: 'YOUR_CLOUD_PROJECT_NUMBER'`

## 🆘 Need Help?

1. Check QUICK-START.md for common issues
2. Read the troubleshooting section in README.md  
3. Make sure you enabled the Google Workspace Marketplace SDK (not API!)
4. Wait 5-10 minutes after installing before testing

## ✅ What This Does

**For Facilitators:**
- Add agenda items with durations
- Control agenda timer (counts down)
- Control speaker timer (counts up)
- Navigate through items

**For All Participants:**
- See all agenda items
- See current item timer
- See speaker timer
- Colour warnings when time's running out

## 📝 Your To-Do List

- [ ] Read PROJECT-SUMMARY.md
- [ ] Install Node.js
- [ ] Create Google Cloud Project (get project number!)
- [ ] Update sidepanel.js with your project number
- [ ] Update mainstage.js with your project number
- [ ] Deploy to Netlify or GitHub Pages
- [ ] Register add-on in Google Cloud Console
- [ ] Install add-on to your Google account
- [ ] Create an icon.png (see ICON-INSTRUCTIONS.txt)
- [ ] Test in a Google Meet call!

## 🎉 That's It!

You have everything you need. Follow QUICK-START.md and you'll be timing your Greens meetings in no time.

Good luck! 🍀
