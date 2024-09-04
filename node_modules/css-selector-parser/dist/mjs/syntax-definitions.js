var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var emptyXmlOptions = {};
var defaultXmlOptions = { wildcard: true };
export function getXmlOptions(param) {
    if (param) {
        if (typeof param === 'boolean') {
            return defaultXmlOptions;
        }
        else {
            return param;
        }
    }
    else {
        return emptyXmlOptions;
    }
}
function withMigration(migration, merge) {
    return function (base, extension) { return merge(migration(base), migration(extension)); };
}
function withNoNegative(merge) {
    return function (base, extension) {
        var result = merge(base, extension);
        if (!result) {
            throw new Error("Syntax definition cannot be null or undefined.");
        }
        return result;
    };
}
function withPositive(positive, merge) {
    return function (base, extension) {
        if (extension === true) {
            return positive;
        }
        return merge(base === true ? positive : base, extension);
    };
}
function mergeSection(values) {
    return function (base, extension) {
        if (!extension || !base) {
            return extension;
        }
        if (typeof extension !== 'object' || extension === null) {
            throw new Error("Unexpected syntax definition extension type: ".concat(extension, "."));
        }
        var result = __assign({}, base);
        for (var _i = 0, _a = Object.entries(extension); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var mergeSchema = values[key];
            result[key] = mergeSchema(base[key], value);
        }
        return result;
    };
}
function replaceValueIfSpecified(base, extension) {
    if (extension !== undefined) {
        return extension;
    }
    return base;
}
function concatArray(base, extension) {
    if (!extension) {
        return base;
    }
    if (!base) {
        return extension;
    }
    return base.concat(extension);
}
function mergeDefinitions(base, extension) {
    if (!extension) {
        return base;
    }
    if (!base) {
        return extension;
    }
    var result = __assign({}, base);
    for (var _i = 0, _a = Object.entries(extension); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (!value) {
            delete result[key];
            continue;
        }
        var baseValue = base[key];
        if (!baseValue) {
            result[key] = value;
            continue;
        }
        result[key] = baseValue.concat(value);
    }
    return result;
}
export var extendSyntaxDefinition = withNoNegative(mergeSection({
    baseSyntax: replaceValueIfSpecified,
    tag: withPositive(defaultXmlOptions, mergeSection({
        wildcard: replaceValueIfSpecified
    })),
    ids: replaceValueIfSpecified,
    classNames: replaceValueIfSpecified,
    namespace: withPositive(defaultXmlOptions, mergeSection({
        wildcard: replaceValueIfSpecified
    })),
    combinators: concatArray,
    attributes: mergeSection({
        operators: concatArray,
        caseSensitivityModifiers: concatArray,
        unknownCaseSensitivityModifiers: replaceValueIfSpecified
    }),
    pseudoClasses: mergeSection({
        unknown: replaceValueIfSpecified,
        definitions: mergeDefinitions
    }),
    pseudoElements: mergeSection({
        unknown: replaceValueIfSpecified,
        notation: replaceValueIfSpecified,
        definitions: withMigration(function (definitions) { return (Array.isArray(definitions) ? { NoArgument: definitions } : definitions); }, mergeDefinitions)
    })
}));
var css1SyntaxDefinition = {
    tag: {},
    ids: true,
    classNames: true,
    combinators: [],
    pseudoElements: {
        unknown: 'reject',
        notation: 'singleColon',
        definitions: ['first-letter', 'first-line']
    },
    pseudoClasses: {
        unknown: 'reject',
        definitions: {
            NoArgument: ['link', 'visited', 'active']
        }
    }
};
var css2SyntaxDefinition = extendSyntaxDefinition(css1SyntaxDefinition, {
    tag: { wildcard: true },
    combinators: ['>', '+'],
    attributes: {
        unknownCaseSensitivityModifiers: 'reject',
        operators: ['=', '~=', '|=']
    },
    pseudoElements: {
        definitions: ['before', 'after']
    },
    pseudoClasses: {
        unknown: 'reject',
        definitions: {
            NoArgument: ['hover', 'focus', 'first-child'],
            String: ['lang']
        }
    }
});
var selectors3SyntaxDefinition = extendSyntaxDefinition(css2SyntaxDefinition, {
    namespace: {
        wildcard: true
    },
    combinators: ['~'],
    attributes: {
        operators: ['^=', '$=', '*=']
    },
    pseudoElements: {
        notation: 'both'
    },
    pseudoClasses: {
        definitions: {
            NoArgument: [
                'root',
                'last-child',
                'first-of-type',
                'last-of-type',
                'only-child',
                'only-of-type',
                'empty',
                'target',
                'enabled',
                'disabled',
                'checked',
                'indeterminate'
            ],
            Formula: ['nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type'],
            Selector: ['not']
        }
    }
});
var selectors4SyntaxDefinition = extendSyntaxDefinition(selectors3SyntaxDefinition, {
    combinators: ['||'],
    attributes: {
        caseSensitivityModifiers: ['i', 'I', 's', 'S']
    },
    pseudoClasses: {
        definitions: {
            NoArgument: [
                'any-link',
                'local-link',
                'target-within',
                'scope',
                'current',
                'past',
                'future',
                'focus-within',
                'focus-visible',
                'read-write',
                'read-only',
                'placeholder-shown',
                'default',
                'valid',
                'invalid',
                'in-range',
                'out-of-range',
                'required',
                'optional',
                'blank',
                'user-invalid'
            ],
            Formula: ['nth-col', 'nth-last-col'],
            String: ['dir'],
            FormulaOfSelector: ['nth-child', 'nth-last-child'],
            Selector: ['current', 'is', 'where', 'has']
        }
    }
});
var progressiveSyntaxDefinition = extendSyntaxDefinition(selectors4SyntaxDefinition, {
    pseudoElements: {
        unknown: 'accept'
    },
    pseudoClasses: {
        unknown: 'accept'
    },
    attributes: {
        unknownCaseSensitivityModifiers: 'accept'
    }
});
export var cssSyntaxDefinitions = {
    css1: css1SyntaxDefinition,
    css2: css2SyntaxDefinition,
    css3: selectors3SyntaxDefinition,
    'selectors-3': selectors3SyntaxDefinition,
    'selectors-4': selectors4SyntaxDefinition,
    latest: selectors4SyntaxDefinition,
    progressive: progressiveSyntaxDefinition
};
