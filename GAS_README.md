# Google Apps Script Setup Guide

To use Google Sheets as your database for VocabMaster, follow these steps:

## 1. Prepare Your Google Sheet
1.  Create a new Google Sheet (or use an existing one).
2.  Create sheets (tabs) for each vocabulary category (e.g., "Lesson 1", "Verbs").
3.  **Format**:
    - **Column A**: English Word
    - **Column B**: Chinese Translation
    - (No header row is strictly required, but row 1 is usually skipped if it doesn't look like data).

## 2. Add the Script
1.  In your Google Sheet, form the menu select **Extensions** > **Apps Script**.
2.  Delete any code in `Code.gs` and paste the contents of `GOOGLE_APPS_SCRIPT.js` (found in this project).
3.  Press `Ctrl + S` to save.

## 3. Deploy as Web App
1.  Click the blue **Deploy** button (top right) > **New deployment**.
2.  Click the "Select type" gear icon > **Web app**.
3.  **Configuration** (Important!):
    - **Description**: "VocabMaster API"
    - **Execute as**: **Me** (your email).
    - **Who has access**: **Anyone** (This allows the app to fetch data without login prompts).
4.  Click **Deploy**.
5.  **Copy the Web App URL** (It starts with `https://script.google.com/macros/s/...`).

## 4. Connect to VocabMaster
1.  Open the VocabMaster app.
2.  It will prompt you to enter the URL. Paste the Web App URL you just copied.
3.  The app will now load vocabulary directly from your Google Sheet!

## Troubleshooting
- **"Failed to fetch"**: Ensure you selected **"Anyone"** in "Who has access". If you selected "Only myself", the app cannot read the data.
- **Reset URL**: If you entered the wrong URL, open the browser console (F12) and type `resetGasUrl()` then press Enter.
