"""
Unit tests for currency_utils.py module
"""
import pytest
from decimal import Decimal
from unittest.mock import Mock

from app.utils.currency_utils import (
    get_try_amount, get_try_amounts, calculate_try_totals
)


class TestGetTryAmount:
    """Test get_try_amount function"""
    
    def test_get_try_amount_with_try_field(self):
        """Test getting TRY amount when TRY field exists and has value"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('4800.00')
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('4800.00')
    
    def test_get_try_amount_with_try_field_zero(self):
        """Test getting TRY amount when TRY field is zero (should fallback)"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('0')
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('100.00')
    
    def test_get_try_amount_with_try_field_none(self):
        """Test getting TRY amount when TRY field is None (should fallback)"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = None
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('100.00')
    
    def test_get_try_amount_without_try_field(self):
        """Test getting TRY amount when TRY field doesn't exist (should fallback)"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        # No amount_try attribute
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('100.00')
    
    def test_get_try_amount_commission_field(self):
        """Test getting TRY amount for commission field"""
        transaction = Mock()
        transaction.commission = Decimal('5.00')
        transaction.commission_try = Decimal('240.00')
        
        result = get_try_amount(transaction, 'commission')
        assert result == Decimal('240.00')
    
    def test_get_try_amount_net_amount_field(self):
        """Test getting TRY amount for net_amount field"""
        transaction = Mock()
        transaction.net_amount = Decimal('95.00')
        transaction.net_amount_try = Decimal('4560.00')
        
        result = get_try_amount(transaction, 'net_amount')
        assert result == Decimal('4560.00')
    
    def test_get_try_amount_original_amount_none(self):
        """Test getting TRY amount when original amount is None"""
        transaction = Mock()
        transaction.amount = None
        # No amount_try attribute
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('0')
    
    def test_get_try_amount_original_amount_zero(self):
        """Test getting TRY amount when original amount is 0"""
        transaction = Mock()
        transaction.amount = Decimal('0')
        # No amount_try attribute
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('0')
    
    def test_get_try_amount_negative_try_amount(self):
        """Test getting TRY amount when TRY field is negative (should fallback)"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('-100.00')
        
        result = get_try_amount(transaction, 'amount')
        assert result == Decimal('100.00')


class TestGetTryAmounts:
    """Test get_try_amounts function"""
    
    def test_get_try_amounts_all_fields(self):
        """Test getting all TRY amounts for a transaction"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('4800.00')
        transaction.commission = Decimal('5.00')
        transaction.commission_try = Decimal('240.00')
        transaction.net_amount = Decimal('95.00')
        transaction.net_amount_try = Decimal('4560.00')
        
        result = get_try_amounts(transaction)
        
        expected = {
            'amount': Decimal('4800.00'),
            'commission': Decimal('240.00'),
            'net_amount': Decimal('4560.00')
        }
        assert result == expected
    
    def test_get_try_amounts_fallback_to_original(self):
        """Test getting TRY amounts when TRY fields don't exist"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.commission = Decimal('5.00')
        transaction.net_amount = Decimal('95.00')
        # No TRY fields
        
        result = get_try_amounts(transaction)
        
        expected = {
            'amount': Decimal('100.00'),
            'commission': Decimal('5.00'),
            'net_amount': Decimal('95.00')
        }
        assert result == expected
    
    def test_get_try_amounts_mixed_fields(self):
        """Test getting TRY amounts with some TRY fields and some fallbacks"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('4800.00')
        transaction.commission = Decimal('5.00')
        # No commission_try
        transaction.net_amount = Decimal('95.00')
        transaction.net_amount_try = Decimal('4560.00')
        
        result = get_try_amounts(transaction)
        
        expected = {
            'amount': Decimal('4800.00'),
            'commission': Decimal('5.00'),  # Fallback
            'net_amount': Decimal('4560.00')
        }
        assert result == expected


