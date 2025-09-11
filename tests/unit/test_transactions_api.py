"""
Unit tests for transactions API endpoints
"""
import pytest
from decimal import Decimal
from datetime import date, datetime
from unittest.mock import Mock, patch, MagicMock
from flask import json

from app.api.v1.endpoints.transactions import transactions_api


class TestCreateTransaction:
    """Test create_transaction endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_create_transaction_success(self, mock_transaction_class, mock_db, mock_request, mock_current_user):
        """Test successful transaction creation"""
        # Setup mocks
        mock_current_user.is_authenticated = True
        mock_current_user.username = 'testuser'
        mock_current_user.id = 1
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'client_name': 'Test Client',
            'amount': '1000.00',
            'currency': 'TL',
            'psp': 'Test PSP',
            'category': 'DEP',
            'payment_method': 'Credit Card',
            'notes': 'Test transaction',
            'date': '2025-01-01'
        }
        
        mock_transaction = Mock()
        mock_transaction.id = 1
        mock_transaction.client_name = 'Test Client'
        mock_transaction.amount = Decimal('1000.00')
        mock_transaction.commission = Decimal('25.00')
        mock_transaction.net_amount = Decimal('975.00')
        mock_transaction.currency = 'TL'
        mock_transaction.date = date(2025, 1, 1)
        mock_transaction_class.return_value = mock_transaction
        
        mock_db.session.add = Mock()
        mock_db.session.flush = Mock()
        mock_db.session.commit = Mock()
        mock_db.session.execute = Mock()
        
        # Mock PSP service
        with patch('app.api.v1.endpoints.transactions.PspOptionsService') as mock_psp_service:
            mock_psp_service.get_psp_commission_rate.return_value = Decimal('0.025')
            
            # Call the endpoint
            response = transactions_api.create_transaction()
            
            # Assertions
            assert response[1] == 201  # Status code
            response_data = response[0].get_json()
            assert response_data['success'] is True
            assert response_data['message'] == 'Transaction created successfully'
            assert response_data['transaction']['client_name'] == 'Test Client'
            assert response_data['transaction']['amount'] == 1000.0
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_create_transaction_not_authenticated(self, mock_current_user):
        """Test transaction creation when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.create_transaction()
        
        assert response[1] == 401
        response_data = response[0].get_json()
        assert response_data['error'] == 'Authentication required'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_create_transaction_invalid_content_type(self, mock_request, mock_current_user):
        """Test transaction creation with invalid content type"""
        mock_current_user.is_authenticated = True
        mock_request.is_json = False
        
        response = transactions_api.create_transaction()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert response_data['error'] == 'Invalid content type'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_create_transaction_missing_client_name(self, mock_request, mock_current_user):
        """Test transaction creation with missing client name"""
        mock_current_user.is_authenticated = True
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'amount': '1000.00',
            'currency': 'TL'
        }
        
        response = transactions_api.create_transaction()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert response_data['error'] == 'Client name is required'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_create_transaction_invalid_amount(self, mock_request, mock_current_user):
        """Test transaction creation with invalid amount"""
        mock_current_user.is_authenticated = True
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'client_name': 'Test Client',
            'amount': 'invalid',
            'currency': 'TL'
        }
        
        response = transactions_api.create_transaction()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert response_data['error'] == 'Invalid amount format'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_create_transaction_negative_amount(self, mock_request, mock_current_user):
        """Test transaction creation with negative amount"""
        mock_current_user.is_authenticated = True
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'client_name': 'Test Client',
            'amount': '-100.00',
            'currency': 'TL'
        }
        
        response = transactions_api.create_transaction()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert response_data['error'] == 'Amount must be positive'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_create_transaction_invalid_date_format(self, mock_request, mock_current_user):
        """Test transaction creation with invalid date format"""
        mock_current_user.is_authenticated = True
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'client_name': 'Test Client',
            'amount': '1000.00',
            'currency': 'TL',
            'date': '01/01/2025'  # Wrong format
        }
        
        response = transactions_api.create_transaction()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert response_data['error'] == 'Invalid transaction date format. Use YYYY-MM-DD'


