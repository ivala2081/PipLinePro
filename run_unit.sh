#!/bin/bash

# Unit Test Runner for PipLinePro
# This script runs unit tests with proper isolation and safety checks

set -euo pipefail

# Configuration
REPO_DIR="${1:-app}"
WORK_DIR="${2:-/work}"
ARTIFACTS_DIR="${3:-/work/artifacts}"
TEST_TIMEOUT=300
MAX_WORKERS=4

# Safety checks
if [[ "$(pwd)" != "$WORK_DIR" ]]; then
    echo "❌ Error: Must run from work directory $WORK_DIR"
    exit 1
fi

if [[ ! -d "$REPO_DIR" ]]; then
    echo "❌ Error: Repository directory $REPO_DIR not found"
    exit 1
fi

# Check for production environment variables
if env | grep -i "PROD" > /dev/null; then
    echo "❌ Error: Production environment variables detected. Aborting for safety."
    exit 1
fi

# Create artifacts directory
mkdir -p "$ARTIFACTS_DIR/coverage-unit"

# Set up test environment
export PYTHONPATH="$WORK_DIR:$PYTHONPATH"
export PYTEST_CURRENT_TEST="true"
export TESTING="true"
export FLASK_ENV="testing"
export DATABASE_URL="sqlite:///:memory:"

# Freeze time for deterministic tests
export FREEZE_TIME="2025-01-01 12:00:00"

# Set random seed for deterministic tests
export PYTHONHASHSEED="42"

# Disable network calls
export MOCK_NETWORK="true"

# Create test directory if it doesn't exist
mkdir -p tests

echo "🚀 Starting unit tests for PipLinePro..."
echo "📁 Repository: $REPO_DIR"
echo "📊 Artifacts: $ARTIFACTS_DIR"
echo "⏱️  Timeout: ${TEST_TIMEOUT}s"
echo "🔧 Workers: $MAX_WORKERS"

# Run tests with coverage
pytest \
    --timeout="$TEST_TIMEOUT" \
    --maxfail=10 \
    --tb=short \
    --cov="$REPO_DIR" \
    --cov-report=html:"$ARTIFACTS_DIR/coverage-unit" \
    --cov-report=xml:"$ARTIFACTS_DIR/coverage-unit/coverage.xml" \
    --cov-report=term-missing \
    --cov-fail-under=80 \
    --junit-xml="$ARTIFACTS_DIR/coverage-unit/junit.xml" \
    --html="$ARTIFACTS_DIR/coverage-unit/report.html" \
    --self-contained-html \
    --durations=10 \
    --maxfail=10 \
    --strict-markers \
    --disable-warnings \
    --randomly-seed=42 \
    --randomly-dont-reorganize \
    -v \
    tests/

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    echo "📊 Coverage report: $ARTIFACTS_DIR/coverage-unit/index.html"
    echo "📈 JUnit report: $ARTIFACTS_DIR/coverage-unit/junit.xml"
    exit 0
else
    echo "❌ Some tests failed!"
    exit 1
fi