class TestCalculateTryTotals:
    """Test calculate_try_totals function"""
    
    def test_calculate_try_totals_single_transaction(self):
        """Test calculating TRY totals for a single transaction"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('4800.00')
        transaction.commission = Decimal('5.00')
        transaction.commission_try = Decimal('240.00')
        transaction.net_amount = Decimal('95.00')
        transaction.net_amount_try = Decimal('4560.00')
        
        transactions = [transaction]
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('4800.00'),
            'commission': Decimal('240.00'),
            'net_amount': Decimal('4560.00')
        }
        assert result == expected
    
    def test_calculate_try_totals_multiple_transactions(self):
        """Test calculating TRY totals for multiple transactions"""
        transaction1 = Mock()
        transaction1.amount = Decimal('100.00')
        transaction1.amount_try = Decimal('4800.00')
        transaction1.commission = Decimal('5.00')
        transaction1.commission_try = Decimal('240.00')
        transaction1.net_amount = Decimal('95.00')
        transaction1.net_amount_try = Decimal('4560.00')
        
        transaction2 = Mock()
        transaction2.amount = Decimal('200.00')
        transaction2.amount_try = Decimal('9600.00')
        transaction2.commission = Decimal('10.00')
        transaction2.commission_try = Decimal('480.00')
        transaction2.net_amount = Decimal('190.00')
        transaction2.net_amount_try = Decimal('9120.00')
        
        transactions = [transaction1, transaction2]
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('14400.00'),  # 4800 + 9600
            'commission': Decimal('720.00'),  # 240 + 480
            'net_amount': Decimal('13680.00')  # 4560 + 9120
        }
        assert result == expected
    
    def test_calculate_try_totals_custom_fields(self):
        """Test calculating TRY totals with custom fields"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.amount_try = Decimal('4800.00')
        transaction.commission = Decimal('5.00')
        transaction.commission_try = Decimal('240.00')
        
        transactions = [transaction]
        result = calculate_try_totals(transactions, fields=['amount', 'commission'])
        
        expected = {
            'amount': Decimal('4800.00'),
            'commission': Decimal('240.00')
        }
        assert result == expected
    
    def test_calculate_try_totals_empty_list(self):
        """Test calculating TRY totals for empty transaction list"""
        transactions = []
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('0'),
            'commission': Decimal('0'),
            'net_amount': Decimal('0')
        }
        assert result == expected
    
    def test_calculate_try_totals_fallback_to_original(self):
        """Test calculating TRY totals when TRY fields don't exist"""
        transaction = Mock()
        transaction.amount = Decimal('100.00')
        transaction.commission = Decimal('5.00')
        transaction.net_amount = Decimal('95.00')
        # No TRY fields
        
        transactions = [transaction]
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('100.00'),
            'commission': Decimal('5.00'),
            'net_amount': Decimal('95.00')
        }
        assert result == expected
    
    def test_calculate_try_totals_mixed_scenarios(self):
        """Test calculating TRY totals with mixed scenarios (some with TRY, some without)"""
        transaction1 = Mock()
        transaction1.amount = Decimal('100.00')
        transaction1.amount_try = Decimal('4800.00')
        transaction1.commission = Decimal('5.00')
        transaction1.commission_try = Decimal('240.00')
        transaction1.net_amount = Decimal('95.00')
        transaction1.net_amount_try = Decimal('4560.00')
        
        transaction2 = Mock()
        transaction2.amount = Decimal('200.00')
        transaction2.commission = Decimal('10.00')
        transaction2.net_amount = Decimal('190.00')
        # No TRY fields for transaction2
        
        transactions = [transaction1, transaction2]
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('5000.00'),  # 4800 + 200
            'commission': Decimal('250.00'),  # 240 + 10
            'net_amount': Decimal('4750.00')  # 4560 + 190
        }
        assert result == expected
    
    def test_calculate_try_totals_zero_values(self):
        """Test calculating TRY totals with zero values"""
        transaction = Mock()
        transaction.amount = Decimal('0')
        transaction.amount_try = Decimal('0')
        transaction.commission = Decimal('0')
        transaction.commission_try = Decimal('0')
        transaction.net_amount = Decimal('0')
        transaction.net_amount_try = Decimal('0')
        
        transactions = [transaction]
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('0'),
            'commission': Decimal('0'),
            'net_amount': Decimal('0')
        }
        assert result == expected
    
    def test_calculate_try_totals_negative_values(self):
        """Test calculating TRY totals with negative values"""
        transaction = Mock()
        transaction.amount = Decimal('-100.00')
        transaction.amount_try = Decimal('-4800.00')
        transaction.commission = Decimal('0')
        transaction.commission_try = Decimal('0')
        transaction.net_amount = Decimal('-100.00')
        transaction.net_amount_try = Decimal('-4800.00')
        
        transactions = [transaction]
        result = calculate_try_totals(transactions)
        
        expected = {
            'amount': Decimal('-4800.00'),
            'commission': Decimal('0'),
            'net_amount': Decimal('-4800.00')
        }
        assert result == expected