class TestGetClients:
    """Test get_clients endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_get_clients_success(self, mock_transaction, mock_db, mock_current_user):
        """Test successful clients retrieval"""
        mock_current_user.is_authenticated = True
        
        # Mock database query results
        mock_client_stats = [
            Mock(
                client_name='Client 1',
                transaction_count=5,
                total_amount=Decimal('5000.00'),
                total_commission=Decimal('125.00'),
                total_net=Decimal('4875.00'),
                average_amount=Decimal('1000.00'),
                first_transaction=datetime(2025, 1, 1),
                last_transaction=datetime(2025, 1, 5)
            )
        ]
        
        mock_query = Mock()
        mock_query.filter.return_value.group_by.return_value.all.return_value = mock_client_stats
        mock_db.session.query.return_value = mock_query
        
        # Mock individual client transactions query
        mock_client_transactions = [
            Mock(currency='TL', psp='PSP1'),
            Mock(currency='USD', psp='PSP2')
        ]
        mock_transaction.query.filter.return_value.all.return_value = mock_client_transactions
        mock_transaction.query.filter.return_value.order_by.return_value.first.return_value = Mock(
            payment_method='Credit Card',
            category='DEP'
        )
        
        response = transactions_api.get_clients()
        
        assert response[1] == 200
        response_data = response[0].get_json()
        assert len(response_data) == 1
        assert response_data[0]['client_name'] == 'Client 1'
        assert response_data[0]['total_amount'] == 5000.0
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_get_clients_not_authenticated(self, mock_current_user):
        """Test clients retrieval when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.get_clients()
        
        assert response[1] == 401


class TestGetTransactions:
    """Test get_transactions endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_get_transactions_success(self, mock_transaction, mock_db, mock_request, mock_current_user):
        """Test successful transactions retrieval"""
        mock_current_user.is_authenticated = True
        
        # Mock request args
        mock_request.args.get.side_effect = lambda key, default: {
            'page': 1,
            'per_page': 25,
            'category': None,
            'client': None,
            'payment_method': None,
            'psp': None,
            'currency': None
        }.get(key, default)
        
        # Mock database query
        mock_query = Mock()
        mock_query.count.return_value = 10
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.paginate.return_value = Mock(
            items=[
                Mock(
                    id=1,
                    client_name='Test Client',
                    amount=Decimal('1000.00'),
                    commission=Decimal('25.00'),
                    net_amount=Decimal('975.00'),
                    currency='TL',
                    psp='Test PSP',
                    category='DEP',
                    payment_method='Credit Card',
                    date=date(2025, 1, 1),
                    created_at=datetime(2025, 1, 1),
                    notes='Test transaction',
                    exchange_rate=None,
                    amount_try=None,
                    commission_try=None,
                    net_amount_try=None
                )
            ],
            total=10,
            pages=1
        )
        mock_transaction.query = mock_query
        
        mock_db.session.execute = Mock()
        mock_db.session.commit = Mock()
        
        response = transactions_api.get_transactions()
        
        assert response[1] == 200
        response_data = response[0].get_json()
        assert 'transactions' in response_data
        assert 'pagination' in response_data
        assert len(response_data['transactions']) == 1
        assert response_data['transactions'][0]['client_name'] == 'Test Client'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_get_transactions_not_authenticated(self, mock_current_user):
        """Test transactions retrieval when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.get_transactions()
        
        assert response[1] == 401


class TestGetDropdownOptions:
    """Test get_dropdown_options endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.PspOptionsService')
    @patch('app.api.v1.endpoints.transactions.CompanyOptionsService')
    def test_get_dropdown_options_success(self, mock_company_service, mock_psp_service, mock_current_user):
        """Test successful dropdown options retrieval"""
        mock_current_user.is_authenticated = True
        
        # Mock PSP options
        mock_psp_service.create_fixed_psp_options.return_value = [
            {'value': 'PSP1', 'commission_rate': 0.025},
            {'value': 'PSP2', 'commission_rate': 0.03}
        ]
        
        # Mock Company options
        mock_company_service.create_fixed_company_options.return_value = [
            {'value': 'Company1'},
            {'value': 'Company2'}
        ]
        
        response = transactions_api.get_dropdown_options()
        
        assert response[1] == 200
        response_data = response[0].get_json()
        assert 'payment_method' in response_data
        assert 'currency' in response_data
        assert 'category' in response_data
        assert 'psp' in response_data
        assert 'company' in response_data
        assert len(response_data['psp']) == 2
        assert len(response_data['company']) == 2
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_get_dropdown_options_not_authenticated(self, mock_current_user):
        """Test dropdown options retrieval when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.get_dropdown_options()
        
        assert response[1] == 401


