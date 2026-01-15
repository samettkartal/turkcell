import React, { useEffect, useState } from 'react';
import { getRiskRules, createRiskRule, updateRiskRule, deleteRiskRule } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { X, ToggleLeft, ToggleRight, Plus, Trash2, Edit } from 'lucide-react';

import { RULE_SCHEMA, OPERATORS } from '../constants/ruleSchema';

const ACTION_TYPES = [
    'BLOCK', 'ALERT', 'REVIEW', 'KILL_SESSION',
    'DYNAMIC_LIMIT_DOWNGRADE', 'DELAY_TRANSACTION', 'CAPTCHA_CHALLENGE'
];

const RiskRules = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionCount, setActionCount] = useState(1);
    const [selectedActions, setSelectedActions] = useState(['']);

    // Dynamic Rule State
    const [ruleState, setRuleState] = useState({
        service: '',
        feature: '',
        operator: '',
        value: ''
    });

    const [formData, setFormData] = useState({
        rule_id: '',
        priority: 1,
        is_active: true
    });

    const calculateNextRuleId = (currentRules) => {
        if (!currentRules || currentRules.length === 0) return 'RR-01';

        let maxId = 0;
        currentRules.forEach(rule => {
            const match = rule.rule_id.match(/RR-(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });

        const nextNum = maxId + 1;
        return `RR-${String(nextNum).padStart(2, '0')}`; // RR-09, RR-10 etc.
    };

    const fetchRules = async () => {
        try {
            const response = await getRiskRules();
            setRules(response.data);
            return response.data; // Return for immediate use
        } catch (error) {
            console.error("Failed to fetch rules", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleOpenModal = () => {
        const nextId = calculateNextRuleId(rules);
        setFormData({
            rule_id: nextId,
            priority: 1,
            is_active: true
        });
        setRuleState({ service: '', feature: '', operator: '', value: '' });
        setActionCount(1);
        setSelectedActions(['']);
        setIsModalOpen(true);
    };

    const handleActionCountChange = (e) => {
        const count = parseInt(e.target.value, 10);
        setActionCount(count);
        // Resize array, fill new slots with empty string
        const newActions = [...selectedActions];
        if (count > newActions.length) {
            for (let i = newActions.length; i < count; i++) newActions.push('');
        } else {
            newActions.length = count;
        }
        setSelectedActions(newActions);
    };

    const handleActionSelect = (index, value) => {
        const newActions = [...selectedActions];
        newActions[index] = value;
        setSelectedActions(newActions);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRuleChange = (field, value) => {
        setRuleState(prev => {
            const newState = { ...prev, [field]: value };
            // Reset dependent fields
            if (field === 'service') {
                newState.feature = '';
                newState.operator = '';
                newState.value = '';
            } else if (field === 'feature') {
                newState.operator = '';
                newState.value = '';
            }
            return newState;
        });
    };

    const getSelectedFeature = () => {
        if (!ruleState.service || !ruleState.feature) return null;
        return RULE_SCHEMA[ruleState.service].features.find(f => f.key === ruleState.feature);
    };

    const getOperatorsForFeature = () => {
        const feature = getSelectedFeature();
        if (!feature) return [];
        return OPERATORS[feature.type] || [];
    };

    const getReadableOperator = (opValue) => {
        const feature = getSelectedFeature();
        if (!feature) return opValue;
        const ops = OPERATORS[feature.type] || [];
        const found = ops.find(o => o.value === opValue);
        return found ? found.label : opValue;
    };

    const renderValueInput = () => {
        const feature = getSelectedFeature();
        if (!feature) return null;

        if (feature.options) {
            return (
                <select
                    value={ruleState.value}
                    onChange={(e) => handleRuleChange('value', e.target.value)}
                    className="w-full border rounded p-2"
                >
                    <option value="">Select Value...</option>
                    {feature.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        } else if (feature.limit) {
            return (
                <input
                    type="number"
                    min={feature.limit.min}
                    max={feature.limit.max}
                    value={ruleState.value}
                    onChange={(e) => handleRuleChange('value', e.target.value)}
                    className="w-full border rounded p-2"
                />
            );
        } else {
            return (
                <div className="flex items-center">
                    <input
                        type={feature.type === 'numeric' ? 'number' : 'text'}
                        value={ruleState.value}
                        onChange={(e) => handleRuleChange('value', e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder={`Enter ${feature.unit || 'value'}`}
                    />
                    {feature.unit && <span className="ml-2 text-gray-500">{feature.unit}</span>}
                </div>
            );
        }
    };

    const handleToggleStatus = async (rule) => {
        if (user?.role !== 'ADMIN') return;
        try {
            await updateRiskRule(rule.rule_id, {
                ...rule,
                is_active: !rule.is_active
            });
            fetchRules();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update rule status");
        }
    };

    const handleDelete = async (ruleId) => {
        if (!window.confirm("Are you sure you want to delete this rule? This action cannot be undone.")) return;

        try {
            await deleteRiskRule(ruleId);
            fetchRules();
        } catch (error) {
            console.error("Failed to delete rule", error);
            alert("Failed to delete rule.");
        }
    };

    const handleEdit = (rule) => {
        setFormData({
            rule_id: rule.rule_id,
            priority: rule.priority,
            is_active: rule.is_active
        });

        // Parse Action
        const actions = rule.action.split(',');
        setActionCount(actions.length);
        setSelectedActions(actions);

        // Parse Condition
        // Improved Regex to handle operators like 'NOT IN'
        const match = rule.condition.match(/^([A-Z_0-9+]+)\.([a-z_]+)\s+(==|!=|>=|<=|>|<|IN|NOT IN)\s+(.+)$/);

        if (match) {
            let val = match[4];
            // Remove quotes if present
            if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
                val = val.slice(1, -1);
            }

            setRuleState({
                service: match[1],
                feature: match[2],
                operator: match[3],
                value: val
            });
        } else {
            // Fallback for complex conditions (like RR-08 with AND)
            // We can't fully populate the UI, but we shouldn't break.
            console.warn("Complex condition format:", rule.condition);
            // Maybe try to guess service/feature?
            // For now, leave empty so user can redefine.
            setRuleState({ service: '', feature: '', operator: '', value: '' });
        }

        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Remove empty actions and join them
        const finalActions = selectedActions.filter(a => a).join(',');

        if (!finalActions) {
            alert("Please select at least one action.");
            return;
        }

        // Construct Condition String
        if (!ruleState.service || !ruleState.feature || !ruleState.operator || !ruleState.value) {
            alert("Please complete the rule condition definition.");
            return;
        }

        // Encode condition
        let valueStr = ruleState.value;
        const feature = getSelectedFeature();

        // Quote strings if needed
        if (feature?.type === 'categorical' || (typeof valueStr === 'string' && !valueStr.match(/^-?\d+(\.\d+)?$/))) {
            if (!valueStr.startsWith("'") && !valueStr.startsWith('"')) {
                valueStr = `'${valueStr}'`;
            }
        }

        const conditionStr = `${ruleState.service}.${ruleState.feature} ${ruleState.operator} ${valueStr}`;

        try {
            // Check if rule exists (Edit Mode) vs Create Mode
            // Since ID is read-only in UI, if it exists in 'rules', it's an edit? 
            // Actually, handleOpenModal generates a NEW ID. handleEdit sets an EXISTING ID.
            // So we can check if formData.rule_id exists in current rules list.
            const isEdit = rules.some(r => r.rule_id === formData.rule_id);

            if (isEdit) {
                await updateRiskRule(formData.rule_id, {
                    ...formData,
                    condition: conditionStr,
                    action: finalActions
                });
            } else {
                await createRiskRule({
                    ...formData,
                    condition: conditionStr,
                    action: finalActions
                });
            }

            setIsModalOpen(false);
            fetchRules();
        } catch (error) {
            console.error("Failed to save rule", error);
            alert("Error saving rule.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Risk Rules</h1>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                    >
                        + Add New Rule
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                        ) : rules.map((row) => (
                            <tr key={row.rule_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.rule_id}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={row.condition}>{row.condition}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{row.action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.priority}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-3">
                                    {/* Toggle Active Status */}
                                    <button
                                        onClick={() => handleToggleStatus(row)}
                                        disabled={user?.role !== 'ADMIN'}
                                        title="Toggle Status"
                                        className={`flex items-center space-x-1 ${user?.role === 'ADMIN' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                    >
                                        {row.is_active ? (
                                            <ToggleRight className="text-green-600 w-6 h-6" />
                                        ) : (
                                            <ToggleLeft className="text-gray-400 w-6 h-6" />
                                        )}
                                    </button>

                                    {/* Edit Button */}
                                    {user?.role === 'ADMIN' && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(row)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit Rule"
                                            >
                                                <Edit size={18} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(row.rule_id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete Rule"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Add New Risk Rule</h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Rule ID (Auto-generated)</label>
                                <input
                                    name="rule_id"
                                    value={formData.rule_id}
                                    readOnly={true}
                                    className="w-full border rounded p-2 bg-gray-200 text-gray-600 font-mono cursor-not-allowed focus:outline-none"
                                />
                            </div>
                            {/* Dynamic Rule Creation Module */}
                            <div className="space-y-3 bg-gray-50 p-4 rounded border">
                                <label className="block text-sm font-bold text-gray-700">Rule Condition Definition</label>

                                {/* Step 1: Service */}
                                <div>
                                    <label className="text-xs text-gray-500">Service</label>
                                    <select
                                        value={ruleState.service}
                                        onChange={(e) => handleRuleChange('service', e.target.value)}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="">Select Service...</option>
                                        {Object.keys(RULE_SCHEMA).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Step 2: Feature */}
                                {ruleState.service && (
                                    <div>
                                        <label className="text-xs text-gray-500">Feature</label>
                                        <select
                                            value={ruleState.feature}
                                            onChange={(e) => handleRuleChange('feature', e.target.value)}
                                            className="w-full border rounded p-2"
                                        >
                                            <option value="">Select Feature...</option>
                                            {RULE_SCHEMA[ruleState.service].features.map(f => (
                                                <option key={f.key} value={f.key}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Step 3: Operator */}
                                {ruleState.feature && (
                                    <div>
                                        <label className="text-xs text-gray-500">Operator</label>
                                        <select
                                            value={ruleState.operator}
                                            onChange={(e) => handleRuleChange('operator', e.target.value)}
                                            className="w-full border rounded p-2"
                                        >
                                            <option value="">Select Operator...</option>
                                            {getOperatorsForFeature().map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Step 4: Value */}
                                {ruleState.operator && (
                                    <div>
                                        <label className="text-xs text-gray-500">Value</label>
                                        {renderValueInput()}
                                    </div>
                                )}

                                {/* Summary Preview */}
                                {ruleState.service && ruleState.feature && ruleState.operator && ruleState.value && (
                                    <div className="mt-2 text-sm text-blue-800 bg-blue-50 p-2 rounded">
                                        <strong>Summary: </strong>
                                        IF {ruleState.service} {getSelectedFeature()?.name} IS {getReadableOperator(ruleState.operator)} {ruleState.value}
                                    </div>
                                )}
                            </div>

                            {/* Actions Selection */}
                            <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Actions Configuration</label>

                                <div className="mb-3">
                                    <label className="text-xs text-gray-500 block mb-1">How many actions?</label>
                                    <select
                                        value={actionCount}
                                        onChange={handleActionCountChange}
                                        className="w-full border rounded p-2"
                                    >
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <option key={n} value={n}>{n} Action{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    {Array.from({ length: actionCount }).map((_, idx) => (
                                        <div key={idx}>
                                            <label className="text-xs text-gray-500 block mb-1">Action #{idx + 1}</label>
                                            <select
                                                required
                                                value={selectedActions[idx]}
                                                onChange={(e) => handleActionSelect(idx, e.target.value)}
                                                className="w-full border rounded p-2 bg-white"
                                            >
                                                <option value="">Select Action Type...</option>
                                                {ACTION_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Priority (1-10)</label>
                                <input
                                    type="number"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    min="1" max="10"
                                    required
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <label className="text-sm font-medium">Active Rule</label>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium transition"
                                >
                                    Save Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskRules;
