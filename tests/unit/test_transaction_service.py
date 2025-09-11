"""
Unit tests for transaction_service.py module
"""
import pytest
from decimal import Decimal
from datetime import date, datetime
from unittest.mock import Mock, patch, MagicMock

from app.services.transaction_service import TransactionService, safe_float


class TestSafeFloat:
    """Test safe_float function"""
    
    def test_safe_float_valid_value(self):
        """Test safe_float with valid numeric value"""
        result = safe_float("123.45")
        assert result == 123.45
    
    def test_safe_float_integer_value(self):
        """Test safe_float with integer value"""
        result = safe_float("100")
        assert result == 100.0
    
    def test_safe_float_none_value(self):
        """Test safe_float with None value"""
        result = safe_float(None)
        assert result == 0.0
    
    def test_safe_float_none_with_custom_default(self):
        """Test safe_float with None value and custom default"""
        result = safe_float(None, default=5.0)
        assert result == 5.0
    
    def test_safe_float_invalid_value(self):
        """Test safe_float with invalid value"""
        result = safe_float("invalid")
        assert result == 0.0
    
    def test_safe_float_invalid_value_with_custom_default(self):
        """Test safe_float with invalid value and custom default"""
        result = safe_float("invalid", default=10.0)
        assert result == 10.0
    
    def test_safe_float_type_error(self):
        """Test safe_float with TypeError"""
        result = safe_float({})
        assert result == 0.0


