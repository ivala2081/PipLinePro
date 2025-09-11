"""
Unit tests for error_handler.py module
"""
import pytest
from decimal import InvalidOperation
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from sqlalchemy.exc import IntegrityError, OperationalError

from app.utils.error_handler import (
    PipLineError, ValidationError, AuthenticationError, AuthorizationError,
    ResourceNotFoundError, DatabaseError, RateLimitError, FileUploadError,
    JSONParsingError, CSRFError, log_error, handle_database_error,
    handle_validation_error, create_error_response, safe_execute,
    validate_required_fields, validate_numeric_field, validate_date_field,
    handle_api_error, handle_web_error, handle_errors, handle_api_errors,
    validate_request_data, require_permissions
)


class TestPipLineError:
    """Test PipLineError base class"""
    
    def test_pipeline_error_creation(self):
        """Test basic PipLineError creation"""
        error = PipLineError("Test error")
        assert error.message == "Test error"
        assert error.error_code == "INTERNAL_ERROR"
        assert error.status_code == 500
        assert error.details == {}
        assert error.user_message == "An unexpected error occurred. Please try again."
        assert isinstance(error.timestamp, datetime)
    
    def test_pipeline_error_with_custom_values(self):
        """Test PipLineError with custom values"""
        details = {"field": "test_field"}
        error = PipLineError(
            "Custom error",
            error_code="CUSTOM_ERROR",
            status_code=400,
            details=details,
            user_message="Custom user message"
        )
        assert error.message == "Custom error"
        assert error.error_code == "CUSTOM_ERROR"
        assert error.status_code == 400
        assert error.details == details
        assert error.user_message == "Custom user message"


class TestValidationError:
    """Test ValidationError class"""
    
    def test_validation_error_creation(self):
        """Test ValidationError creation"""
        error = ValidationError("Invalid value", field="test_field", value="invalid")
        assert error.message == "Invalid value"
        assert error.error_code == "VALIDATION_ERROR"
        assert error.status_code == 400
        assert error.details == {"field": "test_field", "value": "invalid"}
        assert error.user_message == "Validation error: Invalid value"
    
    def test_validation_error_without_field(self):
        """Test ValidationError without field"""
        error = ValidationError("General validation error")
        assert error.message == "General validation error"
        assert error.details == {"field": None, "value": None}


class TestAuthenticationError:
    """Test AuthenticationError class"""
    
    def test_authentication_error_creation(self):
        """Test AuthenticationError creation"""
        error = AuthenticationError("Login required")
        assert error.message == "Login required"
        assert error.error_code == "AUTHENTICATION_ERROR"
        assert error.status_code == 401
        assert error.user_message == "Please log in to access this resource."
    
    def test_authentication_error_default_message(self):
        """Test AuthenticationError with default message"""
        error = AuthenticationError()
        assert error.message == "Authentication required"


class TestAuthorizationError:
    """Test AuthorizationError class"""
    
    def test_authorization_error_creation(self):
        """Test AuthorizationError creation"""
        error = AuthorizationError("Insufficient permissions")
        assert error.message == "Insufficient permissions"
        assert error.error_code == "AUTHORIZATION_ERROR"
        assert error.status_code == 403
        assert error.user_message == "You don't have permission to perform this action."
    
    def test_authorization_error_default_message(self):
        """Test AuthorizationError with default message"""
        error = AuthorizationError()
        assert error.message == "Insufficient permissions"


class TestResourceNotFoundError:
    """Test ResourceNotFoundError class"""
    
    def test_resource_not_found_error_creation(self):
        """Test ResourceNotFoundError creation"""
        error = ResourceNotFoundError("Transaction", 123)
        assert error.message == "Transaction with id 123 not found"
        assert error.error_code == "RESOURCE_NOT_FOUND"
        assert error.status_code == 404
        assert error.details == {"resource_type": "Transaction", "resource_id": 123}
        assert error.user_message == "The requested transaction was not found."


class TestDatabaseError:
    """Test DatabaseError class"""
    
    def test_database_error_creation(self):
        """Test DatabaseError creation"""
        original_error = Exception("Original error")
        error = DatabaseError("Database operation failed", original_error)
        assert error.message == "Database operation failed"
        assert error.error_code == "DATABASE_ERROR"
        assert error.status_code == 500
        assert error.details == {"original_error": "Original error"}
        assert error.user_message == "A database error occurred. Please try again later."
    
    def test_database_error_without_original_error(self):
        """Test DatabaseError without original error"""
        error = DatabaseError("Database operation failed")
        assert error.details == {"original_error": None}


