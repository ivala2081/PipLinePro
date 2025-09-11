#!/bin/bash

# Test Cleanup Script for PipLinePro
# This script removes test artifacts based on cleanup-manifest.txt
# Safety checks prevent accidental deletion of important files

set -euo pipefail

# Configuration
WORK_DIR="${1:-/work}"
REPO_DIR="${2:-app}"
MANIFEST_FILE="cleanup-manifest.txt"
DRY_RUN="${DRY_RUN:-0}"
CONFIRM_REMOVE="${CONFIRM_REMOVE:-NO}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Safety checks
echo -e "${BLUE}🔍 Running safety checks...${NC}"

# Check if we're in the correct directory
if [[ "$(pwd)" != "$WORK_DIR" ]]; then
    echo -e "${RED}❌ Error: Must run from work directory $WORK_DIR${NC}"
    echo -e "${YELLOW}💡 Current directory: $(pwd)${NC}"
    exit 1
fi

# Check if manifest file exists
if [[ ! -f "$MANIFEST_FILE" ]]; then
    echo -e "${RED}❌ Error: Manifest file $MANIFEST_FILE not found${NC}"
    exit 1
fi

# Check if git working tree is dirty
if command -v git >/dev/null 2>&1; then
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${YELLOW}⚠️  Warning: Git working tree has uncommitted changes${NC}"
        if [[ "$CONFIRM_REMOVE" != "YES" ]]; then
            echo -e "${RED}❌ Error: Refusing to run with dirty working tree unless CONFIRM_REMOVE=YES${NC}"
            echo -e "${YELLOW}💡 To proceed anyway, set CONFIRM_REMOVE=YES${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ Proceeding with dirty working tree (CONFIRM_REMOVE=YES)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Warning: Git not available, skipping working tree check${NC}"
fi

# Check if we're on main branch
if command -v git >/dev/null 2>&1; then
    current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
        echo -e "${YELLOW}⚠️  Warning: Currently on $current_branch branch${NC}"
        if [[ "$CONFIRM_REMOVE" != "YES" ]]; then
            echo -e "${RED}❌ Error: Refusing to run on main branch unless CONFIRM_REMOVE=YES${NC}"
            echo -e "${YELLOW}💡 To proceed anyway, set CONFIRM_REMOVE=YES${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ Proceeding on main branch (CONFIRM_REMOVE=YES)${NC}"
        fi
    fi
fi

# Check for production environment variables
if env | grep -i "PROD" > /dev/null; then
    echo -e "${RED}❌ Error: Production environment variables detected. Aborting for safety.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Safety checks passed${NC}"

# Read manifest and prepare cleanup list
echo -e "${BLUE}📋 Reading cleanup manifest...${NC}"

cleanup_paths=()
while IFS= read -r line; do
    # Skip comments and empty lines
    if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
        continue
    fi
    
    # Skip lines that don't look like paths
    if [[ ! "$line" =~ ^[a-zA-Z0-9_./-] ]]; then
        continue
    fi
    
    # Add to cleanup list if path exists
    if [[ -e "$line" ]]; then
        cleanup_paths+=("$line")
    fi
done < "$MANIFEST_FILE"

if [[ ${#cleanup_paths[@]} -eq 0 ]]; then
    echo -e "${GREEN}✅ No test artifacts found to clean up${NC}"
    exit 0
fi

echo -e "${BLUE}📊 Found ${#cleanup_paths[@]} items to clean up${NC}"

# Show what will be deleted
echo -e "${YELLOW}📝 Items to be removed:${NC}"
for path in "${cleanup_paths[@]}"; do
    if [[ -d "$path" ]]; then
        echo -e "  📁 $path (directory)"
    elif [[ -f "$path" ]]; then
        echo -e "  📄 $path (file)"
    else
        echo -e "  ❓ $path (unknown type)"
    fi
done

# Dry run mode
if [[ "$DRY_RUN" == "1" ]]; then
    echo -e "${BLUE}🔍 DRY RUN MODE - No files will be deleted${NC}"
    echo -e "${GREEN}✅ Dry run completed successfully${NC}"
    exit 0
fi

# Confirmation prompt
if [[ "$CONFIRM_REMOVE" != "YES" ]]; then
    echo -e "${YELLOW}⚠️  Are you sure you want to delete these test artifacts? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Cleanup cancelled by user${NC}"
        exit 0
    fi
fi

# Perform cleanup
echo -e "${BLUE}🧹 Starting cleanup...${NC}"

deleted_count=0
error_count=0

for path in "${cleanup_paths[@]}"; do
    if [[ -e "$path" ]]; then
        if rm -rf "$path" 2>/dev/null; then
            echo -e "  ✅ Deleted: $path"
            ((deleted_count++))
        else
            echo -e "  ❌ Failed to delete: $path"
            ((error_count++))
        fi
    else
        echo -e "  ⚠️  Path not found: $path"
    fi
done

# Summary
echo -e "${BLUE}📊 Cleanup Summary:${NC}"
echo -e "  ✅ Successfully deleted: $deleted_count items"
if [[ $error_count -gt 0 ]]; then
    echo -e "  ❌ Failed to delete: $error_count items"
    exit 1
else
    echo -e "  🎉 All items deleted successfully"
fi

echo -e "${GREEN}✅ Test cleanup completed successfully${NC}"