class TestAddDropdownOption:
    """Test add_dropdown_option endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Option')
    def test_add_dropdown_option_success(self, mock_option_class, mock_db, mock_request, mock_current_user):
        """Test successful dropdown option addition"""
        mock_current_user.is_authenticated = True
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'field_name': 'psp',
            'value': 'New PSP',
            'commission_rate': '0.025'
        }
        
        # Mock option creation
        mock_option = Mock()
        mock_option.id = 1
        mock_option.field_name = 'psp'
        mock_option.value = 'New PSP'
        mock_option.commission_rate = Decimal('0.025')
        mock_option_class.return_value = mock_option
        
        # Mock database operations
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        # Mock existing option check
        mock_option_class.query.filter_by.return_value.first.return_value = None
        
        response = transactions_api.add_dropdown_option()
        
        assert response[1] == 201
        response_data = response[0].get_json()
        assert response_data['message'] == 'Option added successfully'
        assert response_data['option']['value'] == 'New PSP'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_add_dropdown_option_not_authenticated(self, mock_current_user):
        """Test dropdown option addition when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.add_dropdown_option()
        
        assert response[1] == 401
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_add_dropdown_option_static_field(self, mock_request, mock_current_user):
        """Test adding option to static field"""
        mock_current_user.is_authenticated = True
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'field_name': 'payment_method',  # Static field
            'value': 'New Method'
        }
        
        response = transactions_api.add_dropdown_option()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert 'Cannot modify static field' in response_data['error']


class TestDeleteTransaction:
    """Test delete_transaction endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    @patch('app.api.v1.endpoints.transactions.TransactionService')
    def test_delete_transaction_success(self, mock_transaction_service, mock_transaction_class, mock_db, mock_request, mock_current_user):
        """Test successful transaction deletion"""
        mock_current_user.is_authenticated = True
        mock_current_user.id = 1
        
        # Mock CSRF token validation
        mock_request.headers.get.return_value = 'valid_token'
        mock_request.session = {'csrf_token': 'valid_token'}
        
        # Mock transaction
        mock_transaction = Mock()
        mock_transaction.id = 1
        mock_transaction.client_name = 'Test Client'
        mock_transaction.amount = Decimal('1000.00')
        mock_transaction.currency = 'TL'
        mock_transaction.date = date(2025, 1, 1)
        mock_transaction_class.query.get_or_404.return_value = mock_transaction
        
        # Mock transaction service
        mock_transaction_service.delete_transaction.return_value = True
        
        response = transactions_api.delete_transaction(1)
        
        assert response[1] == 200
        response_data = response[0].get_json()
        assert response_data['success'] is True
        assert response_data['message'] == 'Transaction deleted successfully'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_delete_transaction_not_authenticated(self, mock_current_user):
        """Test transaction deletion when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.delete_transaction(1)
        
        assert response[1] == 401
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_delete_transaction_missing_csrf_token(self, mock_request, mock_current_user):
        """Test transaction deletion with missing CSRF token"""
        mock_current_user.is_authenticated = True
        
        mock_request.headers.get.return_value = None
        
        response = transactions_api.delete_transaction(1)
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert 'CSRF token missing' in response_data['error']