class TestTransactionService:
    """Test TransactionService class"""
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.exchange_rate_service')
    @patch('app.services.transaction_service.PspOptionsService')
    def test_create_transaction_tl_currency(self, mock_psp_service, mock_exchange_service, mock_db):
        """Test creating a TL transaction"""
        # Setup mocks
        mock_psp_service.get_psp_commission_rate.return_value = Decimal('0.025')
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Test data
        data = {
            'client_name': 'Test Client',
            'amount': Decimal('1000.00'),
            'date': date(2025, 1, 1),
            'currency': 'TL',
            'psp': 'Test PSP',
            'category': 'DEP',
            'payment_method': 'Credit Card',
            'notes': 'Test transaction'
        }
        user_id = 1
        
        # Mock Transaction class
        with patch('app.services.transaction_service.Transaction') as mock_transaction_class:
            mock_transaction = Mock()
            mock_transaction_class.return_value = mock_transaction
            mock_transaction.calculate_try_amounts = Mock()
            
            # Call the method
            result = TransactionService.create_transaction(data, user_id)
            
            # Assertions
            assert result == mock_transaction
            mock_transaction_class.assert_called_once()
            mock_transaction.calculate_try_amounts.assert_called_once_with(Decimal('1.0'))
            mock_db.session.add.assert_called_once_with(mock_transaction)
            mock_db.session.commit.assert_called_once()
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.exchange_rate_service')
    @patch('app.services.transaction_service.PspOptionsService')
    def test_create_transaction_usd_currency(self, mock_psp_service, mock_exchange_service, mock_db):
        """Test creating a USD transaction"""
        # Setup mocks
        mock_psp_service.get_psp_commission_rate.return_value = Decimal('0.025')
        mock_exchange_service.get_or_fetch_rate.return_value = Decimal('48.50')
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Test data
        data = {
            'client_name': 'Test Client',
            'amount': Decimal('100.00'),
            'date': date(2025, 1, 1),
            'currency': 'USD',
            'psp': 'Test PSP',
            'category': 'DEP',
            'payment_method': 'Credit Card',
            'notes': 'Test transaction'
        }
        user_id = 1
        
        # Mock Transaction class
        with patch('app.services.transaction_service.Transaction') as mock_transaction_class:
            mock_transaction = Mock()
            mock_transaction_class.return_value = mock_transaction
            mock_transaction.calculate_try_amounts = Mock()
            
            # Call the method
            result = TransactionService.create_transaction(data, user_id)
            
            # Assertions
            assert result == mock_transaction
            mock_exchange_service.get_or_fetch_rate.assert_called_once_with('USD', date(2025, 1, 1))
            mock_transaction.calculate_try_amounts.assert_called_once_with(Decimal('48.50'))
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.exchange_rate_service')
    @patch('app.services.transaction_service.PspOptionsService')
    def test_create_transaction_commission_calculation(self, mock_psp_service, mock_exchange_service, mock_db):
        """Test commission calculation during transaction creation"""
        # Setup mocks
        mock_psp_service.get_psp_commission_rate.return_value = Decimal('0.03')
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Test data
        data = {
            'client_name': 'Test Client',
            'amount': Decimal('1000.00'),
            'date': date(2025, 1, 1),
            'currency': 'TL',
            'psp': 'Test PSP',
            'category': 'DEP',
            'payment_method': 'Credit Card',
            'notes': 'Test transaction'
        }
        user_id = 1
        
        # Mock Transaction class
        with patch('app.services.transaction_service.Transaction') as mock_transaction_class:
            mock_transaction = Mock()
            mock_transaction_class.return_value = mock_transaction
            mock_transaction.calculate_try_amounts = Mock()
            
            # Call the method
            TransactionService.create_transaction(data, user_id)
            
            # Check that commission was calculated
            mock_psp_service.get_psp_commission_rate.assert_called_once_with('Test PSP')
            # Commission should be 1000 * 0.03 = 30
            assert data['commission'] == Decimal('30.00')
            assert data['net_amount'] == Decimal('970.00')
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.PspOptionsService')
    def test_create_transaction_wd_category_zero_commission(self, mock_psp_service, mock_db):
        """Test that WD category transactions have zero commission"""
        # Setup mocks
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Test data with WD category
        data = {
            'client_name': 'Test Client',
            'amount': Decimal('1000.00'),
            'date': date(2025, 1, 1),
            'currency': 'TL',
            'psp': 'Test PSP',
            'category': 'WD',
            'payment_method': 'Bank Transfer',
            'notes': 'Withdrawal'
        }
        user_id = 1
        
        # Mock Transaction class
        with patch('app.services.transaction_service.Transaction') as mock_transaction_class:
            mock_transaction = Mock()
            mock_transaction_class.return_value = mock_transaction
            mock_transaction.calculate_try_amounts = Mock()
            
            # Call the method
            TransactionService.create_transaction(data, user_id)
            
            # Check that commission is zero for WD transactions
            assert data['commission'] == Decimal('0')
            assert data['net_amount'] == Decimal('1000.00')
            # PSP service should not be called for WD transactions
            mock_psp_service.get_psp_commission_rate.assert_not_called()
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.exchange_rate_service')
    @patch('app.services.transaction_service.PspOptionsService')
    def test_create_transaction_exchange_rate_failure(self, mock_psp_service, mock_exchange_service, mock_db):
        """Test transaction creation when exchange rate fetch fails"""
        # Setup mocks
        mock_psp_service.get_psp_commission_rate.return_value = Decimal('0.025')
        mock_exchange_service.get_or_fetch_rate.return_value = None
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Test data
        data = {
            'client_name': 'Test Client',
            'amount': Decimal('100.00'),
            'date': date(2025, 1, 1),
            'currency': 'USD',
            'psp': 'Test PSP',
            'category': 'DEP',
            'payment_method': 'Credit Card',
            'notes': 'Test transaction'
        }
        user_id = 1
        
        # Mock Transaction class
        with patch('app.services.transaction_service.Transaction') as mock_transaction_class:
            mock_transaction = Mock()
            mock_transaction_class.return_value = mock_transaction
            mock_transaction.calculate_try_amounts = Mock()
            
            # Call the method
            result = TransactionService.create_transaction(data, user_id)
            
            # Assertions
            assert result == mock_transaction
            # TRY amounts should be set to None when exchange rate fails
            assert mock_transaction.amount_try is None
            assert mock_transaction.commission_try is None
            assert mock_transaction.net_amount_try is None
            assert mock_transaction.exchange_rate is None
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.PspOptionsService')
    def test_calculate_commission_dep_category(self, mock_psp_service, mock_db):
        """Test commission calculation for DEP category"""
        # Setup mocks
        mock_psp_service.get_psp_commission_rate.return_value = Decimal('0.03')
        
        # Test commission calculation
        amount = Decimal('1000.00')
        psp = 'Test PSP'
        category = 'DEP'
        
        result = TransactionService.calculate_commission(amount, psp, category)
        
        # Commission should be 1000 * 0.03 = 30
        assert result == Decimal('30.00')
        mock_psp_service.get_psp_commission_rate.assert_called_once_with(psp)
    
    def test_calculate_commission_wd_category(self):
        """Test commission calculation for WD category (should be zero)"""
        # Test commission calculation for WD category
        amount = Decimal('1000.00')
        psp = 'Test PSP'
        category = 'WD'
        
        result = TransactionService.calculate_commission(amount, psp, category)
        
        # Commission should be zero for WD transactions
        assert result == Decimal('0')
    
    @patch('app.services.transaction_service.PspOptionsService')
    def test_calculate_commission_psp_service_error(self, mock_psp_service):
        """Test commission calculation when PSP service fails"""
        # Setup mocks
        mock_psp_service.get_psp_commission_rate.side_effect = Exception("PSP service error")
        
        # Test commission calculation
        amount = Decimal('1000.00')
        psp = 'Test PSP'
        category = 'DEP'
        
        result = TransactionService.calculate_commission(amount, psp, category)
        
        # Should fallback to default rate of 2.5%
        assert result == Decimal('25.00')  # 1000 * 0.025
    
    def test_calculate_commission_no_psp(self):
        """Test commission calculation without PSP"""
        # Test commission calculation without PSP
        amount = Decimal('1000.00')
        psp = None
        category = 'DEP'
        
        result = TransactionService.calculate_commission(amount, psp, category)
        
        # Should use default rate of 2.5%
        assert result == Decimal('25.00')  # 1000 * 0.025
    
    @patch('app.services.transaction_service.exchange_rate_service')
    def test_get_exchange_rate(self, mock_exchange_service):
        """Test getting exchange rate"""
        # Setup mocks
        mock_exchange_service.get_or_fetch_rate.return_value = Decimal('48.50')
        
        # Test getting exchange rate
        date_obj = date(2025, 1, 1)
        currency = 'USD'
        
        result = TransactionService.get_exchange_rate(date_obj, currency)
        
        assert result == Decimal('48.50')
        mock_exchange_service.get_or_fetch_rate.assert_called_once_with(currency, date_obj)
    
    @patch('app.services.transaction_service.exchange_rate_service')
    def test_get_exchange_rate_error(self, mock_exchange_service):
        """Test getting exchange rate when service fails"""
        # Setup mocks
        mock_exchange_service.get_or_fetch_rate.side_effect = Exception("Rate service error")
        
        # Test getting exchange rate
        date_obj = date(2025, 1, 1)
        currency = 'USD'
        
        result = TransactionService.get_exchange_rate(date_obj, currency)
        
        assert result is None
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.Transaction')
    @patch('app.services.transaction_service.DailyBalance')
    def test_update_daily_balance_existing_balance(self, mock_daily_balance, mock_transaction, mock_db):
        """Test updating existing daily balance"""
        # Setup mocks
        mock_transaction.query.filter_by.return_value.all.return_value = [
            Mock(amount=Decimal('1000.00'), category='DEP'),
            Mock(amount=Decimal('200.00'), category='WD'),
            Mock(commission=Decimal('25.00'))
        ]
        
        mock_existing_balance = Mock()
        mock_daily_balance.query.filter_by.return_value.first.return_value = mock_existing_balance
        
        mock_db.session.commit = Mock()
        
        # Test updating daily balance
        date_obj = date(2025, 1, 1)
        psp = 'Test PSP'
        
        TransactionService.update_daily_balance(date_obj, psp)
        
        # Check that existing balance was updated
        assert mock_existing_balance.total_inflow == Decimal('1000.00')
        assert mock_existing_balance.total_outflow == Decimal('200.00')
        assert mock_existing_balance.total_commission == Decimal('25.00')
        assert mock_existing_balance.net_amount == Decimal('775.00')  # 1000 - 200 - 25
        mock_db.session.commit.assert_called_once()
    
    @patch('app.services.transaction_service.db')
    @patch('app.services.transaction_service.Transaction')
    @patch('app.services.transaction_service.DailyBalance')
    def test_update_daily_balance_new_balance(self, mock_daily_balance, mock_transaction, mock_db):
        """Test creating new daily balance"""
        # Setup mocks
        mock_transaction.query.filter_by.return_value.all.return_value = [
            Mock(amount=Decimal('1000.00'), category='DEP'),
            Mock(amount=Decimal('200.00'), category='WD'),
            Mock(commission=Decimal('25.00'))
        ]
        
        mock_daily_balance.query.filter_by.return_value.first.return_value = None
        mock_new_balance = Mock()
        mock_daily_balance.return_value = mock_new_balance
        
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Test updating daily balance
        date_obj = date(2025, 1, 1)
        psp = 'Test PSP'
        
        TransactionService.update_daily_balance(date_obj, psp)
        
        # Check that new balance was created
        mock_daily_balance.assert_called_once_with(
            date=date_obj,
            psp=psp,
            total_inflow=Decimal('1000.00'),
            total_outflow=Decimal('200.00'),
            total_commission=Decimal('25.00'),
            net_amount=Decimal('775.00')
        )
        mock_db.session.add.assert_called_once_with(mock_new_balance)
        mock_db.session.commit.assert_called_once()
    
    @patch('app.services.transaction_service.db')
    def test_update_daily_balance_error(self, mock_db):
        """Test daily balance update error handling"""
        # Setup mocks
        mock_db.session.commit.side_effect = Exception("Database error")
        mock_db.session.rollback = Mock()
        
        # Test updating daily balance
        date_obj = date(2025, 1, 1)
        psp = 'Test PSP'
        
        # Should not raise exception
        TransactionService.update_daily_balance(date_obj, psp)
        
        mock_db.session.rollback.assert_called_once()
    
    @patch('app.services.transaction_service.pd')
    @patch('app.services.transaction_service.TransactionService.create_transaction')
    def test_import_transactions_excel(self, mock_create_transaction, mock_pd):
        """Test importing transactions from Excel file"""
        # Setup mocks
        mock_df = Mock()
        mock_df.iterrows.return_value = [
            (0, {'client_name': 'Client 1', 'amount': 1000, 'date': '2025-01-01', 'currency': 'TL', 'psp': 'PSP1', 'category': 'DEP', 'payment_method': 'Card', 'notes': 'Note 1'}),
            (1, {'client_name': 'Client 2', 'amount': 2000, 'date': '2025-01-02', 'currency': 'TL', 'psp': 'PSP2', 'category': 'DEP', 'payment_method': 'Card', 'notes': 'Note 2'})
        ]
        mock_pd.read_excel.return_value = mock_df
        
        mock_create_transaction.return_value = Mock()
        
        # Test importing transactions
        file_data = "test.xlsx"
        user_id = 1
        
        result = TransactionService.import_transactions(file_data, user_id)
        
        # Check results
        assert result['imported_count'] == 2
        assert result['errors'] == []
        assert mock_create_transaction.call_count == 2
    
    @patch('app.services.transaction_service.pd')
    @patch('app.services.transaction_service.TransactionService.create_transaction')
    def test_import_transactions_csv(self, mock_create_transaction, mock_pd):
        """Test importing transactions from CSV file"""
        # Setup mocks
        mock_df = Mock()
        mock_df.iterrows.return_value = [
            (0, {'client_name': 'Client 1', 'amount': 1000, 'date': '2025-01-01', 'currency': 'TL', 'psp': 'PSP1', 'category': 'DEP', 'payment_method': 'Card', 'notes': 'Note 1'})
        ]
        mock_pd.read_csv.return_value = mock_df
        
        mock_create_transaction.return_value = Mock()
        
        # Test importing transactions
        file_data = "test.csv"
        user_id = 1
        
        result = TransactionService.import_transactions(file_data, user_id)
        
        # Check results
        assert result['imported_count'] == 1
        assert result['errors'] == []
        mock_pd.read_csv.assert_called_once_with(file_data)
    
    @patch('app.services.transaction_service.pd')
    @patch('app.services.transaction_service.TransactionService.create_transaction')
    def test_import_transactions_with_errors(self, mock_create_transaction, mock_pd):
        """Test importing transactions with some errors"""
        # Setup mocks
        mock_df = Mock()
        mock_df.iterrows.return_value = [
            (0, {'client_name': 'Client 1', 'amount': 1000, 'date': '2025-01-01', 'currency': 'TL', 'psp': 'PSP1', 'category': 'DEP', 'payment_method': 'Card', 'notes': 'Note 1'}),
            (1, {'client_name': 'Client 2', 'amount': 'invalid', 'date': '2025-01-02', 'currency': 'TL', 'psp': 'PSP2', 'category': 'DEP', 'payment_method': 'Card', 'notes': 'Note 2'})
        ]
        mock_pd.read_excel.return_value = mock_df
        
        mock_create_transaction.side_effect = [Mock(), Exception("Invalid amount")]
        
        # Test importing transactions
        file_data = "test.xlsx"
        user_id = 1
        
        result = TransactionService.import_transactions(file_data, user_id)
        
        # Check results
        assert result['imported_count'] == 1
        assert len(result['errors']) == 1
        assert "Row 2: Invalid amount" in result['errors'][0]
    
    @patch('app.services.transaction_service.Transaction')
    def test_export_transactions_no_filters(self, mock_transaction):
        """Test exporting transactions without filters"""
        # Setup mocks
        mock_transaction1 = Mock()
        mock_transaction1.to_dict.return_value = {'id': 1, 'amount': 1000}
        mock_transaction2 = Mock()
        mock_transaction2.to_dict.return_value = {'id': 2, 'amount': 2000}
        
        mock_query = Mock()
        mock_query.all.return_value = [mock_transaction1, mock_transaction2]
        mock_transaction.query = mock_query
        
        # Test exporting transactions
        result = TransactionService.export_transactions()
        
        # Check results
        assert len(result) == 2
        assert result[0] == {'id': 1, 'amount': 1000}
        assert result[1] == {'id': 2, 'amount': 2000}
    
    @patch('app.services.transaction_service.Transaction')
    def test_export_transactions_with_filters(self, mock_transaction):
        """Test exporting transactions with filters"""
        # Setup mocks
        mock_transaction1 = Mock()
        mock_transaction1.to_dict.return_value = {'id': 1, 'amount': 1000}
        
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [mock_transaction1]
        mock_transaction.query = mock_query
        
        # Test exporting transactions with filters
        filters = {
            'start_date': date(2025, 1, 1),
            'end_date': date(2025, 1, 31),
            'psp': 'Test PSP',
            'category': 'DEP'
        }
        
        result = TransactionService.export_transactions(filters)
        
        # Check results
        assert len(result) == 1
        assert result[0] == {'id': 1, 'amount': 1000}
        # Check that filters were applied
        assert mock_query.filter.call_count == 4  # One for each filter
