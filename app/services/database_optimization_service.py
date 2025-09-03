"""
Database Optimization Service for PipLine Treasury System
Handles database indexes, query optimization, and performance tuning
"""
import logging
import time
from datetime import datetime
from sqlalchemy import text, Index, inspect
from app import db
from app.models.transaction import Transaction
from app.models.user import User
from app.models.config import Option, UserSettings, ExchangeRate
from app.models.financial import PspTrack, DailyBalance

# Decimal/Float type mismatch prevention
from app.services.decimal_float_fix_service import decimal_float_service


logger = logging.getLogger(__name__)

class DatabaseOptimizationService:
    """Service for database optimization and performance tuning"""
    
    def __init__(self):
        self.optimization_log = []
    
    def create_performance_indexes(self):
        """Create performance indexes for optimized queries"""
        try:
            logger.info("Creating performance indexes...")
            
            # Get database engine
            engine = db.engine
            
            # Create indexes for Transaction table
            indexes_to_create = [
                # Single column indexes for frequently queried fields
                ('idx_transaction_date_optimized', 'transaction', ['date']),
                ('idx_transaction_psp_optimized', 'transaction', ['psp']),
                ('idx_transaction_client_optimized', 'transaction', ['client_name']),
                ('idx_transaction_category_optimized', 'transaction', ['category']),
                ('idx_transaction_currency_optimized', 'transaction', ['currency']),
                ('idx_transaction_created_at_optimized', 'transaction', ['created_at']),
                ('idx_transaction_created_by_optimized', 'transaction', ['created_by']),
                
                # Composite indexes for common query patterns
                ('idx_transaction_date_psp_optimized', 'transaction', ['date', 'psp']),
                ('idx_transaction_date_category_optimized', 'transaction', ['date', 'category']),
                ('idx_transaction_date_currency_optimized', 'transaction', ['date', 'currency']),
                ('idx_transaction_psp_category_optimized', 'transaction', ['psp', 'category']),
                ('idx_transaction_created_by_date_optimized', 'transaction', ['created_by', 'date']),
                
                # Multi-column indexes for complex analytics queries
                ('idx_transaction_date_psp_category_optimized', 'transaction', ['date', 'psp', 'category']),
                ('idx_transaction_date_currency_psp_optimized', 'transaction', ['date', 'currency', 'psp']),
                ('idx_transaction_amount_date_optimized', 'transaction', ['amount', 'date']),
                ('idx_transaction_commission_date_optimized', 'transaction', ['commission', 'date']),
                
                # Indexes for User table
                ('idx_user_username_optimized', 'user', ['username']),
                ('idx_user_email_optimized', 'user', ['email']),
                ('idx_user_active_optimized', 'user', ['is_active']),
                
                # Indexes for ExchangeRate table
                ('idx_exchange_rate_date_optimized', 'exchange_rates', ['date']),
                ('idx_exchange_rate_currency_optimized', 'exchange_rates', ['currency_pair']),
                
                # Indexes for PspTrack table
                ('idx_psp_track_date_optimized', 'psp_track', ['date']),
                ('idx_psp_track_psp_name_optimized', 'psp_track', ['psp_name']),
                ('idx_psp_track_date_psp_optimized', 'psp_track', ['date', 'psp_name']),
                
                # Indexes for DailyBalance table
                ('idx_daily_balance_date_optimized', 'daily_balance', ['date']),
                ('idx_daily_balance_psp_optimized', 'daily_balance', ['psp']),
                ('idx_daily_balance_date_psp_optimized', 'daily_balance', ['date', 'psp'])
            ]
            
            created_count = 0
            for index_name, table_name, columns in indexes_to_create:
                try:
                    # SECURITY FIX: Use parameterized query to check if index exists
                    check_sql = text("""
                        SELECT name FROM sqlite_master 
                        WHERE type='index' AND name=:index_name
                    """)
                    result = db.session.execute(check_sql, {'index_name': index_name})
                    if not result.fetchone():
                        # SECURITY FIX: Use parameterized query to create index
                        # Note: SQLite doesn't support parameters in CREATE INDEX, so we validate table_name and columns
                        if self._is_valid_table_name(table_name) and self._are_valid_column_names(columns):
                            columns_str = ', '.join(columns)
                            create_sql = text(f'CREATE INDEX {index_name} ON "{table_name}" ({columns_str})')
                            db.session.execute(create_sql)
                            created_count += 1
                            logger.info(f"Created index: {index_name}")
                        else:
                            logger.warning(f"Invalid table or column names for index {index_name}")
                    else:
                        logger.debug(f"Index already exists: {index_name}")
                        
                except Exception as e:
                    logger.warning(f"Failed to create index {index_name}: {e}")
            
            # Commit all changes
            db.session.commit()
            
            logger.info(f"Database optimization completed. Created {created_count} new indexes.")
            return {
                'status': 'success',
                'indexes_created': created_count,
                'total_indexes': len(indexes_to_create),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating performance indexes: {e}")
            db.session.rollback()
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _is_valid_table_name(self, table_name: str) -> bool:
        """Validate table name to prevent SQL injection"""
        # Only allow alphanumeric characters and underscores
        import re
        return bool(re.match(r'^[a-zA-Z0-9_]+$', table_name))
    
    def _are_valid_column_names(self, columns: list) -> bool:
        """Validate column names to prevent SQL injection"""
        import re
        for column in columns:
            if not re.match(r'^[a-zA-Z0-9_]+$', column):
                return False
        return True
    
    def analyze_query_performance(self):
        """Analyze current query performance and suggest optimizations"""
        try:
            logger.info("Analyzing query performance...")
            
            # Get database statistics
            stats = {}
            
            # SECURITY FIX: Use parameterized query for transaction stats
            transaction_stats = db.session.execute(text("""
                SELECT 
                    COUNT(*) as total_rows,
                    COUNT(DISTINCT date) as unique_dates,
                    COUNT(DISTINCT psp) as unique_psps,
                    COUNT(DISTINCT client_name) as unique_clients,
                    COUNT(DISTINCT category) as unique_categories,
                    COUNT(DISTINCT currency) as unique_currencies
                FROM "transaction"
            """)).first()
            
            stats['transaction'] = {
                'total_rows': transaction_stats.total_rows,
                'unique_dates': transaction_stats.unique_dates,
                'unique_psps': transaction_stats.unique_psps,
                'unique_clients': transaction_stats.unique_clients,
                'unique_categories': transaction_stats.unique_categories,
                'unique_currencies': transaction_stats.unique_currencies
            }
            
            # SECURITY FIX: Use parameterized query for index stats
            index_stats = db.session.execute(text("""
                SELECT 
                    name,
                    tbl_name,
                    sql
                FROM sqlite_master 
                WHERE type='index' AND tbl_name='transaction'
                ORDER BY name
            """)).fetchall()
            
            stats['indexes'] = [
                {
                    'name': idx.name,
                    'table': idx.tbl_name,
                    'definition': idx.sql
                }
                for idx in index_stats
            ]
            
            # Performance recommendations
            recommendations = []
            
            if transaction_stats.total_rows > 10000:
                recommendations.append({
                    'type': 'warning',
                    'message': 'Large transaction table detected. Consider partitioning for better performance.',
                    'impact': 'high'
                })
            
            if transaction_stats.unique_dates < transaction_stats.total_rows * 0.1:
                recommendations.append({
                    'type': 'info',
                    'message': 'High transaction density per date. Date-based indexes are optimal.',
                    'impact': 'medium'
                })
            
            if len(stats['indexes']) < 10:
                recommendations.append({
                    'type': 'warning',
                    'message': 'Limited indexes detected. Consider adding more indexes for common query patterns.',
                    'impact': 'high'
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'recommendations': recommendations,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing query performance: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def optimize_database_settings(self):
        """Optimize database settings for better performance"""
        try:
            logger.info("Optimizing database settings...")
            
            # SQLite-specific optimizations - these are safe as they are predefined constants
            optimizations = [
                "PRAGMA journal_mode = WAL",  # Write-Ahead Logging for better concurrency
                "PRAGMA synchronous = NORMAL",  # Balance between safety and performance
                "PRAGMA cache_size = -64000",  # 64MB cache size
                "PRAGMA temp_store = MEMORY",  # Store temp tables in memory
                "PRAGMA mmap_size = 268435456",  # 256MB memory mapping
                "PRAGMA page_size = 4096",  # Optimal page size
                "PRAGMA auto_vacuum = INCREMENTAL",  # Incremental vacuum for better performance
                "PRAGMA incremental_vacuum(1000)"  # Vacuum 1000 pages
            ]
            
            applied_count = 0
            for optimization in optimizations:
                try:
                    # SECURITY FIX: These are predefined safe SQL statements
                    db.session.execute(text(optimization))
                    applied_count += 1
                    logger.debug(f"Applied optimization: {optimization}")
                except Exception as e:
                    logger.warning(f"Failed to apply optimization {optimization}: {e}")
            
            db.session.commit()
            
            logger.info(f"Database settings optimization completed. Applied {applied_count} optimizations.")
            return {
                'status': 'success',
                'optimizations_applied': applied_count,
                'total_optimizations': len(optimizations),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error optimizing database settings: {e}")
            db.session.rollback()
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def run_full_optimization(self):
        """Run complete database optimization"""
        try:
            logger.info("Starting full database optimization...")
            
            results = {
                'indexes': self.create_performance_indexes(),
                'analysis': self.analyze_query_performance(),
                'settings': self.optimize_database_settings(),
                'timestamp': datetime.now().isoformat()
            }
            
            # Log optimization summary
            success_count = sum(1 for result in results.values() if isinstance(result, dict) and result.get('status') == 'success')
            total_count = len([k for k in results.keys() if k != 'timestamp'])
            
            logger.info(f"Full database optimization completed. {success_count}/{total_count} optimizations successful.")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in full database optimization: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# Global instance
database_optimization_service = DatabaseOptimizationService() 