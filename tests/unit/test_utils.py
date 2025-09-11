"""
Unit tests for utility functions
"""
import pytest
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import Mock, patch

from app.utils.template_helpers import (
    format_currency, format_date, format_number,
    get_status_class, truncate_string, safe_divide
)


class TestFormatCurrency:
    """Test format_currency function"""
    
    def test_format_currency_tl(self):
        """Test formatting Turkish Lira"""
        result = format_currency(Decimal('1234.56'), 'TL')
        assert result == '1.234,56 TL'
    
    def test_format_currency_usd(self):
        """Test formatting US Dollar"""
        result = format_currency(Decimal('1234.56'), 'USD')
        assert result == '$1,234.56'
    
    def test_format_currency_eur(self):
        """Test formatting Euro"""
        result = format_currency(Decimal('1234.56'), 'EUR')
        assert result == '€1,234.56'
    
    def test_format_currency_zero(self):
        """Test formatting zero amount"""
        result = format_currency(Decimal('0'), 'TL')
        assert result == '0,00 TL'
    
    def test_format_currency_negative(self):
        """Test formatting negative amount"""
        result = format_currency(Decimal('-1234.56'), 'TL')
        assert result == '-1.234,56 TL'
    
    def test_format_currency_invalid_currency(self):
        """Test formatting with invalid currency"""
        result = format_currency(Decimal('1234.56'), 'INVALID')
        assert result == '1.234,56 INVALID'


class TestFormatDate:
    """Test format_date function"""
    
    def test_format_date_default_format(self):
        """Test formatting date with default format"""
        test_date = date(2025, 1, 15)
        result = format_date(test_date)
        assert result == '15.01.2025'
    
    def test_format_date_custom_format(self):
        """Test formatting date with custom format"""
        test_date = date(2025, 1, 15)
        result = format_date(test_date, '%Y-%m-%d')
        assert result == '2025-01-15'
    
    def test_format_date_datetime(self):
        """Test formatting datetime object"""
        test_datetime = datetime(2025, 1, 15, 14, 30, 0)
        result = format_date(test_datetime)
        assert result == '15.01.2025'
    
    def test_format_date_none(self):
        """Test formatting None date"""
        result = format_date(None)
        assert result == ''
    
    def test_format_date_string(self):
        """Test formatting date string"""
        result = format_date('2025-01-15')
        assert result == '15.01.2025'


class TestFormatNumber:
    """Test format_number function"""
    
    def test_format_number_integer(self):
        """Test formatting integer"""
        result = format_number(1234)
        assert result == '1.234'
    
    def test_format_number_decimal(self):
        """Test formatting decimal number"""
        result = format_number(1234.56)
        assert result == '1.234,56'
    
    def test_format_number_zero(self):
        """Test formatting zero"""
        result = format_number(0)
        assert result == '0'
    
    def test_format_number_negative(self):
        """Test formatting negative number"""
        result = format_number(-1234.56)
        assert result == '-1.234,56'
    
    def test_format_number_large(self):
        """Test formatting large number"""
        result = format_number(1234567.89)
        assert result == '1.234.567,89'
    
    def test_format_number_none(self):
        """Test formatting None"""
        result = format_number(None)
        assert result == ''


class TestGetStatusClass:
    """Test get_status_class function"""
    
    def test_get_status_class_success(self):
        """Test getting status class for success"""
        result = get_status_class('success')
        assert result == 'text-success'
    
    def test_get_status_class_error(self):
        """Test getting status class for error"""
        result = get_status_class('error')
        assert result == 'text-danger'
    
    def test_get_status_class_warning(self):
        """Test getting status class for warning"""
        result = get_status_class('warning')
        assert result == 'text-warning'
    
    def test_get_status_class_info(self):
        """Test getting status class for info"""
        result = get_status_class('info')
        assert result == 'text-info'
    
    def test_get_status_class_unknown(self):
        """Test getting status class for unknown status"""
        result = get_status_class('unknown')
        assert result == 'text-muted'
    
    def test_get_status_class_none(self):
        """Test getting status class for None"""
        result = get_status_class(None)
        assert result == 'text-muted'


class TestTruncateString:
    """Test truncate_string function"""
    
    def test_truncate_string_short(self):
        """Test truncating short string"""
        result = truncate_string('Short string', 20)
        assert result == 'Short string'
    
    def test_truncate_string_long(self):
        """Test truncating long string"""
        result = truncate_string('This is a very long string that should be truncated', 20)
        assert result == 'This is a very lo...'
    
    def test_truncate_string_exact_length(self):
        """Test truncating string of exact length"""
        result = truncate_string('Exactly twenty chars', 20)
        assert result == 'Exactly twenty chars'
    
    def test_truncate_string_custom_suffix(self):
        """Test truncating with custom suffix"""
        result = truncate_string('This is a very long string', 20, '...')
        assert result == 'This is a very lo...'
    
    def test_truncate_string_empty(self):
        """Test truncating empty string"""
        result = truncate_string('', 20)
        assert result == ''
    
    def test_truncate_string_none(self):
        """Test truncating None"""
        result = truncate_string(None, 20)
        assert result == ''


class TestSafeDivide:
    """Test safe_divide function"""
    
    def test_safe_divide_normal(self):
        """Test normal division"""
        result = safe_divide(10, 2)
        assert result == 5.0
    
    def test_safe_divide_decimal(self):
        """Test division with decimals"""
        result = safe_divide(10.5, 2.5)
        assert result == 4.2
    
    def test_safe_divide_by_zero(self):
        """Test division by zero"""
        result = safe_divide(10, 0)
        assert result == 0.0
    
    def test_safe_divide_zero_numerator(self):
        """Test division of zero"""
        result = safe_divide(0, 5)
        assert result == 0.0
    
    def test_safe_divide_negative(self):
        """Test division with negative numbers"""
        result = safe_divide(-10, 2)
        assert result == -5.0
    
    def test_safe_divide_float_result(self):
        """Test division resulting in float"""
        result = safe_divide(10, 3)
        assert abs(result - 3.3333333333333335) < 0.0001
    
    def test_safe_divide_none_numerator(self):
        """Test division with None numerator"""
        result = safe_divide(None, 5)
        assert result == 0.0
    
    def test_safe_divide_none_denominator(self):
        """Test division with None denominator"""
        result = safe_divide(10, None)
        assert result == 0.0
    
    def test_safe_divide_both_none(self):
        """Test division with both None"""
        result = safe_divide(None, None)
        assert result == 0.0
