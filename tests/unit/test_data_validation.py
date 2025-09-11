"""
Unit tests for data_validation.py module
"""
import pytest
from decimal import Decimal
from datetime import date, datetime
from unittest.mock import Mock, patch

from app.utils.data_validation import (
    validate_transaction_data, validate_amount, validate_date,
    validate_currency, validate_psp, validate_category,
    validate_payment_method, sanitize_string, validate_email,
    validate_phone, validate_client_name
)


class TestValidateTransactionData:
    """Test validate_transaction_data function"""
    
    def test_validate_transaction_data_valid(self):
        """Test validation with valid transaction data"""
        data = {
            'client_name': 'Test Client',
            'amount': '1000.00',
            'currency': 'TL',
            'psp': 'Test PSP',
            'category': 'DEP',
            'payment_method': 'Credit Card',
            'date': '2025-01-01'
        }
        
        result = validate_transaction_data(data)
        assert result['valid'] is True
        assert result['errors'] == []
    
    def test_validate_transaction_data_missing_required_fields(self):
        """Test validation with missing required fields"""
        data = {
            'amount': '1000.00',
            'currency': 'TL'
        }
        
        result = validate_transaction_data(data)
        assert result['valid'] is False
        assert 'client_name' in str(result['errors'])
    
    def test_validate_transaction_data_invalid_amount(self):
        """Test validation with invalid amount"""
        data = {
            'client_name': 'Test Client',
            'amount': 'invalid',
            'currency': 'TL'
        }
        
        result = validate_transaction_data(data)
        assert result['valid'] is False
        assert 'amount' in str(result['errors']).lower()
    
    def test_validate_transaction_data_invalid_date(self):
        """Test validation with invalid date"""
        data = {
            'client_name': 'Test Client',
            'amount': '1000.00',
            'currency': 'TL',
            'date': 'invalid-date'
        }
        
        result = validate_transaction_data(data)
        assert result['valid'] is False
        assert 'date' in str(result['errors']).lower()


class TestValidateAmount:
    """Test validate_amount function"""
    
    def test_validate_amount_valid_positive(self):
        """Test validation with valid positive amount"""
        result = validate_amount('1000.50')
        assert result['valid'] is True
        assert result['value'] == Decimal('1000.50')
    
    def test_validate_amount_valid_negative(self):
        """Test validation with valid negative amount"""
        result = validate_amount('-500.25')
        assert result['valid'] is True
        assert result['value'] == Decimal('-500.25')
    
    def test_validate_amount_zero(self):
        """Test validation with zero amount"""
        result = validate_amount('0')
        assert result['valid'] is True
        assert result['value'] == Decimal('0')
    
    def test_validate_amount_invalid_string(self):
        """Test validation with invalid string"""
        result = validate_amount('invalid')
        assert result['valid'] is False
        assert 'Invalid amount format' in result['error']
    
    def test_validate_amount_empty_string(self):
        """Test validation with empty string"""
        result = validate_amount('')
        assert result['valid'] is False
        assert 'Amount is required' in result['error']
    
    def test_validate_amount_none(self):
        """Test validation with None value"""
        result = validate_amount(None)
        assert result['valid'] is False
        assert 'Amount is required' in result['error']


class TestValidateDate:
    """Test validate_date function"""
    
    def test_validate_date_valid_iso_format(self):
        """Test validation with valid ISO date format"""
        result = validate_date('2025-01-01')
        assert result['valid'] is True
        assert result['value'] == date(2025, 1, 1)
    
    def test_validate_date_valid_different_format(self):
        """Test validation with valid different date format"""
        result = validate_date('01/01/2025', format='%d/%m/%Y')
        assert result['valid'] is True
        assert result['value'] == date(2025, 1, 1)
    
    def test_validate_date_invalid_format(self):
        """Test validation with invalid date format"""
        result = validate_date('invalid-date')
        assert result['valid'] is False
        assert 'Invalid date format' in result['error']
    
    def test_validate_date_empty_string(self):
        """Test validation with empty string"""
        result = validate_date('')
        assert result['valid'] is False
        assert 'Date is required' in result['error']
    
    def test_validate_date_none(self):
        """Test validation with None value"""
        result = validate_date(None)
        assert result['valid'] is False
        assert 'Date is required' in result['error']