class TestRateLimitError:
    """Test RateLimitError class"""
    
    def test_rate_limit_error_creation(self):
        """Test RateLimitError creation"""
        error = RateLimitError("Too many requests")
        assert error.message == "Too many requests"
        assert error.error_code == "RATE_LIMIT_ERROR"
        assert error.status_code == 429
        assert error.user_message == "Too many requests. Please try again later."
    
    def test_rate_limit_error_default_message(self):
        """Test RateLimitError with default message"""
        error = RateLimitError()
        assert error.message == "Rate limit exceeded"


class TestFileUploadError:
    """Test FileUploadError class"""
    
    def test_file_upload_error_creation(self):
        """Test FileUploadError creation"""
        error = FileUploadError("Invalid file format", file_type="image")
        assert error.message == "Invalid file format"
        assert error.error_code == "FILE_UPLOAD_ERROR"
        assert error.status_code == 400
        assert error.details == {"file_type": "image"}
        assert error.user_message == "File upload error: Invalid file format"


class TestJSONParsingError:
    """Test JSONParsingError class"""
    
    def test_json_parsing_error_creation(self):
        """Test JSONParsingError creation"""
        error = JSONParsingError("Invalid JSON", data="invalid json data")
        assert error.message == "Invalid JSON"
        assert error.error_code == "JSON_PARSING_ERROR"
        assert error.status_code == 400
        assert error.details == {"data": "invalid json data"}
        assert error.user_message == "Data format error. Please try again."
    
    def test_json_parsing_error_with_long_data(self):
        """Test JSONParsingError with long data (should be truncated)"""
        long_data = "x" * 200
        error = JSONParsingError("Invalid JSON", data=long_data)
        assert error.details == {"data": "x" * 100}


class TestCSRFError:
    """Test CSRFError class"""
    
    def test_csrf_error_creation(self):
        """Test CSRFError creation"""
        error = CSRFError("CSRF token validation failed")
        assert error.message == "CSRF token validation failed"
        assert error.error_code == "CSRF_ERROR"
        assert error.status_code == 400
        assert error.user_message == "Security validation failed. Please refresh the page and try again."
    
    def test_csrf_error_default_message(self):
        """Test CSRFError with default message"""
        error = CSRFError()
        assert error.message == "CSRF token validation failed"


class TestLogError:
    """Test log_error function"""
    
    @patch('app.utils.error_handler.get_logger')
    def test_log_error_basic(self, mock_get_logger):
        """Test basic log_error functionality"""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger
        
        error = PipLineError("Test error")
        log_error(error)
        
        mock_get_logger.assert_called_once_with("PipLinePro")
        mock_logger.error.assert_called_once()
    
    @patch('app.utils.error_handler.get_logger')
    def test_log_error_with_context(self, mock_get_logger):
        """Test log_error with context"""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger
        
        error = PipLineError("Test error")
        context = {"user_id": 123, "operation": "test"}
        log_error(error, context)
        
        mock_logger.error.assert_called_once()
        # Check that context was included in the log call
        call_args = mock_logger.error.call_args
        assert "user_id" in str(call_args)
        assert "operation" in str(call_args)


class TestHandleDatabaseError:
    """Test handle_database_error function"""
    
    def test_handle_integrity_error(self):
        """Test handling IntegrityError"""
        original_error = IntegrityError("Integrity constraint failed", None, None)
        result = handle_database_error(original_error, "test operation")
        
        assert isinstance(result, DatabaseError)
        assert "Data integrity error during test operation" in result.message
        assert result.details["original_error"] == "Integrity constraint failed"
    
    def test_handle_operational_error(self):
        """Test handling OperationalError"""
        original_error = OperationalError("Connection failed", None, None)
        result = handle_database_error(original_error, "test operation")
        
        assert isinstance(result, DatabaseError)
        assert "Database connection error during test operation" in result.message
        assert result.details["original_error"] == "Connection failed"
    
    def test_handle_other_sqlalchemy_error(self):
        """Test handling other SQLAlchemyError"""
        original_error = Exception("Other database error")
        result = handle_database_error(original_error, "test operation")
        
        assert isinstance(result, DatabaseError)
        assert "Database error during test operation" in result.message
        assert result.details["original_error"] == "Other database error"


