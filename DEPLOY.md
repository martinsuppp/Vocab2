# Deploying VocabMaster to the Cloud (Render)

To make your app accessible from anywhere on the internet, we recommend using **Render** (it has a great free tier).

## Prerequisites
1.  Ensure your code is pushed to GitHub:
    ```bash
    ./push_to_github.sh
    ```

2.  Sign up for [Render](https://render.com/).

## Steps to Deploy

1.  **Create a New Web Service**:
    - Go to your Render Dashboard.
    - Click **"New +"** -> **"Web Service"**.
    - Select "Build and deploy from a Git repository".
    - Connect your GitHub account and select your `vocab-master` repository.

2.  **Configure the Service**:
    - **Name**: `vocab-master` (or anything you like).
    - **Region**: Closest to you (e.g., Singapore, Oregon).
    - **Branch**: `main`.
    - **Root Directory**: `.` (Leave blank / default).
    - **Runtime**: `Python 3`.
    - **Build Command**: `./build.sh`
    - **Start Command**: `cd backend && python -m gunicorn app:app --bind 0.0.0.0:$PORT`
    - **Instance Type**: Free.

3.  **Add Environment Variables** (Required):
    - **Key**: `PYTHON_VERSION`, **Value**: `3.10.0`
    - **Key**: `NODE_VERSION`, **Value**: `20.10.0` (Critical: Needed to build the frontend)

4.  **Deploy**:
    - Click **"Create Web Service"**.
    - Render will start building your app. This may take a few minutes as it installs dependencies and builds the frontend.

## Accessing Your App
Once deployed, Render will give you a URL like `https://vocab-master.onrender.com`.  
You can open this link on any device (phone, tablet, laptop) to use your app!

## Note on Database
Render's free tier hosting uses an ephemeral disk, meaning **your database (mistakes & stats) will be reset if the server restarts** (which happens occasionally on the free tier).
For persistent data on the free tier, you would need to upgrade to a paid disk or use an external database like Render's Postgres (which has a free tier but requires code changes).
For now, this deployment is great for testing and quick sessions!
