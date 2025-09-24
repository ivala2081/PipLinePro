
def calculate_commission_standardized(amount: float, rate: float) -> float:
    """
    Calculate commission using standardized financial calculation method.
    
    Args:
        amount: Net amount (deposits - withdrawals) in TRY
        rate: Commission rate as decimal (e.g., 0.075 for 7.5%)
    
    Returns:
        Commission amount rounded to 2 decimal places using ROUND_HALF_UP
    
    Example:
        >>> calculate_commission_standardized(1000.0, 0.075)
        75.0
        >>> calculate_commission_standardized(3024659.0, 0.075)
        226849.43
    """
    from decimal import Decimal, ROUND_HALF_UP
    
    # Convert to Decimal for precise arithmetic
    amount_decimal = Decimal(str(amount))
    rate_decimal = Decimal(str(rate))
    
    # Calculate commission
    commission = amount_decimal * rate_decimal
    
    # Round to 2 decimal places using ROUND_HALF_UP
    commission_rounded = commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    return float(commission_rounded)


def calculate_psp_monthly_summary(psp_name: str, start_date: date, end_date: date, 
                                db_connection) -> dict:
    """
    Calculate standardized monthly summary for a PSP.
    
    Args:
        psp_name: Name of the PSP
        start_date: Start date for calculations
        end_date: End date for calculations
        db_connection: Database connection object
    
    Returns:
        Dictionary with standardized calculations
    """
    # Get deposits
    deposits_query = """
        SELECT SUM(COALESCE(amount_try, amount)) as total_deposits
        FROM [transaction] 
        WHERE psp = ? 
        AND UPPER(category) IN ('DEP', 'DEPOSIT', 'INVESTMENT')
        AND date >= ? 
        AND date <= ?
    """
    deposits_result = db_connection.execute(deposits_query, (psp_name, start_date, end_date)).fetchone()
    total_deposits = float(deposits_result[0] or 0.0)
    
    # Get withdrawals
    withdrawals_query = """
        SELECT SUM(COALESCE(amount_try, amount)) as total_withdrawals
        FROM [transaction] 
        WHERE psp = ? 
        AND UPPER(category) IN ('WD', 'WITHDRAW', 'WITHDRAWAL')
        AND date >= ? 
        AND date <= ?
    """
    withdrawals_result = db_connection.execute(withdrawals_query, (psp_name, start_date, end_date)).fetchone()
    total_withdrawals = float(withdrawals_result[0] or 0.0)
    
    # Calculate net amount
    net_amount = total_deposits - total_withdrawals
    
    # Get commission rate
    rate_query = """
        SELECT commission_rate 
        FROM option 
        WHERE field_name = 'psp' 
        AND value = ? 
        AND is_active = 1
    """
    rate_result = db_connection.execute(rate_query, (psp_name,)).fetchone()
    commission_rate = float(rate_result[0] or 0.0) if rate_result else 0.0
    
    # Calculate commission using standardized method
    commission = calculate_commission_standardized(net_amount, commission_rate)
    
    # Calculate net after commission
    net_after_commission = net_amount - commission
    
    # Get allocations
    allocations_query = """
        SELECT SUM(allocation_amount) as total_allocations
        FROM psp_allocation 
        WHERE psp_name = ? 
        AND date >= ? 
        AND date <= ?
    """
    allocations_result = db_connection.execute(allocations_query, (psp_name, start_date, end_date)).fetchone()
    total_allocations = float(allocations_result[0] or 0.0)
    
    # Calculate rollover
    rollover = net_after_commission - total_allocations
    
    return {
        'psp': psp_name,
        'deposits': total_deposits,
        'withdrawals': total_withdrawals,
        'total': net_amount,
        'commission_rate': commission_rate,
        'commission': commission,
        'net': net_after_commission,
        'allocations': total_allocations,
        'rollover': rollover
    }