class TestValidateCurrency:
    """Test validate_currency function"""
    
    def test_validate_currency_valid_tl(self):
        """Test validation with valid TL currency"""
        result = validate_currency('TL')
        assert result['valid'] is True
        assert result['value'] == 'TL'
    
    def test_validate_currency_valid_usd(self):
        """Test validation with valid USD currency"""
        result = validate_currency('USD')
        assert result['valid'] is True
        assert result['value'] == 'USD'
    
    def test_validate_currency_valid_eur(self):
        """Test validation with valid EUR currency"""
        result = validate_currency('EUR')
        assert result['valid'] is True
        assert result['value'] == 'EUR'
    
    def test_validate_currency_invalid_currency(self):
        """Test validation with invalid currency"""
        result = validate_currency('INVALID')
        assert result['valid'] is False
        assert 'Invalid currency' in result['error']
    
    def test_validate_currency_case_insensitive(self):
        """Test validation with case insensitive currency"""
        result = validate_currency('usd')
        assert result['valid'] is True
        assert result['value'] == 'USD'
    
    def test_validate_currency_empty_string(self):
        """Test validation with empty string"""
        result = validate_currency('')
        assert result['valid'] is False
        assert 'Currency is required' in result['error']


class TestValidatePsp:
    """Test validate_psp function"""
    
    def test_validate_psp_valid(self):
        """Test validation with valid PSP"""
        result = validate_psp('Test PSP')
        assert result['valid'] is True
        assert result['value'] == 'Test PSP'
    
    def test_validate_psp_empty_string(self):
        """Test validation with empty string"""
        result = validate_psp('')
        assert result['valid'] is True  # PSP is optional
        assert result['value'] == ''
    
    def test_validate_psp_none(self):
        """Test validation with None value"""
        result = validate_psp(None)
        assert result['valid'] is True  # PSP is optional
        assert result['value'] is None
    
    def test_validate_psp_too_long(self):
        """Test validation with too long PSP name"""
        long_psp = 'A' * 256  # Assuming max length is 255
        result = validate_psp(long_psp)
        assert result['valid'] is False
        assert 'PSP name too long' in result['error']


class TestValidateCategory:
    """Test validate_category function"""
    
    def test_validate_category_valid_dep(self):
        """Test validation with valid DEP category"""
        result = validate_category('DEP')
        assert result['valid'] is True
        assert result['value'] == 'DEP'
    
    def test_validate_category_valid_wd(self):
        """Test validation with valid WD category"""
        result = validate_category('WD')
        assert result['valid'] is True
        assert result['value'] == 'WD'
    
    def test_validate_category_invalid_category(self):
        """Test validation with invalid category"""
        result = validate_category('INVALID')
        assert result['valid'] is False
        assert 'Invalid category' in result['error']
    
    def test_validate_category_case_insensitive(self):
        """Test validation with case insensitive category"""
        result = validate_category('dep')
        assert result['valid'] is True
        assert result['value'] == 'DEP'
    
    def test_validate_category_empty_string(self):
        """Test validation with empty string"""
        result = validate_category('')
        assert result['valid'] is False
        assert 'Category is required' in result['error']


class TestValidatePaymentMethod:
    """Test validate_payment_method function"""
    
    def test_validate_payment_method_valid_credit_card(self):
        """Test validation with valid credit card payment method"""
        result = validate_payment_method('Credit Card')
        assert result['valid'] is True
        assert result['value'] == 'Credit Card'
    
    def test_validate_payment_method_valid_bank(self):
        """Test validation with valid bank payment method"""
        result = validate_payment_method('Bank')
        assert result['valid'] is True
        assert result['value'] == 'Bank'
    
    def test_validate_payment_method_valid_tether(self):
        """Test validation with valid tether payment method"""
        result = validate_payment_method('Tether')
        assert result['valid'] is True
        assert result['value'] == 'Tether'
    
    def test_validate_payment_method_invalid_method(self):
        """Test validation with invalid payment method"""
        result = validate_payment_method('INVALID')
        assert result['valid'] is False
        assert 'Invalid payment method' in result['error']
    
    def test_validate_payment_method_empty_string(self):
        """Test validation with empty string"""
        result = validate_payment_method('')
        assert result['valid'] is True  # Payment method is optional
        assert result['value'] == ''


