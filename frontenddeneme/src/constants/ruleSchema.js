export const RULE_SCHEMA = {
    Paycell: {
        features: [
            { name: 'Transaction Type', key: 'type', type: 'categorical', options: ['TRANSFER', 'PAYMENT', 'QR_PAYMENT', 'TOP_UP', 'WITHDRAWAL'] },
            { name: 'Amount', key: 'amount', type: 'numeric', unit: 'TRY' },
            { name: 'Merchant', key: 'merchant', type: 'categorical', options: ['GamblingWebsite', 'CryptoExchange', 'GasStation', 'Pharmacy', 'Market', 'Clothing', 'OnlineStore', 'Restaurant'] }
        ]
    },
    BiP: {
        features: [
            { name: 'Event Type', key: 'event_type', type: 'categorical', options: ['MESSAGE', 'CALL', 'FILE_SHARE', 'GROUP_CREATE', 'LOGIN'] },
            { name: 'IP Risk Level', key: 'ip_risk', type: 'categorical', options: ['low', 'medium', 'high'] },
            { name: 'Device Status', key: 'device_status', type: 'categorical', options: ['new', 'known'] },
            { name: 'Transaction Count', key: 'count', type: 'numeric' }
        ]
    },
    'TV+': {
        features: [
            { name: 'Concurrent Streams', key: 'concurrent_streams', type: 'numeric', limit: { min: 1, max: 6 } },
            { name: 'Watch Type', key: 'watch_type', type: 'categorical', options: ['STREAM', 'DOWNLOAD', 'ACCOUNT_SHARE', 'PREMIUM_ACCESS'] },
            { name: 'Duration', key: 'duration', type: 'numeric', unit: 'Minutes' }
        ]
    },
    Superonline: {
        features: [
            { name: 'Traffic Type', key: 'traffic_type', type: 'categorical', options: ['PORT_SCAN', 'DNS_QUERY', 'BANDWIDTH_SPIKE', 'CONNECTION'] },
            { name: 'Bandwidth', key: 'bandwidth', type: 'numeric', unit: 'Mbps' },
            { name: 'Data Amount', key: 'data_amount', type: 'numeric', unit: 'MB' }
        ]
    }
};

export const OPERATORS = {
    numeric: [
        { label: 'Greater Than (>)', value: '>' },
        { label: 'Less Than (<)', value: '<' },
        { label: 'Equals (==)', value: '==' },
        { label: 'Greater/Equal (>=)', value: '>=' },
        { label: 'Less/Equal (<=)', value: '<=' }
    ],
    categorical: [
        { label: 'Equals (==)', value: '==' },
        { label: 'Not Equals (!=)', value: '!=' },
        { label: 'In List (IN)', value: 'IN' },
        { label: 'Not In List (NOT IN)', value: 'NOT IN' }
    ]
};
