# 🚀 Happy Tired Event Automation - Setup Guide

This system automatically finds, verifies, and updates San Diego kids events daily at 8am PT.

## 📋 What This Does

Every day at 8am Pacific Time:
1. ✅ Claude searches for 30+ San Diego kids events (ages 0-5)
2. ✅ Verifies each event with 2+ sources to ensure accuracy
3. ✅ Checks dates, times, locations, costs are correct
4. ✅ Updates your events.json file
5. ✅ Auto-commits to GitHub
6. ✅ Vercel auto-deploys to your live site

## 🎯 Setup (15 minutes)

### Step 1: Get Anthropic API Key

1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it "happytired-automation"
4. Copy the key (starts with `sk-ant-...`)
5. **IMPORTANT**: Keep this key secret! Don't share it or commit it to GitHub

### Step 2: Add Files to Your GitHub Repo

You need to add these files to your `salb01/happytired` repository:

**Option A: Upload via GitHub website (easiest)**

1. Go to https://github.com/salb01/happytired
2. Click "Add file" → "Create new file"
3. For each file below, paste the name and contents:

**Files to create:**

```
package.json
.github/workflows/update-events.yml
scripts/update-events.js
scripts/validate-events.js
.env.example
```

(I'll give you the contents for each file - just copy/paste!)

**Option B: Use Git (if you're comfortable with terminal)**

```bash
# Clone your repo
git clone https://github.com/salb01/happytired.git
cd happytired

# Create directories
mkdir -p .github/workflows
mkdir -p scripts

# Add all the files (I'll provide them)
# Then:
git add .
git commit -m "Add event automation system"
git push
```

### Step 3: Add API Key to GitHub Secrets

1. Go to https://github.com/salb01/happytired/settings/secrets/actions
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: Paste your API key from Step 1
5. Click "Add secret"

### Step 4: Enable GitHub Actions

1. Go to https://github.com/salb01/happytired/actions
2. If you see "Workflows aren't being run on this repository", click "I understand, enable them"

### Step 5: Test It!

**Manual test (recommended first time):**

1. Go to https://github.com/salb01/happytired/actions
2. Click on "Update Events Daily" workflow
3. Click "Run workflow" → "Run workflow"
4. Watch it run (takes ~2-3 minutes)
5. Check the logs to see what events it found
6. Check your `events.json` file - it should be updated!
7. Check your Vercel site - should auto-deploy

**If it works:** You're done! It will now run automatically every day at 8am PT.

## 📊 How It Works

### Event Discovery
- Searches San Diego event calendars, museum sites, library sites, parks
- Focuses on: Easter events, storytimes, museums, nature, performances, arts/crafts, play activities
- Looks 60 days ahead

### Verification Process
For each event, Claude:
1. Searches 2-3 different sources
2. Cross-checks: date, time, location, cost
3. Flags conflicts if sources disagree
4. Marks verification status:
   - ✅ **VERIFIED**: 2+ sources agree
   - ⚠️ **SINGLE_SOURCE**: Only found one source
   - 🚨 **CONFLICT**: Sources disagree (flagged for review)

### Quality Checks
Before publishing, validates:
- ✅ All required fields present
- ✅ Dates are in correct format (YYYY-MM-DD)
- ✅ Dates are in the future (not past events)
- ✅ URLs are valid
- ✅ Categories are valid
- ⚠️ Warns about duplicates

## 🔧 Configuration

Edit `scripts/update-events.js` to change:

```javascript
const CONFIG = {
  location: 'San Diego',        // Change city
  ageRange: '0-5',              // Change age range
  lookAheadDays: 60,            // How far to look ahead
  maxEvents: 35,                // Max events to find
  verificationSources: 2,       // Min sources to verify each event
};
```

## 📅 Schedule

The workflow runs at:
- **8:00 AM Pacific Time** every day
- You can also trigger manually from GitHub Actions tab

To change the schedule, edit `.github/workflows/update-events.yml`:

```yaml
schedule:
  - cron: '0 15 * * *'  # 8am PT = 3pm UTC (during PDT)
```

Cron format: `minute hour day month day-of-week`

Examples:
- `0 15 * * *` = Every day at 8am PT
- `0 15 * * 1` = Every Monday at 8am PT
- `0 15 1,15 * *` = 1st and 15th of month at 8am PT

## 🐛 Troubleshooting

### "Workflow failed"
1. Click on the failed run in Actions tab
2. Click on "update-events" job
3. Read the error message
4. Common fixes:
   - API key not set: Check GitHub Secrets
   - Invalid events.json: Check the validation errors
   - API rate limit: Wait a bit and try again

### "Events aren't updating"
1. Check GitHub Actions - is the workflow running?
2. Check the logs - what did Claude find?
3. Check if `events.json` changed in your repo
4. Check Vercel deployment logs

### "Wrong events or bad data"
- The system flags conflicts - check the logs for warnings
- Events with conflicts are marked in the output
- You can manually review/edit `events.json` if needed

## 💰 Cost

**Anthropic API pricing:**
- ~$0.10-0.30 per run (searching 30+ events)
- Daily: ~$3-9/month
- You can reduce by running less frequently or finding fewer events

**First run is FREE** - you get $5 credit!

## 🔐 Security

**Important:**
- ✅ API key is stored in GitHub Secrets (encrypted)
- ✅ Never commit `.env` file (it's in `.gitignore`)
- ✅ Never share your API key
- ✅ You can regenerate your API key anytime at console.anthropic.com

## 📞 Support

If something breaks:
1. Check the GitHub Actions logs
2. Check the error messages
3. Try running manually first
4. Ask me for help! Send me the error message.

## 🎉 You're All Set!

Once configured, you can:
- ✅ Forget about it - runs automatically
- 📊 Check GitHub Actions to see what's happening
- 🔍 Review events.json to see what was found
- 🎨 Focus on making your site look great!

The system will keep your events fresh and verified every single day! 🚀