class TestHandleValidationError:
    """Test handle_validation_error function"""
    
    def test_handle_invalid_operation(self):
        """Test handling InvalidOperation"""
        original_error = InvalidOperation("Invalid decimal operation")
        result = handle_validation_error(original_error, "amount")
        
        assert isinstance(result, ValidationError)
        assert result.message == "Invalid numeric value provided"
        assert result.details["field"] == "amount"
        assert result.details["value"] is None
    
    def test_handle_value_error(self):
        """Test handling ValueError"""
        original_error = ValueError("Invalid value")
        result = handle_validation_error(original_error, "amount")
        
        assert isinstance(result, ValidationError)
        assert result.message == "Invalid value"
        assert result.details["field"] == "amount"
    
    def test_handle_other_error(self):
        """Test handling other error types"""
        original_error = Exception("Other error")
        result = handle_validation_error(original_error, "amount")
        
        assert isinstance(result, ValidationError)
        assert result.message == "Other error"
        assert result.details["field"] == "amount"


class TestCreateErrorResponse:
    """Test create_error_response function"""
    
    def test_create_json_response(self):
        """Test creating JSON error response"""
        error = PipLineError("Test error", error_code="TEST_ERROR", status_code=400)
        response, status_code = create_error_response(error, 'json')
        
        assert status_code == 400
        assert response.status_code == 400
        # Check response data structure
        data = response.get_json()
        assert 'error' in data
        assert data['error']['code'] == 'TEST_ERROR'
        assert data['error']['message'] == error.user_message
    
    def test_create_html_response(self):
        """Test creating HTML error response"""
        error = PipLineError("Test error", error_code="TEST_ERROR", status_code=400)
        response, status_code = create_error_response(error, 'html')
        
        assert status_code == 400
        assert response.status_code == 400


class TestSafeExecute:
    """Test safe_execute function"""
    
    def test_safe_execute_success(self):
        """Test safe_execute with successful function"""
        def test_func(x, y):
            return x + y
        
        result = safe_execute(test_func, 2, 3)
        assert result == 5
    
    def test_safe_execute_pipeline_error(self):
        """Test safe_execute with PipLineError (should re-raise)"""
        def test_func():
            raise PipLineError("Test error")
        
        with pytest.raises(PipLineError) as exc_info:
            safe_execute(test_func)
        assert str(exc_info.value) == "Test error"
    
    def test_safe_execute_validation_error(self):
        """Test safe_execute with ValidationError (should re-raise)"""
        def test_func():
            raise ValidationError("Validation failed")
        
        with pytest.raises(ValidationError) as exc_info:
            safe_execute(test_func)
        assert str(exc_info.value) == "Validation failed"
    
    @patch('app.utils.error_handler.handle_database_error')
    @patch('app.utils.error_handler.log_error')
    def test_safe_execute_sqlalchemy_error(self, mock_log_error, mock_handle_db_error):
        """Test safe_execute with SQLAlchemyError"""
        mock_handle_db_error.return_value = DatabaseError("Database error")
        
        def test_func():
            raise IntegrityError("Integrity error", None, None)
        
        with pytest.raises(DatabaseError):
            safe_execute(test_func)
        
        mock_handle_db_error.assert_called_once()
        mock_log_error.assert_called_once()
    
    @patch('app.utils.error_handler.log_error')
    def test_safe_execute_unexpected_error(self, mock_log_error):
        """Test safe_execute with unexpected error"""
        def test_func():
            raise Exception("Unexpected error")
        
        with pytest.raises(PipLineError) as exc_info:
            safe_execute(test_func)
        
        assert "Unexpected error in test_func" in str(exc_info.value)
        mock_log_error.assert_called_once()


