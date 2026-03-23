# 🎉 Happy Tired - San Diego Kids Events

Automated event discovery and verification for San Diego kids activities (ages 0-5).

## 🤖 Automated Updates

This site automatically updates **daily at 8am PT** with:
- Easter & holiday events
- Library storytimes
- Museum programs
- Nature activities
- Performances & shows
- Arts & crafts
- Play activities

## ✨ Features

- **AI-Powered Search**: Claude finds 30+ events daily from multiple sources
- **Multi-Source Verification**: Each event verified with 2+ sources for accuracy
- **Auto-Quality Checks**: Validates dates, times, locations, costs before publishing
- **Conflict Detection**: Flags events with conflicting information
- **Auto-Deploy**: Updates push to GitHub → Vercel deploys automatically

## 🔧 Setup

See [SETUP.md](SETUP.md) for complete setup instructions.

Quick start:
1. Add Anthropic API key to GitHub Secrets
2. Push these files to your repo
3. Enable GitHub Actions
4. Done! Updates run automatically

## 📊 Event Verification Status

Events are marked with verification levels:
- ✅ **VERIFIED**: Confirmed by 2+ sources
- ⚠️ **SINGLE_SOURCE**: Found only one source
- 🚨 **CONFLICT**: Sources disagree (flagged for review)

## 💰 Cost

~$3-9/month in API costs for daily updates. First run is free ($5 credit).

## 📅 Schedule

Runs daily at 8am Pacific Time. Can also trigger manually from GitHub Actions.

---

Built with Claude API • Hosted on Vercel • Open source
