"""
Production Configuration for PipLinePro Deployment
"""
import os
import secrets
from datetime import timedelta


class ProductionConfig:
    """Production configuration class"""
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(64)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database - Using SQLite for simplicity (can be changed to PostgreSQL later)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instance/treasury_improved.db'
    
    # Upload settings
    UPLOAD_FOLDER = os.path.join('static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'jpg', 'jpeg', 'png'}
    
    # Security settings for production
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False  # Set to True if using HTTPS
    
    # Bulk delete security
    BULK_DELETE_CONFIRMATION_CODE = os.environ.get('BULK_DELETE_CONFIRMATION_CODE', '4561')
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_DEFAULT = "500 per day; 100 per hour; 20 per minute"
    
    # Logging
    LOG_LEVEL = 'WARNING'  # Less verbose in production
    LOG_FILE = 'logs/pipeline_production.log'
    
    # Redis (optional - will fallback gracefully if not available)
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    REDIS_CACHE_TTL = 300
    REDIS_SESSION_TTL = 14400
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_urlsafe(32)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4)
    
    # Performance settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_timeout': 20,
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'max_overflow': 0
    }
    
    # Exchange rate settings
    EXCHANGE_RATE_API_TIMEOUT = 10
    EXCHANGE_RATE_UPDATE_INTERVAL = 900  # 15 minutes
    
    # Development flags - all disabled in production
    DEBUG = False
    TESTING = False
    DEVELOPMENT = False