class TestValidateRequiredFields:
    """Test validate_required_fields function"""
    
    def test_validate_required_fields_success(self):
        """Test validation with all required fields present"""
        data = {"field1": "value1", "field2": "value2", "field3": "value3"}
        required_fields = ["field1", "field2"]
        
        # Should not raise an exception
        validate_required_fields(data, required_fields)
    
    def test_validate_required_fields_missing(self):
        """Test validation with missing required fields"""
        data = {"field1": "value1"}
        required_fields = ["field1", "field2", "field3"]
        
        with pytest.raises(ValidationError) as exc_info:
            validate_required_fields(data, required_fields)
        
        assert "Missing required fields: field2, field3" in str(exc_info.value)
        assert exc_info.value.details["field"] == "required_fields"
        assert exc_info.value.details["value"] == ["field2", "field3"]
    
    def test_validate_required_fields_empty_values(self):
        """Test validation with empty values"""
        data = {"field1": "", "field2": None, "field3": "   "}
        required_fields = ["field1", "field2", "field3"]
        
        with pytest.raises(ValidationError) as exc_info:
            validate_required_fields(data, required_fields)
        
        assert "Missing required fields: field1, field2, field3" in str(exc_info.value)


class TestValidateNumericField:
    """Test validate_numeric_field function"""
    
    def test_validate_numeric_field_success(self):
        """Test validation with valid numeric value"""
        result = validate_numeric_field("123.45", "amount")
        assert result == 123.45
    
    def test_validate_numeric_field_with_min_max(self):
        """Test validation with min/max constraints"""
        result = validate_numeric_field("50", "amount", min_value=0, max_value=100)
        assert result == 50.0
    
    def test_validate_numeric_field_below_min(self):
        """Test validation with value below minimum"""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_field("-10", "amount", min_value=0)
        
        assert "amount must be at least 0" in str(exc_info.value)
        assert exc_info.value.details["field"] == "amount"
        assert exc_info.value.details["value"] == -10.0
    
    def test_validate_numeric_field_above_max(self):
        """Test validation with value above maximum"""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_field("150", "amount", max_value=100)
        
        assert "amount must be at most 100" in str(exc_info.value)
        assert exc_info.value.details["field"] == "amount"
        assert exc_info.value.details["value"] == 150.0
    
    def test_validate_numeric_field_invalid_value(self):
        """Test validation with invalid numeric value"""
        with pytest.raises(ValidationError) as exc_info:
            validate_numeric_field("invalid", "amount")
        
        assert "amount must be a valid number" in str(exc_info.value)
        assert exc_info.value.details["field"] == "amount"
        assert exc_info.value.details["value"] == "invalid"


class TestValidateDateField:
    """Test validate_date_field function"""
    
    def test_validate_date_field_success(self):
        """Test validation with valid date"""
        result = validate_date_field("2025-01-01", "date")
        assert result == datetime(2025, 1, 1)
    
    def test_validate_date_field_invalid_format(self):
        """Test validation with invalid date format"""
        with pytest.raises(ValidationError) as exc_info:
            validate_date_field("01/01/2025", "date")
        
        assert "date must be a valid date in YYYY-MM-DD format" in str(exc_info.value)
        assert exc_info.value.details["field"] == "date"
        assert exc_info.value.details["value"] == "01/01/2025"


class TestHandleApiError:
    """Test handle_api_error function"""
    
    def test_handle_api_error_pipeline_error(self):
        """Test handling PipLineError in API"""
        error = PipLineError("Test error")
        response, status_code = handle_api_error(error)
        
        assert status_code == 500
        assert response.status_code == 500
    
    @patch('app.utils.error_handler.log_error')
    def test_handle_api_error_unexpected_error(self, mock_log_error):
        """Test handling unexpected error in API"""
        error = Exception("Unexpected error")
        response, status_code = handle_api_error(error)
        
        assert status_code == 500
        assert response.status_code == 500
        mock_log_error.assert_called_once()


class TestHandleWebError:
    """Test handle_web_error function"""
    
    def test_handle_web_error_pipeline_error(self):
        """Test handling PipLineError in web"""
        error = PipLineError("Test error")
        response, status_code = handle_web_error(error)
        
        assert status_code == 500
        assert response.status_code == 500
    
    @patch('app.utils.error_handler.log_error')
    def test_handle_web_error_unexpected_error(self, mock_log_error):
        """Test handling unexpected error in web"""
        error = Exception("Unexpected error")
        response, status_code = handle_web_error(error)
        
        assert status_code == 500
        assert response.status_code == 500
        mock_log_error.assert_called_once()


