"""
Unit tests for query_optimizer.py module
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy import text

from app.utils.query_optimizer import (
    optimize_query, add_indexes, analyze_query_performance,
    get_query_plan, optimize_join_queries, cache_query_result,
    get_cached_result, invalidate_cache, QueryOptimizer
)


class TestOptimizeQuery:
    """Test optimize_query function"""
    
    def test_optimize_query_simple_select(self):
        """Test optimization of simple SELECT query"""
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = optimize_query(query)
        
        assert result['optimized'] is True
        assert 'optimized_query' in result
        assert 'suggestions' in result
        assert 'performance_impact' in result
    
    def test_optimize_query_with_joins(self):
        """Test optimization of query with joins"""
        query = """
        SELECT t.*, c.name 
        FROM transactions t 
        JOIN clients c ON t.client_id = c.id 
        WHERE t.amount > 1000
        """
        
        result = optimize_query(query)
        
        assert result['optimized'] is True
        assert 'optimized_query' in result
        assert 'suggestions' in result
    
    def test_optimize_query_invalid_sql(self):
        """Test optimization with invalid SQL"""
        query = "INVALID SQL QUERY"
        
        result = optimize_query(query)
        
        assert result['optimized'] is False
        assert 'error' in result
    
    def test_optimize_query_empty_string(self):
        """Test optimization with empty string"""
        query = ""
        
        result = optimize_query(query)
        
        assert result['optimized'] is False
        assert 'error' in result


class TestAddIndexes:
    """Test add_indexes function"""
    
    @patch('app.utils.query_optimizer.db')
    def test_add_indexes_success(self, mock_db):
        """Test successful index creation"""
        mock_db.session.execute = Mock()
        mock_db.session.commit = Mock()
        
        indexes = [
            "CREATE INDEX idx_transactions_amount ON transactions(amount)",
            "CREATE INDEX idx_transactions_date ON transactions(date)"
        ]
        
        result = add_indexes(indexes)
        
        assert result['success'] is True
        assert result['created_count'] == 2
        assert result['errors'] == []
        mock_db.session.execute.assert_called()
        mock_db.session.commit.assert_called()
    
    @patch('app.utils.query_optimizer.db')
    def test_add_indexes_with_errors(self, mock_db):
        """Test index creation with some errors"""
        mock_db.session.execute.side_effect = [
            None,  # First index succeeds
            Exception("Index already exists")  # Second index fails
        ]
        mock_db.session.commit = Mock()
        
        indexes = [
            "CREATE INDEX idx_transactions_amount ON transactions(amount)",
            "CREATE INDEX idx_invalid ON invalid_table(column)"
        ]
        
        result = add_indexes(indexes)
        
        assert result['success'] is False
        assert result['created_count'] == 1
        assert len(result['errors']) == 1
        assert 'Index already exists' in result['errors'][0]


class TestAnalyzeQueryPerformance:
    """Test analyze_query_performance function"""
    
    @patch('app.utils.query_optimizer.db')
    def test_analyze_query_performance_success(self, mock_db):
        """Test successful query performance analysis"""
        mock_db.session.execute.return_value.fetchall.return_value = [
            ('Seq Scan', 'transactions', 1000, 100, 0.5),
            ('Index Scan', 'transactions_amount_idx', 100, 10, 0.1)
        ]
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = analyze_query_performance(query)
        
        assert result['success'] is True
        assert 'execution_time' in result
        assert 'rows_examined' in result
        assert 'rows_returned' in result
        assert 'cost' in result
        assert 'operations' in result
    
    @patch('app.utils.query_optimizer.db')
    def test_analyze_query_performance_error(self, mock_db):
        """Test query performance analysis with error"""
        mock_db.session.execute.side_effect = Exception("Query execution failed")
        
        query = "INVALID SQL QUERY"
        
        result = analyze_query_performance(query)
        
        assert result['success'] is False
        assert 'error' in result
        assert 'Query execution failed' in result['error']


class TestGetQueryPlan:
    """Test get_query_plan function"""
    
    @patch('app.utils.query_optimizer.db')
    def test_get_query_plan_success(self, mock_db):
        """Test successful query plan retrieval"""
        mock_db.session.execute.return_value.fetchall.return_value = [
            ('Seq Scan', 'transactions', 1000, 100, 0.5),
            ('Index Scan', 'transactions_amount_idx', 100, 10, 0.1)
        ]
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = get_query_plan(query)
        
        assert result['success'] is True
        assert 'plan' in result
        assert len(result['plan']) == 2
        assert result['plan'][0]['operation'] == 'Seq Scan'
        assert result['plan'][1]['operation'] == 'Index Scan'
    
    @patch('app.utils.query_optimizer.db')
    def test_get_query_plan_error(self, mock_db):
        """Test query plan retrieval with error"""
        mock_db.session.execute.side_effect = Exception("Query planning failed")
        
        query = "INVALID SQL QUERY"
        
        result = get_query_plan(query)
        
        assert result['success'] is False
        assert 'error' in result
        assert 'Query planning failed' in result['error']


class TestOptimizeJoinQueries:
    """Test optimize_join_queries function"""
    
    def test_optimize_join_queries_simple_join(self):
        """Test optimization of simple join query"""
        query = """
        SELECT t.*, c.name 
        FROM transactions t 
        JOIN clients c ON t.client_id = c.id 
        WHERE t.amount > 1000
        """
        
        result = optimize_join_queries(query)
        
        assert result['optimized'] is True
        assert 'optimized_query' in result
        assert 'suggestions' in result
        assert 'join_optimizations' in result
    
    def test_optimize_join_queries_multiple_joins(self):
        """Test optimization of query with multiple joins"""
        query = """
        SELECT t.*, c.name, p.psp_name 
        FROM transactions t 
        JOIN clients c ON t.client_id = c.id 
        JOIN psps p ON t.psp_id = p.id 
        WHERE t.amount > 1000
        """
        
        result = optimize_join_queries(query)
        
        assert result['optimized'] is True
        assert 'optimized_query' in result
        assert 'suggestions' in result
        assert 'join_optimizations' in result
    
    def test_optimize_join_queries_no_joins(self):
        """Test optimization of query without joins"""
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = optimize_join_queries(query)
        
        assert result['optimized'] is False
        assert 'No joins found' in result['message']


class TestCacheQueryResult:
    """Test cache_query_result function"""
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_cache_query_result_success(self, mock_redis):
        """Test successful query result caching"""
        mock_redis.setex.return_value = True
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        result = [{'id': 1, 'amount': 1500}]
        ttl = 300
        
        cache_result = cache_query_result(query, result, ttl)
        
        assert cache_result is True
        mock_redis.setex.assert_called_once()
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_cache_query_result_error(self, mock_redis):
        """Test query result caching with error"""
        mock_redis.setex.side_effect = Exception("Redis error")
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        result = [{'id': 1, 'amount': 1500}]
        ttl = 300
        
        cache_result = cache_query_result(query, result, ttl)
        
        assert cache_result is False


class TestGetCachedResult:
    """Test get_cached_result function"""
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_get_cached_result_found(self, mock_redis):
        """Test retrieval of cached result when found"""
        mock_redis.get.return_value = '{"id": 1, "amount": 1500}'
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = get_cached_result(query)
        
        assert result is not None
        assert result['id'] == 1
        assert result['amount'] == 1500
        mock_redis.get.assert_called_once()
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_get_cached_result_not_found(self, mock_redis):
        """Test retrieval of cached result when not found"""
        mock_redis.get.return_value = None
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = get_cached_result(query)
        
        assert result is None
        mock_redis.get.assert_called_once()
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_get_cached_result_invalid_json(self, mock_redis):
        """Test retrieval of cached result with invalid JSON"""
        mock_redis.get.return_value = 'invalid json'
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = get_cached_result(query)
        
        assert result is None


class TestInvalidateCache:
    """Test invalidate_cache function"""
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_invalidate_cache_success(self, mock_redis):
        """Test successful cache invalidation"""
        mock_redis.delete.return_value = 1
        
        pattern = "transactions:*"
        
        result = invalidate_cache(pattern)
        
        assert result is True
        mock_redis.delete.assert_called_once()
    
    @patch('app.utils.query_optimizer.redis_client')
    def test_invalidate_cache_error(self, mock_redis):
        """Test cache invalidation with error"""
        mock_redis.delete.side_effect = Exception("Redis error")
        
        pattern = "transactions:*"
        
        result = invalidate_cache(pattern)
        
        assert result is False


class TestQueryOptimizer:
    """Test QueryOptimizer class"""
    
    def test_query_optimizer_init(self):
        """Test QueryOptimizer initialization"""
        optimizer = QueryOptimizer()
        
        assert optimizer.cache_enabled is True
        assert optimizer.default_ttl == 300
        assert optimizer.performance_threshold == 1.0
    
    def test_query_optimizer_init_with_params(self):
        """Test QueryOptimizer initialization with parameters"""
        optimizer = QueryOptimizer(
            cache_enabled=False,
            default_ttl=600,
            performance_threshold=2.0
        )
        
        assert optimizer.cache_enabled is False
        assert optimizer.default_ttl == 600
        assert optimizer.performance_threshold == 2.0
    
    @patch('app.utils.query_optimizer.optimize_query')
    @patch('app.utils.query_optimizer.cache_query_result')
    @patch('app.utils.query_optimizer.get_cached_result')
    def test_optimize_with_cache_hit(self, mock_get_cached, mock_cache_result, mock_optimize):
        """Test optimization with cache hit"""
        optimizer = QueryOptimizer()
        
        # Mock cache hit
        mock_get_cached.return_value = {'cached': True}
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = optimizer.optimize(query)
        
        assert result['cached'] is True
        mock_get_cached.assert_called_once_with(query)
        mock_optimize.assert_not_called()
        mock_cache_result.assert_not_called()
    
    @patch('app.utils.query_optimizer.optimize_query')
    @patch('app.utils.query_optimizer.cache_query_result')
    @patch('app.utils.query_optimizer.get_cached_result')
    def test_optimize_with_cache_miss(self, mock_get_cached, mock_cache_result, mock_optimize):
        """Test optimization with cache miss"""
        optimizer = QueryOptimizer()
        
        # Mock cache miss
        mock_get_cached.return_value = None
        mock_optimize.return_value = {
            'optimized': True,
            'optimized_query': 'SELECT * FROM transactions WHERE amount > 1000',
            'suggestions': ['Add index on amount']
        }
        mock_cache_result.return_value = True
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = optimizer.optimize(query)
        
        assert result['optimized'] is True
        mock_get_cached.assert_called_once_with(query)
        mock_optimize.assert_called_once_with(query)
        mock_cache_result.assert_called_once()
    
    @patch('app.utils.query_optimizer.optimize_query')
    @patch('app.utils.query_optimizer.cache_query_result')
    @patch('app.utils.query_optimizer.get_cached_result')
    def test_optimize_with_cache_disabled(self, mock_get_cached, mock_cache_result, mock_optimize):
        """Test optimization with cache disabled"""
        optimizer = QueryOptimizer(cache_enabled=False)
        
        mock_optimize.return_value = {
            'optimized': True,
            'optimized_query': 'SELECT * FROM transactions WHERE amount > 1000',
            'suggestions': ['Add index on amount']
        }
        
        query = "SELECT * FROM transactions WHERE amount > 1000"
        
        result = optimizer.optimize(query)
        
        assert result['optimized'] is True
        mock_get_cached.assert_not_called()
        mock_optimize.assert_called_once_with(query)
        mock_cache_result.assert_not_called()
    
    def test_get_performance_metrics(self):
        """Test getting performance metrics"""
        optimizer = QueryOptimizer()
        
        metrics = optimizer.get_performance_metrics()
        
        assert 'cache_hits' in metrics
        assert 'cache_misses' in metrics
        assert 'total_optimizations' in metrics
        assert 'average_optimization_time' in metrics
    
    def test_reset_metrics(self):
        """Test resetting performance metrics"""
        optimizer = QueryOptimizer()
        
        # Set some metrics
        optimizer.cache_hits = 10
        optimizer.cache_misses = 5
        optimizer.total_optimizations = 15
        
        optimizer.reset_metrics()
        
        assert optimizer.cache_hits == 0
        assert optimizer.cache_misses == 0
        assert optimizer.total_optimizations == 0
