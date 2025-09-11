#!/usr/bin/env python3
"""
Comprehensive test runner for PipLinePro unit tests
"""
import os
import sys
import subprocess
import argparse
import time
from pathlib import Path

def setup_test_environment():
    """Set up test environment variables"""
    os.environ['TESTING'] = 'true'
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['MOCK_NETWORK'] = 'true'
    os.environ['FREEZE_TIME'] = '2025-01-01 12:00:00'
    os.environ['PYTHONHASHSEED'] = '42'

def run_tests(test_path='tests/unit', verbose=False, coverage=True, parallel=False):
    """Run unit tests with specified options"""
    setup_test_environment()
    
    # Build pytest command
    cmd = ['python', '-m', 'pytest']
    
    if verbose:
        cmd.append('-v')
    
    if coverage:
        cmd.extend([
            '--cov=app',
            '--cov-report=html:artifacts/coverage-unit',
            '--cov-report=xml:artifacts/coverage-unit/coverage.xml',
            '--cov-report=term-missing',
            '--cov-fail-under=80'
        ])
    
    if parallel:
        cmd.extend(['-n', 'auto'])
    
    cmd.extend([
        '--tb=short',
        '--maxfail=10',
        '--durations=10',
        '--strict-markers',
        '--disable-warnings',
        '--randomly-seed=42',
        '--randomly-dont-reorganize',
        test_path
    ])
    
    print(f"Running command: {' '.join(cmd)}")
    
    # Run tests
    start_time = time.time()
    result = subprocess.run(cmd, capture_output=False)
    end_time = time.time()
    
    print(f"\nTest execution time: {end_time - start_time:.2f} seconds")
    
    return result.returncode

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Run PipLinePro unit tests')
    parser.add_argument('--path', default='tests/unit', help='Test path to run')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--no-coverage', action='store_true', help='Disable coverage reporting')
    parser.add_argument('--parallel', '-p', action='store_true', help='Run tests in parallel')
    parser.add_argument('--quick', action='store_true', help='Quick test run (no coverage, no parallel)')
    
    args = parser.parse_args()
    
    # Quick mode overrides
    if args.quick:
        args.coverage = False
        args.parallel = False
        args.verbose = True
    
    # Create artifacts directory
    os.makedirs('artifacts/coverage-unit', exist_ok=True)
    
    print("🚀 Starting PipLinePro Unit Tests")
    print(f"📁 Test path: {args.path}")
    print(f"📊 Coverage: {'Enabled' if not args.no_coverage else 'Disabled'}")
    print(f"⚡ Parallel: {'Enabled' if args.parallel else 'Disabled'}")
    print(f"🔍 Verbose: {'Enabled' if args.verbose else 'Disabled'}")
    print("-" * 50)
    
    # Run tests
    exit_code = run_tests(
        test_path=args.path,
        verbose=args.verbose,
        coverage=not args.no_coverage,
        parallel=args.parallel
    )
    
    if exit_code == 0:
        print("\n✅ All tests passed!")
    else:
        print(f"\n❌ Tests failed with exit code {exit_code}")
    
    return exit_code

if __name__ == '__main__':
    sys.exit(main())
