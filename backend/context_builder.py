import json

class ServiceProxy:
    """
    Dynamic object to allow dot notation access to dictionary keys.
    Returns None for missing attributes to prevent evaluation crashes.
    """
    def __init__(self, data):
        self.__dict__.update(data)
    def __getattr__(self, name):
        return None

def build_evaluation_context(event):
    """
    Constructs the context dictionary for rule evaluation.
    Maps event values to common feature names (amount, count, etc.)
    and handles JSON meta parsing.
    """
    # Parse Meta
    meta_data = {}
    try:
        if event.meta:
            meta_data = json.loads(event.meta)
    except:
        meta_data = {}

    # Generic Value Mapper
    val = event.value if event.value is not None else 0
    
    feature_map = {
        "amount": val,
        "count": int(val), 
        "duration": val,
        "bandwidth": val,
        "concurrent_streams": val,
        "data_amount": val,
        "type": event.event_type,
        "event_type": event.event_type,
        "traffic_type": event.event_type,
        "watch_type": meta_data.get("watch_type", "STREAM"),
        "merchant": meta_data.get("merchant", "Unknown"),
        "city": event.unit, 
        # Add meta keys
        **meta_data
    }

    # Context Setup
    context = {
        "value": val,
        "service": event.service,
        "event_type": event.event_type,
        "unit": event.unit,
        # Inject the specific service key, e.g. defined variables 'Paycell', 'BiP'
        event.service: ServiceProxy(feature_map) if event.service else None
    }

    # Inject other known services as None to prevent NameError
    KNOWN_SERVICES = ['Paycell', 'BiP', 'TV+', 'Superonline']
    for s in KNOWN_SERVICES:
        if s not in context:
            context[s] = None 

    return context
