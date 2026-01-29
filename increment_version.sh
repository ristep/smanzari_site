#!/bin/bash

# Version increment script for backend and frontend
# Usage: ./increment_version.sh [major|minor|patch] [build_number]

set -e

# Default values
INCREMENT_TYPE=${1:-"patch"}
BUILD_NUMBER=${2:-$(date +%Y%m%d%H%M)}

# File paths
BACKEND_FILE="smanzy_backend/internal/handlers/version.go"
FRONTEND_FILE="smanzy_react_spa/src/version.js"

# Validate files exist
if [[ ! -f "$BACKEND_FILE" ]]; then
    echo "Error: Backend file $BACKEND_FILE not found"
    exit 1
fi

if [[ ! -f "$FRONTEND_FILE" ]]; then
    echo "Error: Frontend file $FRONTEND_FILE not found"
    exit 1
fi

# Validate increment type
if [[ "$INCREMENT_TYPE" != "major" && "$INCREMENT_TYPE" != "minor" && "$INCREMENT_TYPE" != "patch" ]]; then
    echo "Error: Increment type must be major, minor, or patch"
    exit 1
fi

echo "Incrementing $INCREMENT_TYPE version with build number: $BUILD_NUMBER"

# Function to increment backend version
increment_backend() {
    local major=$(grep -o 'VersionMajor = [0-9]*' "$BACKEND_FILE" | grep -o '[0-9]*')
    local minor=$(grep -o 'VersionMinor = [0-9]*' "$BACKEND_FILE" | grep -o '[0-9]*')
    local patch=$(grep -o 'VersionPatch = [0-9]*' "$BACKEND_FILE" | grep -o '[0-9]*')
    
    case $INCREMENT_TYPE in
        "major")
            ((major++))
            minor=0
            patch=0
            ;;
        "minor")
            ((minor++))
            patch=0
            ;;
        "patch")
            ((patch++))
            ;;
    esac
    
    # Update backend version constants
    sed -i "s/VersionMajor = [0-9]*/VersionMajor = $major/" "$BACKEND_FILE"
    sed -i "s/VersionMinor = [0-9]*/VersionMinor = $minor/" "$BACKEND_FILE"
    sed -i "s/VersionPatch = [0-9]*/VersionPatch = $patch/" "$BACKEND_FILE"
    
    # Update pre-release with build number
    sed -i "s/VersionPre   = \".*\"/VersionPre   = \"Build-$BUILD_NUMBER\"/" "$BACKEND_FILE"
    
    echo "Backend version updated to: $major.$minor.$patch-Build-$BUILD_NUMBER"
}

# Function to increment frontend version
increment_frontend() {
    local major=$(grep -o 'VERSION_MAJOR = [0-9]*' "$FRONTEND_FILE" | grep -o '[0-9]*')
    local minor=$(grep -o 'VERSION_MINOR = [0-9]*' "$FRONTEND_FILE" | grep -o '[0-9]*')
    local patch=$(grep -o 'VERSION_PATCH = [0-9]*' "$FRONTEND_FILE" | grep -o '[0-9]*')
    
    case $INCREMENT_TYPE in
        "major")
            ((major++))
            minor=0
            patch=0
            ;;
        "minor")
            ((minor++))
            patch=0
            ;;
        "patch")
            ((patch++))
            ;;
    esac
    
    # Update frontend version constants
    sed -i "s/VERSION_MAJOR = [0-9]*/VERSION_MAJOR = $major/" "$FRONTEND_FILE"
    sed -i "s/VERSION_MINOR = [0-9]*/VERSION_MINOR = $minor/" "$FRONTEND_FILE"
    sed -i "s/VERSION_PATCH = [0-9]*/VERSION_PATCH = $patch/" "$FRONTEND_FILE"
    
    # Update pre-release with build number
    sed -i "s/VERSION_PRE = \".*\"/VERSION_PRE = \"Build-$BUILD_NUMBER\"/" "$FRONTEND_FILE"
    
    echo "Frontend version updated to: $major.$minor.$patch-Build-$BUILD_NUMBER"
}

# Execute increments
increment_backend
increment_frontend

echo "Version increment completed successfully!"
echo ""
echo "Summary:"
echo "- Increment type: $INCREMENT_TYPE"
echo "- Build number: $BUILD_NUMBER"
echo "- Backend file: $BACKEND_FILE"
echo "- Frontend file: $FRONTEND_FILE"