class TestSanitizeString:
    """Test sanitize_string function"""
    
    def test_sanitize_string_normal(self):
        """Test sanitization with normal string"""
        result = sanitize_string('Test String')
        assert result == 'Test String'
    
    def test_sanitize_string_with_whitespace(self):
        """Test sanitization with leading/trailing whitespace"""
        result = sanitize_string('  Test String  ')
        assert result == 'Test String'
    
    def test_sanitize_string_with_special_chars(self):
        """Test sanitization with special characters"""
        result = sanitize_string('Test<>String&"')
        assert result == 'TestString'
    
    def test_sanitize_string_empty(self):
        """Test sanitization with empty string"""
        result = sanitize_string('')
        assert result == ''
    
    def test_sanitize_string_none(self):
        """Test sanitization with None value"""
        result = sanitize_string(None)
        assert result == ''


class TestValidateEmail:
    """Test validate_email function"""
    
    def test_validate_email_valid(self):
        """Test validation with valid email"""
        result = validate_email('test@example.com')
        assert result['valid'] is True
        assert result['value'] == 'test@example.com'
    
    def test_validate_email_invalid_format(self):
        """Test validation with invalid email format"""
        result = validate_email('invalid-email')
        assert result['valid'] is False
        assert 'Invalid email format' in result['error']
    
    def test_validate_email_empty_string(self):
        """Test validation with empty string"""
        result = validate_email('')
        assert result['valid'] is True  # Email is optional
        assert result['value'] == ''
    
    def test_validate_email_none(self):
        """Test validation with None value"""
        result = validate_email(None)
        assert result['valid'] is True  # Email is optional
        assert result['value'] is None


class TestValidatePhone:
    """Test validate_phone function"""
    
    def test_validate_phone_valid(self):
        """Test validation with valid phone number"""
        result = validate_phone('+1234567890')
        assert result['valid'] is True
        assert result['value'] == '+1234567890'
    
    def test_validate_phone_invalid_format(self):
        """Test validation with invalid phone format"""
        result = validate_phone('invalid-phone')
        assert result['valid'] is False
        assert 'Invalid phone format' in result['error']
    
    def test_validate_phone_empty_string(self):
        """Test validation with empty string"""
        result = validate_phone('')
        assert result['valid'] is True  # Phone is optional
        assert result['value'] == ''
    
    def test_validate_phone_none(self):
        """Test validation with None value"""
        result = validate_phone(None)
        assert result['valid'] is True  # Phone is optional
        assert result['value'] is None


class TestValidateClientName:
    """Test validate_client_name function"""
    
    def test_validate_client_name_valid(self):
        """Test validation with valid client name"""
        result = validate_client_name('Test Client')
        assert result['valid'] is True
        assert result['value'] == 'Test Client'
    
    def test_validate_client_name_empty_string(self):
        """Test validation with empty string"""
        result = validate_client_name('')
        assert result['valid'] is False
        assert 'Client name is required' in result['error']
    
    def test_validate_client_name_none(self):
        """Test validation with None value"""
        result = validate_client_name(None)
        assert result['valid'] is False
        assert 'Client name is required' in result['error']
    
    def test_validate_client_name_too_long(self):
        """Test validation with too long client name"""
        long_name = 'A' * 256  # Assuming max length is 255
        result = validate_client_name(long_name)
        assert result['valid'] is False
        assert 'Client name too long' in result['error']
    
    def test_validate_client_name_with_special_chars(self):
        """Test validation with special characters in client name"""
        result = validate_client_name('Test<>Client&"')
        assert result['valid'] is True
        assert result['value'] == 'TestClient'  # Special chars should be removed