class TestGetTransaction:
    """Test get_transaction endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_get_transaction_success(self, mock_transaction_class, mock_current_user):
        """Test successful single transaction retrieval"""
        mock_current_user.is_authenticated = True
        
        # Mock transaction
        mock_transaction = Mock()
        mock_transaction.id = 1
        mock_transaction.client_name = 'Test Client'
        mock_transaction.amount = Decimal('1000.00')
        mock_transaction.commission = Decimal('25.00')
        mock_transaction.net_amount = Decimal('975.00')
        mock_transaction.currency = 'TL'
        mock_transaction.psp = 'Test PSP'
        mock_transaction.category = 'DEP'
        mock_transaction.payment_method = 'Credit Card'
        mock_transaction.notes = 'Test transaction'
        mock_transaction.date = date(2025, 1, 1)
        mock_transaction.created_at = datetime(2025, 1, 1)
        mock_transaction.updated_at = None
        mock_transaction.amount_try = None
        mock_transaction.commission_try = None
        mock_transaction.net_amount_try = None
        mock_transaction.exchange_rate = None
        
        mock_transaction_class.query.get.return_value = mock_transaction
        
        response = transactions_api.get_transaction(1)
        
        assert response[1] == 200
        response_data = response[0].get_json()
        assert response_data['status'] == 'success'
        assert response_data['transaction']['id'] == 1
        assert response_data['transaction']['client_name'] == 'Test Client'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_get_transaction_not_found(self, mock_transaction_class, mock_current_user):
        """Test transaction retrieval when transaction not found"""
        mock_current_user.is_authenticated = True
        
        mock_transaction_class.query.get.return_value = None
        
        response = transactions_api.get_transaction(999)
        
        assert response[1] == 404
        response_data = response[0].get_json()
        assert 'Transaction not found' in response_data['error']
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_get_transaction_not_authenticated(self, mock_current_user):
        """Test transaction retrieval when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.get_transaction(1)
        
        assert response[1] == 401


class TestUpdateTransaction:
    """Test update_transaction endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_update_transaction_success(self, mock_transaction_class, mock_db, mock_request, mock_current_user):
        """Test successful transaction update"""
        mock_current_user.is_authenticated = True
        mock_current_user.username = 'testuser'
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'client_name': 'Updated Client',
            'amount': '2000.00',
            'currency': 'TL',
            'psp': 'Updated PSP',
            'category': 'DEP',
            'payment_method': 'Bank Transfer',
            'notes': 'Updated transaction',
            'date': '2025-01-02'
        }
        
        # Mock transaction
        mock_transaction = Mock()
        mock_transaction.id = 1
        mock_transaction.client_name = 'Test Client'
        mock_transaction.amount = Decimal('1000.00')
        mock_transaction.commission = Decimal('25.00')
        mock_transaction.net_amount = Decimal('975.00')
        mock_transaction.currency = 'TL'
        mock_transaction.psp = 'Test PSP'
        mock_transaction.category = 'DEP'
        mock_transaction.payment_method = 'Credit Card'
        mock_transaction.notes = 'Test transaction'
        mock_transaction.date = date(2025, 1, 1)
        mock_transaction.amount_try = None
        mock_transaction.commission_try = None
        mock_transaction.net_amount_try = None
        mock_transaction.exchange_rate = None
        
        mock_transaction_class.query.get.return_value = mock_transaction
        
        # Mock database operations
        mock_db.session.commit = Mock()
        
        # Mock PSP option query
        with patch('app.api.v1.endpoints.transactions.Option') as mock_option:
            mock_option.query.filter_by.return_value.first.return_value = None
            
            response = transactions_api.update_transaction(1)
            
            assert response[1] == 200
            response_data = response[0].get_json()
            assert response_data['status'] == 'success'
            assert response_data['message'] == 'Transaction updated successfully'
            assert response_data['transaction']['client_name'] == 'Updated Client'
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_update_transaction_not_authenticated(self, mock_current_user):
        """Test transaction update when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.update_transaction(1)
        
        assert response[1] == 401
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_update_transaction_not_found(self, mock_transaction_class, mock_request, mock_current_user):
        """Test transaction update when transaction not found"""
        mock_current_user.is_authenticated = True
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'client_name': 'Updated Client',
            'amount': '2000.00'
        }
        
        mock_transaction_class.query.get.return_value = None
        
        response = transactions_api.update_transaction(999)
        
        assert response[1] == 404
        response_data = response[0].get_json()
        assert 'Transaction not found' in response_data['error']


