"""
Pytest configuration and fixtures for PipLinePro unit tests
"""
import os
import sys
import pytest
import tempfile
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime, date, timezone
from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))

# Set up test environment
os.environ['TESTING'] = 'true'
os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['MOCK_NETWORK'] = 'true'

# Freeze time for deterministic tests
os.environ['FREEZE_TIME'] = '2025-01-01 12:00:00'

@pytest.fixture(scope="session")
def app():
    """Create a test Flask application"""
    from app import create_app
    app = create_app()
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    return app

@pytest.fixture(scope="session")
def db_engine():
    """Create a test database engine"""
    engine = create_engine('sqlite:///:memory:', echo=False)
    return engine

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a test database session"""
    from app.models import Base
    Base.metadata.create_all(db_engine)
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def mock_request():
    """Mock Flask request object"""
    request_mock = Mock()
    request_mock.method = 'GET'
    request_mock.headers = {'Accept': 'application/json'}
    request_mock.url = 'http://localhost:5000/test'
    request_mock.remote_addr = '127.0.0.1'
    request_mock.user_agent = 'test-agent'
    request_mock.user_id = 1
    return request_mock

@pytest.fixture
def mock_user():
    """Mock user object"""
    user = Mock()
    user.id = 1
    user.username = 'testuser'
    user.is_authenticated = True
    user.permissions = ['read', 'write']
    return user

@pytest.fixture
def sample_transaction_data():
    """Sample transaction data for testing"""
    return {
        'client_name': 'Test Client',
        'amount': Decimal('1000.00'),
        'date': date(2025, 1, 1),
        'currency': 'TL',
        'psp': 'Test PSP',
        'category': 'DEP',
        'payment_method': 'Credit Card',
        'notes': 'Test transaction'
    }

@pytest.fixture
def sample_exchange_rate():
    """Sample exchange rate data"""
    return {
        'USD': Decimal('48.50'),
        'EUR': Decimal('52.30'),
        'date': date(2025, 1, 1)
    }

@pytest.fixture
def mock_exchange_rate_service():
    """Mock exchange rate service"""
    with patch('app.services.exchange_rate_service.exchange_rate_service') as mock:
        mock.get_or_fetch_rate.return_value = Decimal('48.50')
        mock.get_rate.return_value = Decimal('48.50')
        yield mock

@pytest.fixture
def mock_database():
    """Mock database operations"""
    with patch('app.db') as mock_db:
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        mock_db.session.rollback = Mock()
        mock_db.session.query = Mock()
        yield mock_db

@pytest.fixture
def mock_logger():
    """Mock logger"""
    with patch('app.utils.logger.get_logger') as mock:
        logger_mock = Mock()
        mock.return_value = logger_mock
        yield logger_mock

@pytest.fixture
def freeze_time():
    """Freeze time for deterministic tests"""
    from freezegun import freeze_time
    with freeze_time('2025-01-01 12:00:00'):
        yield

@pytest.fixture(autouse=True)
def mock_network_calls():
    """Mock all network calls"""
    with patch('requests.get'), \
         patch('requests.post'), \
         patch('urllib.request.urlopen'), \
         patch('yfinance.download'):
        yield

@pytest.fixture(autouse=True)
def mock_file_operations():
    """Mock file operations"""
    with patch('builtins.open', create=True), \
         patch('os.path.exists'), \
         patch('os.makedirs'):
        yield

@pytest.fixture
def mock_redis():
    """Mock Redis operations"""
    with patch('redis.Redis') as mock_redis:
        redis_mock = Mock()
        mock_redis.return_value = redis_mock
        redis_mock.get.return_value = None
        redis_mock.set.return_value = True
        redis_mock.delete.return_value = True
        yield redis_mock

@pytest.fixture
def mock_cache():
    """Mock cache operations"""
    with patch('app.utils.advanced_cache.AdvancedCache') as mock_cache:
        cache_mock = Mock()
        mock_cache.return_value = cache_mock
        cache_mock.get.return_value = None
        cache_mock.set.return_value = True
        cache_mock.delete.return_value = True
        cache_mock.invalidate_pattern.return_value = True
        yield cache_mock

# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "network: Tests that require network access")
    config.addinivalue_line("markers", "database: Tests that require database access")

def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Add unit marker to all tests in unit directory
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        
        # Add slow marker to tests that might be slow
        if "slow" in item.name or "integration" in item.name:
            item.add_marker(pytest.mark.slow)
