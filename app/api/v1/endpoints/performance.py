"""
Performance monitoring API endpoints
"""

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.services.performance_service import performance_monitor
from app.utils.permission_decorators import require_any_admin
import logging

logger = logging.getLogger(__name__)

performance_api = Blueprint('performance_api', __name__)


@performance_api.route('/summary', methods=['GET'])
@login_required
@require_any_admin
def performance_summary():
    """Get performance summary"""
    try:
        summary = performance_monitor.get_performance_summary()
        return jsonify({
            'status': 'success',
            'data': summary
        }), 200
        
    except Exception as e:
        logger.error(f"Performance summary failed: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to get performance summary'
        }), 500


@performance_api.route('/optimize', methods=['POST'])
@login_required
@require_any_admin
def optimize_performance():
    """Perform performance optimization"""
    try:
        optimization_type = request.json.get('type', 'memory') if request.json else 'memory'
        
        if optimization_type == 'memory':
            result = performance_monitor.optimize_memory()
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unknown optimization type: {optimization_type}'
            }), 400
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Performance optimization failed: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Performance optimization failed'
        }), 500


@performance_api.route('/metrics', methods=['GET'])
@login_required
@require_any_admin
def system_metrics():
    """Get current system metrics"""
    try:
        import psutil
        
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            'cpu': {
                'percent': cpu_percent,
                'count': psutil.cpu_count()
            },
            'memory': {
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'used_gb': round(memory.used / (1024**3), 2),
                'percent': memory.percent
            },
            'disk': {
                'total_gb': round(disk.total / (1024**3), 2),
                'free_gb': round(disk.free / (1024**3), 2),
                'used_gb': round(disk.used / (1024**3), 2),
                'percent': round((disk.used / disk.total) * 100, 1)
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': metrics
        }), 200
        
    except Exception as e:
        logger.error(f"System metrics failed: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to get system metrics'
        }), 500