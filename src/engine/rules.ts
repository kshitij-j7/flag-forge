import { Attributes, Rule } from '@flagforge/types';

export function matchesRule(rule: Rule, attributes?: Attributes): boolean {
    // rule: { attribute, op, value, variant }
    // attributes: user context object (e.g. { country: "IN", age: 25 })

    // we may have attribute less rules like 'always' in future or another eg: { op: "before_time", value: 1710000000000, variant: "A" }
    if (!attributes) return false; // For now, false for always

    // Extract the user’s value for the rule’s attribute
    // If attribute missing → val = undefined (important for comparisons below)
    const val = attributes[rule.attribute];
    if (val == null) return false;

    switch (rule.op) {
        case 'eq':
            return val === rule.value;
        case 'neq':
            return val !== rule.value;
        case 'contains':
            if (typeof val !== 'string' || typeof rule.value !== 'string') return false;
            return val.includes(rule.value);
        case 'gt': {
            const a = Number(val);
            const b = Number(rule.value);
            if (Number.isNaN(a) || Number.isNaN(b)) return false;
            return a > b;
        }
        case 'lt': {
            const a = Number(val);
            const b = Number(rule.value);
            if (Number.isNaN(a) || Number.isNaN(b)) return false;
            return a < b;
        }
        case 'in':
            if (!Array.isArray(rule.value)) return false;
            return rule.value.some((v) => String(v) === String(val));
        default:
            return false;
    }
}
