#!/bin/bash
echo "🚀 Starting GitHub Push Process..."

# 1. Check Login Status
if ! gh auth status &> /dev/null; then
    echo "🔑 You are not logged in to GitHub CLI."
    echo "👉 Please follow the prompts to login (Select GitHub.com > SSH > Upload your key)"
    gh auth login
fi

# 2. Check if repo already exists locally or remotely
git_url="https://github.com/martinsuppp/vocab-master.git"
if git remote | grep -q origin; then
    echo "ℹ️  Remote 'origin' already exists."
else
    echo "🔗 Adding remote origin..."
    git remote add origin $git_url
fi

# 3. Create Repo (if not exists)
echo "📦 Checking/Creating private repository 'vocab-master'..."
# Try to view, if fails, create
if ! gh repo view vocab-master &> /dev/null; then
    gh repo create vocab-master --private --source=. --remote=origin --push
else
    echo "⚠️  Repo 'vocab-master' already exists. Pushing updates..."
    git push -u origin main
fi

echo "✅ Done! Your code is on GitHub: $git_url"