class TestBulkImportTransactions:
    """Test bulk_import_transactions endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_bulk_import_success(self, mock_transaction_class, mock_db, mock_request, mock_current_user):
        """Test successful bulk import"""
        mock_current_user.is_authenticated = True
        mock_current_user.username = 'testuser'
        mock_current_user.id = 1
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'transactions': [
                {
                    'client_name': 'Client 1',
                    'amount': '1000.00',
                    'currency': 'TL',
                    'psp': 'PSP1',
                    'category': 'DEP',
                    'payment_method': 'Credit Card',
                    'notes': 'Test transaction 1',
                    'date': '2025-01-01'
                },
                {
                    'client_name': 'Client 2',
                    'amount': '2000.00',
                    'currency': 'TL',
                    'psp': 'PSP2',
                    'category': 'DEP',
                    'payment_method': 'Bank Transfer',
                    'notes': 'Test transaction 2',
                    'date': '2025-01-02'
                }
            ]
        }
        
        # Mock transaction creation
        mock_transaction = Mock()
        mock_transaction_class.return_value = mock_transaction
        
        # Mock database operations
        mock_db.session.add = Mock()
        mock_db.session.commit = Mock()
        
        response = transactions_api.bulk_import_transactions()
        
        assert response[1] == 200
        response_data = response[0].get_json()
        assert response_data['success'] is True
        assert response_data['data']['successful_imports'] == 2
        assert response_data['data']['failed_imports'] == 0
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_bulk_import_not_authenticated(self, mock_current_user):
        """Test bulk import when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.bulk_import_transactions()
        
        assert response[1] == 401
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_bulk_import_invalid_data(self, mock_request, mock_current_user):
        """Test bulk import with invalid data"""
        mock_current_user.is_authenticated = True
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'transactions': []  # Empty array
        }
        
        response = transactions_api.bulk_import_transactions()
        
        assert response[1] == 400
        response_data = response[0].get_json()
        assert 'No transactions to import' in response_data['error']


class TestBulkDeleteTransactions:
    """Test bulk_delete_transactions endpoint"""
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    @patch('app.api.v1.endpoints.transactions.db')
    @patch('app.api.v1.endpoints.transactions.Transaction')
    def test_bulk_delete_success(self, mock_transaction_class, mock_db, mock_request, mock_current_user):
        """Test successful bulk delete"""
        mock_current_user.is_authenticated = True
        mock_current_user.username = 'testuser'
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'confirmation_code': '4561'
        }
        
        # Mock transaction count
        mock_transaction_class.query.count.return_value = 5
        
        # Mock database operations
        mock_db.session.commit = Mock()
        
        # Mock Flask app config
        with patch('app.api.v1.endpoints.transactions.current_app') as mock_app:
            mock_app.config.get.return_value = '4561'
            
            response = transactions_api.bulk_delete_transactions()
            
            assert response[1] == 200
            response_data = response[0].get_json()
            assert response_data['success'] is True
            assert response_data['data']['deleted_count'] == 5
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    def test_bulk_delete_not_authenticated(self, mock_current_user):
        """Test bulk delete when user is not authenticated"""
        mock_current_user.is_authenticated = False
        
        response = transactions_api.bulk_delete_transactions()
        
        assert response[1] == 401
    
    @patch('app.api.v1.endpoints.transactions.current_user')
    @patch('app.api.v1.endpoints.transactions.request')
    def test_bulk_delete_invalid_confirmation_code(self, mock_request, mock_current_user):
        """Test bulk delete with invalid confirmation code"""
        mock_current_user.is_authenticated = True
        
        mock_request.is_json = True
        mock_request.get_json.return_value = {
            'confirmation_code': '1234'  # Wrong code
        }
        
        # Mock Flask app config
        with patch('app.api.v1.endpoints.transactions.current_app') as mock_app:
            mock_app.config.get.return_value = '4561'
            
            response = transactions_api.bulk_delete_transactions()
            
            assert response[1] == 400
            response_data = response[0].get_json()
            assert 'Invalid confirmation code' in response_data['error']
