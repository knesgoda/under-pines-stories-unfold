#!/bin/bash

# Auto-merge PR script for Under Pines
# This script monitors the PR and handles the merge process

echo "🚀 Starting auto-merge process for Under Pines PR..."

# Function to check if PR exists
check_pr_exists() {
    local pr_number=$(curl -s "https://api.github.com/repos/knesgoda/under-pines-stories-unfold/pulls?head=knesgoda:feature/auto-task-next-milestone" | jq -r '.[0].number // empty')
    echo $pr_number
}

# Function to check CI status
check_ci_status() {
    local pr_number=$1
    local status=$(curl -s "https://api.github.com/repos/knesgoda/under-pines-stories-unfold/pulls/$pr_number" | jq -r '.mergeable_state // "unknown"')
    echo $status
}

# Function to merge PR
merge_pr() {
    local pr_number=$1
    echo "🔄 Merging PR #$pr_number..."
    
    # Note: This would require authentication in a real scenario
    # For now, we'll just provide the merge command
    echo "To merge manually, run:"
    echo "gh pr merge $pr_number --squash --delete-branch"
    echo ""
    echo "Or merge via GitHub UI at:"
    echo "https://github.com/knesgoda/under-pines-stories-unfold/pull/$pr_number"
}

# Main monitoring loop
echo "⏳ Waiting for PR to be created..."
sleep 10

# Check if PR exists
pr_number=$(check_pr_exists)

if [ -z "$pr_number" ]; then
    echo "❌ PR not found. Please create the PR manually at:"
    echo "https://github.com/knesgoda/under-pines-stories-unfold/pull/new/feature/auto-task-next-milestone"
    exit 1
fi

echo "✅ PR #$pr_number found!"
echo "🔗 PR URL: https://github.com/knesgoda/under-pines-stories-unfold/pull/$pr_number"

# Monitor CI status
echo "⏳ Monitoring CI status..."
for i in {1..30}; do
    status=$(check_ci_status $pr_number)
    echo "CI Status: $status (attempt $i/30)"
    
    if [ "$status" = "clean" ]; then
        echo "✅ CI passed! Ready to merge."
        merge_pr $pr_number
        break
    elif [ "$status" = "dirty" ] || [ "$status" = "blocked" ]; then
        echo "❌ CI failed or blocked. Please check the PR."
        break
    fi
    
    sleep 30
done

echo "🎉 Auto-merge process complete!"