class TestHandleErrorsDecorator:
    """Test handle_errors decorator"""
    
    def test_handle_errors_success(self):
        """Test handle_errors decorator with successful function"""
        @handle_errors
        def test_func():
            return "success"
        
        result = test_func()
        assert result == "success"
    
    @patch('app.utils.error_handler.log_error')
    def test_handle_errors_pipeline_error(self, mock_log_error):
        """Test handle_errors decorator with PipLineError"""
        @handle_errors
        def test_func():
            raise PipLineError("Test error")
        
        response, status_code = test_func()
        assert status_code == 500
        mock_log_error.assert_called_once()
    
    @patch('app.utils.error_handler.log_error')
    def test_handle_errors_csrf_error(self, mock_log_error):
        """Test handle_errors decorator with CSRF error"""
        @handle_errors
        def test_func():
            raise Exception("CSRF token validation failed")
        
        response, status_code = test_func()
        assert status_code == 400
        mock_log_error.assert_called_once()
    
    @patch('app.utils.error_handler.log_error')
    def test_handle_errors_unexpected_error(self, mock_log_error):
        """Test handle_errors decorator with unexpected error"""
        @handle_errors
        def test_func():
            raise Exception("Unexpected error")
        
        response, status_code = test_func()
        assert status_code == 500
        mock_log_error.assert_called_once()


class TestHandleApiErrorsDecorator:
    """Test handle_api_errors decorator"""
    
    def test_handle_api_errors_success(self):
        """Test handle_api_errors decorator with successful function"""
        @handle_api_errors
        def test_func():
            return "success"
        
        result = test_func()
        assert result == "success"
    
    @patch('app.utils.error_handler.log_error')
    def test_handle_api_errors_pipeline_error(self, mock_log_error):
        """Test handle_api_errors decorator with PipLineError"""
        @handle_api_errors
        def test_func():
            raise PipLineError("Test error")
        
        response, status_code = test_func()
        assert status_code == 500
        mock_log_error.assert_called_once()


class TestValidateRequestDataDecorator:
    """Test validate_request_data decorator"""
    
    @patch('app.utils.error_handler.request')
    def test_validate_request_data_success(self, mock_request):
        """Test validate_request_data decorator with valid data"""
        mock_request.method = 'POST'
        mock_request.get_json.return_value = {"field1": "value1", "field2": "value2"}
        mock_request.form.to_dict.return_value = {}
        mock_request.headers.get.return_value = 'application/json'
        
        @validate_request_data(required_fields=["field1"])
        def test_func():
            return "success"
        
        result = test_func()
        assert result == "success"
        assert hasattr(mock_request, 'validated_data')
    
    @patch('app.utils.error_handler.request')
    def test_validate_request_data_missing_fields(self, mock_request):
        """Test validate_request_data decorator with missing fields"""
        mock_request.method = 'POST'
        mock_request.get_json.return_value = {"field1": "value1"}
        mock_request.form.to_dict.return_value = {}
        mock_request.headers.get.return_value = 'application/json'
        
        @validate_request_data(required_fields=["field1", "field2"])
        def test_func():
            return "success"
        
        response, status_code = test_func()
        assert status_code == 400


class TestRequirePermissionsDecorator:
    """Test require_permissions decorator"""
    
    @patch('app.utils.error_handler.current_user')
    @patch('app.utils.error_handler.request')
    def test_require_permissions_success(self, mock_request, mock_current_user):
        """Test require_permissions decorator with sufficient permissions"""
        mock_current_user.is_authenticated = True
        mock_current_user.permissions = ["read", "write", "admin"]
        mock_request.headers.get.return_value = 'application/json'
        
        @require_permissions("read", "write")
        def test_func():
            return "success"
        
        result = test_func()
        assert result == "success"
    
    @patch('app.utils.error_handler.current_user')
    @patch('app.utils.error_handler.request')
    def test_require_permissions_not_authenticated(self, mock_request, mock_current_user):
        """Test require_permissions decorator with unauthenticated user"""
        mock_current_user.is_authenticated = False
        mock_request.headers.get.return_value = 'application/json'
        
        @require_permissions("read")
        def test_func():
            return "success"
        
        response, status_code = test_func()
        assert status_code == 401
    
    @patch('app.utils.error_handler.current_user')
    @patch('app.utils.error_handler.request')
    def test_require_permissions_insufficient_permissions(self, mock_request, mock_current_user):
        """Test require_permissions decorator with insufficient permissions"""
        mock_current_user.is_authenticated = True
        mock_current_user.permissions = ["read"]
        mock_request.headers.get.return_value = 'application/json'
        
        @require_permissions("read", "admin")
        def test_func():
            return "success"
        
        response, status_code = test_func()
        assert status_code == 403
