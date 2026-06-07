# 7. Joi Validator Cheat Sheet

This is your quick-reference guide for the thesis defense. If the reviewer asks you to **add a rule or customize an error message** for any data type, use this sheet to find the exact error code keys and code templates.

---

## 1. Quick Code Key Lookup

Error keys in Joi follow the pattern: `"{dataType}.{ruleName}"`.

### Strings (`Joi.string()`)
| Validator Rule | Failed Scenario | Error Code Key |
| :--- | :--- | :--- |
| `.required()` | Missing field | `'any.required'` |
| `Joi.string()` | Not a string (e.g., number/object) | `'string.base'` |
| `Joi.string()` | User sent empty string `""` | `'string.empty'` |
| `.min(X)` | Text is too short (less than X chars) | `'string.min'` |
| `.max(X)` | Text is too long (more than X chars) | `'string.max'` |
| `.email()` | Not a valid email format | `'string.email'` |
| `.alphanum()` | Contains symbols/spaces (must be A-Z, 0-9) | `'string.alphanum'` |
| `.pattern(regex)` | Fails matching a regex pattern | `'string.pattern.base'` |

### Numbers (`Joi.number()`)
| Validator Rule | Failed Scenario | Error Code Key |
| :--- | :--- | :--- |
| `Joi.number()` | Not a number (e.g., `"abc"`) | `'number.base'` |
| `.min(X)` | Number is less than X | `'number.min'` |
| `.max(X)` | Number is greater than X | `'number.max'` |
| `.integer()` | Decimals passed (must be whole number) | `'number.integer'` |
| `.positive()` | Number is 0 or negative | `'number.positive'` |

### Arrays (`Joi.array()`)
| Validator Rule | Failed Scenario | Error Code Key |
| :--- | :--- | :--- |
| `Joi.array()` | Not an array (e.g., string) | `'array.base'` |
| `.min(X)` | Array has fewer than X items | `'array.min'` |
| `.max(X)` | Array has more than X items | `'array.max'` |

### Booleans / Dates
| Validator Rule | Failed Scenario | Error Code Key |
| :--- | :--- | :--- |
| `Joi.boolean()` | Not `true` or `false` | `'boolean.base'` |
| `Joi.date()` | Invalid date format | `'date.base'` |

### General Options (`Joi.any()`)
| Validator Rule | Failed Scenario | Error Code Key |
| :--- | :--- | :--- |
| `.valid(a, b, c)` | Value not in the allowed list | `'any.only'` |

---

## 2. Code Templates (Copy-Paste / Memorize)

Here are the exact syntaxes you will need for common tasks.

### Template A: Standard String Field (e.g., `componentName`, `description`)
```typescript
componentName: Joi.string().trim().required().min(3).max(100).messages({
    'string.base': 'Component Name must be a string',
    'string.empty': 'Component Name cannot be empty',
    'string.min': 'Component Name must be at least 3 characters',
    'string.max': 'Component Name cannot exceed 100 characters',
    'any.required': 'Component Name is required'
})
```

### Template B: ID / Code fields (Uppercase & Trimmed)
```typescript
code: Joi.string().uppercase().trim().required().messages({
    'string.empty': 'Code is required',
    'any.required': 'Code is required'
})
```

### Template C: Allowed Dropdown Values (e.g., `unit`, `status`)
```typescript
unit: Joi.string().required().valid('pcs', 'kg', 'm', 'l', 'set').messages({
    'any.only': 'Unit must be one of: pcs, kg, m, l, set',
    'any.required': 'Unit is required'
})
```

### Template D: Quantities / Prices (Positive numbers/decimals)
```typescript
standardCost: Joi.number().min(0).required().messages({
    'number.base': 'Cost must be a valid number',
    'number.min': 'Cost cannot be negative',
    'any.required': 'Cost is required'
})
```

### Template E: Stock Levels / ID references (Whole Numbers)
```typescript
minStockLevel: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Stock level must be a number',
    'number.integer': 'Stock level must be a whole number',
    'number.min': 'Stock level cannot be negative'
})
```

---

## 3. The Chaining Rule

Always put `.messages({...})` at the **very end** of the chain for that field.

❌ **Wrong (TypeScript error):**
```typescript
// Do not chain methods AFTER .messages()
Joi.string().required().messages({ ... }).min(3) 
```

Example of chaining methods in correct order:
```typescript
Joi.string()
  .trim()
  .required()
  .min(3)
  .messages({ ... }) // <--- ALWAYS LAST
```
