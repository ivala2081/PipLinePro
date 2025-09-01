#!/usr/bin/env python3
"""
WSGI entry point for PipLinePro production deployment
"""

import os
import sys
from pathlib import Path

# Add the application directory to Python path
app_dir = Path(__file__).parent.parent
sys.path.insert(0, str(app_dir))

# Set production environment
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_DEBUG', 'False')

# Import the application
try:
    from app import create_app
    from deployment.production_config import ProductionConfig
    
    # Create the application instance
    application = create_app(ProductionConfig)
    app = application  # For gunicorn compatibility
    
    if __name__ == "__main__":
        # For development/testing
        app.run(host='0.0.0.0', port=8000, debug=False)
        
except Exception as e:
    print(f"❌ Error creating application: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
