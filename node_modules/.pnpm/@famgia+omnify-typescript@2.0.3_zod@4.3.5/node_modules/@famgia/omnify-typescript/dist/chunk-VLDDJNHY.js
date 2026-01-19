// src/interface-generator.ts
import { resolveLocalizedString } from "@famgia/omnify-types";
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toLowerCase();
}
var TYPE_MAP = {
  String: "string",
  TinyInt: "number",
  Int: "number",
  BigInt: "number",
  Float: "number",
  Boolean: "boolean",
  Text: "string",
  MediumText: "string",
  LongText: "string",
  Date: "DateString",
  Time: "string",
  DateTime: "DateTimeString",
  Timestamp: "DateTimeString",
  Json: "unknown",
  Email: "string",
  Password: "string",
  Enum: "string",
  Select: "string",
  Lookup: "number"
};
var FILE_INTERFACE_NAME = "File";
var PK_TYPE_MAP = {
  Int: "number",
  BigInt: "number",
  Uuid: "string",
  String: "string"
};
function resolveDisplayName(value, options = {}) {
  if (value === void 0) {
    return void 0;
  }
  return resolveLocalizedString(value, {
    locale: options.locale,
    config: options.localeConfig
  });
}
function toPropertyName(name) {
  return name;
}
function toInterfaceName(schemaName) {
  return schemaName;
}
function getPropertyType(property, _allSchemas) {
  if (property.type === "File") {
    const fileProp = property;
    if (fileProp.multiple) {
      return `${FILE_INTERFACE_NAME}[]`;
    }
    return `${FILE_INTERFACE_NAME} | null`;
  }
  if (property.type === "Association") {
    const assocProp = property;
    const targetName = assocProp.target ?? "unknown";
    switch (assocProp.relation) {
      // Standard relations
      case "OneToOne":
      case "ManyToOne":
        return targetName;
      case "OneToMany":
      case "ManyToMany":
        return `${targetName}[]`;
      // Polymorphic relations
      case "MorphTo":
        if (assocProp.targets && assocProp.targets.length > 0) {
          return assocProp.targets.join(" | ");
        }
        return "unknown";
      case "MorphOne":
        return targetName;
      case "MorphMany":
      case "MorphToMany":
      case "MorphedByMany":
        return `${targetName}[]`;
      default:
        return "unknown";
    }
  }
  if (property.type === "EnumRef") {
    const enumRefProp = property;
    return enumRefProp.enum;
  }
  if (property.type === "Enum") {
    const enumProp = property;
    if (typeof enumProp.enum === "string") {
      return enumProp.enum;
    }
    if (Array.isArray(enumProp.enum)) {
      return enumProp.enum.map((v) => `'${v}'`).join(" | ");
    }
  }
  if (property.type === "Select") {
    const selectProp = property;
    if (selectProp.options && selectProp.options.length > 0) {
      return selectProp.options.map((v) => `'${v}'`).join(" | ");
    }
  }
  return TYPE_MAP[property.type] ?? "unknown";
}
function propertyToTSProperties(propertyName, property, allSchemas, options = {}) {
  const baseProp = property;
  const isReadonly = options.readonly ?? true;
  const displayName = resolveDisplayName(baseProp.displayName, options);
  if (options.customTypes) {
    const customType = options.customTypes.get(property.type);
    if (customType?.compound && customType.expand) {
      const expandedProps = [];
      for (const field of customType.expand) {
        const fieldName = `${propertyName}_${toSnakeCase(field.suffix)}`;
        const fieldOverride = baseProp.fields?.[field.suffix];
        const isNullable = fieldOverride?.nullable ?? field.sql?.nullable ?? baseProp.nullable ?? false;
        const tsType = field.typescript?.type ?? "string";
        expandedProps.push({
          name: fieldName,
          type: tsType,
          optional: isNullable,
          readonly: isReadonly,
          comment: `${displayName ?? propertyName} (${field.suffix})`
        });
      }
      if (customType.accessors) {
        for (const accessor of customType.accessors) {
          const accessorName = `${propertyName}_${toSnakeCase(accessor.name)}`;
          expandedProps.push({
            name: accessorName,
            type: "string | null",
            optional: true,
            readonly: isReadonly,
            comment: `${displayName ?? propertyName} (computed)`
          });
        }
      }
      return expandedProps;
    }
    if (customType && !customType.compound) {
      const tsType = customType.typescript?.type ?? "string";
      return [{
        name: toPropertyName(propertyName),
        type: tsType,
        optional: baseProp.nullable ?? false,
        readonly: isReadonly,
        comment: displayName
      }];
    }
  }
  if (property.type === "Association") {
    const assocProp = property;
    if (assocProp.relation === "MorphTo" && assocProp.targets && assocProp.targets.length > 0) {
      const propBaseName = toPropertyName(propertyName);
      const targetUnion = assocProp.targets.map((t) => `'${t}'`).join(" | ");
      const relationUnion = assocProp.targets.join(" | ");
      return [
        {
          name: `${propBaseName}Type`,
          type: targetUnion,
          optional: true,
          // Polymorphic columns are nullable
          readonly: isReadonly,
          comment: `Polymorphic type for ${propertyName}`
        },
        {
          name: `${propBaseName}Id`,
          type: "number",
          optional: true,
          readonly: isReadonly,
          comment: `Polymorphic ID for ${propertyName}`
        },
        {
          name: propBaseName,
          type: `${relationUnion} | null`,
          optional: true,
          readonly: isReadonly,
          comment: displayName ?? `Polymorphic relation to ${assocProp.targets.join(", ")}`
        }
      ];
    }
  }
  const type = getPropertyType(property, allSchemas);
  return [{
    name: toPropertyName(propertyName),
    type,
    optional: baseProp.nullable ?? false,
    readonly: isReadonly,
    comment: displayName
  }];
}
function propertyToTSProperty(propertyName, property, allSchemas, options = {}) {
  return propertyToTSProperties(propertyName, property, allSchemas, options)[0];
}
function extractTypeReferences(type, allSchemaNames) {
  const primitives = /* @__PURE__ */ new Set(["string", "number", "boolean", "unknown", "null", "undefined", "void", "never", "any"]);
  const refs = [];
  const cleanType = type.replace(/\[\]/g, "").replace(/\s*\|\s*null/g, "");
  const parts = cleanType.split(/\s*\|\s*/);
  for (const part of parts) {
    const trimmed = part.trim().replace(/^['"]|['"]$/g, "");
    if (!primitives.has(trimmed) && allSchemaNames.has(trimmed)) {
      refs.push(trimmed);
    }
  }
  return refs;
}
function schemaToInterface(schema, allSchemas, options = {}) {
  const properties = [];
  const allSchemaNames = new Set(Object.keys(allSchemas).filter((name) => allSchemas[name].kind !== "enum"));
  if (schema.options?.id !== false) {
    const pkType = schema.options?.idType ?? "BigInt";
    properties.push({
      name: "id",
      type: PK_TYPE_MAP[pkType] ?? "number",
      optional: false,
      readonly: options.readonly ?? true,
      comment: "Primary key"
    });
  }
  if (schema.properties) {
    for (const [propName, property] of Object.entries(schema.properties)) {
      properties.push(...propertyToTSProperties(propName, property, allSchemas, options));
    }
  }
  if (schema.options?.timestamps !== false) {
    properties.push(
      {
        name: "created_at",
        type: "DateTimeString",
        optional: true,
        readonly: options.readonly ?? true,
        comment: "Creation timestamp"
      },
      {
        name: "updated_at",
        type: "DateTimeString",
        optional: true,
        readonly: options.readonly ?? true,
        comment: "Last update timestamp"
      }
    );
  }
  if (schema.options?.softDelete) {
    properties.push({
      name: "deleted_at",
      type: "DateTimeString",
      optional: true,
      readonly: options.readonly ?? true,
      comment: "Soft delete timestamp"
    });
  }
  const dependencySet = /* @__PURE__ */ new Set();
  for (const prop of properties) {
    for (const ref of extractTypeReferences(prop.type, allSchemaNames)) {
      if (ref !== schema.name) {
        dependencySet.add(ref);
      }
    }
  }
  const enumDependencySet = /* @__PURE__ */ new Set();
  if (schema.properties) {
    for (const property of Object.values(schema.properties)) {
      if (property.type === "EnumRef") {
        const enumRefProp = property;
        if (enumRefProp.enum) {
          enumDependencySet.add(enumRefProp.enum);
        }
      }
    }
  }
  const schemaDisplayName = resolveDisplayName(schema.displayName, options);
  return {
    name: toInterfaceName(schema.name),
    properties,
    comment: schemaDisplayName ?? schema.name,
    dependencies: dependencySet.size > 0 ? Array.from(dependencySet).sort() : void 0,
    enumDependencies: enumDependencySet.size > 0 ? Array.from(enumDependencySet).sort() : void 0
  };
}
function formatProperty(property) {
  const readonly = property.readonly ? "readonly " : "";
  const optional = property.optional ? "?" : "";
  const comment = property.comment ? `  /** ${property.comment} */
` : "";
  return `${comment}  ${readonly}${property.name}${optional}: ${property.type};`;
}
function formatInterface(iface) {
  const comment = iface.comment ? `/**
 * ${iface.comment}
 */
` : "";
  const extendsClause = iface.extends && iface.extends.length > 0 ? ` extends ${iface.extends.join(", ")}` : "";
  const properties = iface.properties.map(formatProperty).join("\n");
  return `${comment}export interface ${iface.name}${extendsClause} {
${properties}
}`;
}
function generateInterfaces(schemas, options = {}) {
  const interfaces = [];
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") {
      continue;
    }
    if (schema.options?.hidden === true) {
      continue;
    }
    interfaces.push(schemaToInterface(schema, schemas, options));
  }
  return interfaces;
}

// src/enum-generator.ts
import { resolveLocalizedString as resolveLocalizedString2 } from "@famgia/omnify-types";
function resolveDisplayName2(value, options = {}) {
  if (value === void 0) {
    return void 0;
  }
  return resolveLocalizedString2(value, {
    locale: options.locale,
    config: options.localeConfig
  });
}
function toPascalCase(value) {
  const normalized = value.replace(/([a-z])([A-Z])/g, "$1_$2");
  return normalized.split(/[-_\s]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
}
function toEnumMemberName(value) {
  let result = value.split(/[-_\s]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("").replace(/[^a-zA-Z0-9]/g, "");
  if (/^\d/.test(result)) {
    result = "_" + result;
  }
  return result;
}
function toEnumName(schemaName) {
  return schemaName;
}
function parseEnumValue(value, options = {}) {
  if (typeof value === "string") {
    return {
      name: toEnumMemberName(value),
      value
      // No label or extra - will fallback to value
    };
  }
  let label;
  if (value.label !== void 0) {
    if (options.multiLocale && typeof value.label === "object") {
      label = value.label;
    } else {
      label = resolveDisplayName2(value.label, options);
    }
  }
  return {
    name: toEnumMemberName(value.value),
    value: value.value,
    label,
    extra: value.extra
  };
}
function schemaToEnum(schema, options = {}) {
  if (schema.kind !== "enum" || !schema.values) {
    return null;
  }
  const values = schema.values.map(
    (value) => parseEnumValue(value, options)
  );
  const displayName = resolveDisplayName2(schema.displayName, options);
  return {
    name: toEnumName(schema.name),
    values,
    comment: displayName ?? schema.name
  };
}
function generateEnums(schemas, options = {}) {
  const enums = [];
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") {
      const enumDef = schemaToEnum(schema, options);
      if (enumDef) {
        enums.push(enumDef);
      }
    }
  }
  return enums;
}
function pluginEnumToTSEnum(enumDef, options = {}) {
  const values = enumDef.values.map((v) => {
    let label;
    if (v.label !== void 0) {
      if (typeof v.label === "string") {
        label = v.label;
      } else if (options.multiLocale) {
        label = v.label;
      } else {
        label = resolveDisplayName2(v.label, options);
      }
    }
    return {
      name: toEnumMemberName(v.value),
      value: v.value,
      label,
      extra: v.extra
    };
  });
  let comment;
  if (enumDef.displayName !== void 0) {
    if (typeof enumDef.displayName === "string") {
      comment = enumDef.displayName;
    } else {
      comment = resolveDisplayName2(enumDef.displayName, options);
    }
  }
  return {
    name: enumDef.name,
    values,
    comment: comment ?? enumDef.name
  };
}
function generatePluginEnums(pluginEnums, options = {}) {
  const enums = [];
  for (const enumDef of pluginEnums.values()) {
    enums.push(pluginEnumToTSEnum(enumDef, options));
  }
  return enums;
}
function isMultiLocaleLabel(label) {
  return label !== void 0 && typeof label === "object";
}
function formatEnum(enumDef) {
  const { name, values, comment } = enumDef;
  const parts = [];
  if (comment) {
    parts.push(`/**
 * ${comment}
 */
`);
  }
  const enumValues = values.map((v) => `  ${v.name} = '${v.value}',`).join("\n");
  parts.push(`export enum ${name} {
${enumValues}
}

`);
  parts.push(`/** All ${name} values */
`);
  parts.push(`export const ${name}Values = Object.values(${name}) as ${name}[];

`);
  parts.push(`/** Type guard for ${name} */
`);
  parts.push(`export function is${name}(value: unknown): value is ${name} {
`);
  parts.push(`  return ${name}Values.includes(value as ${name});
`);
  parts.push(`}

`);
  const hasLabels = values.some((v) => v.label !== void 0);
  const hasMultiLocale = values.some((v) => isMultiLocaleLabel(v.label));
  if (hasLabels) {
    if (hasMultiLocale) {
      const labelEntries = values.filter((v) => v.label !== void 0).map((v) => {
        if (isMultiLocaleLabel(v.label)) {
          const locales = Object.entries(v.label).map(([locale, text]) => `'${locale}': '${escapeString(text)}'`).join(", ");
          return `  [${name}.${v.name}]: { ${locales} },`;
        }
        return `  [${name}.${v.name}]: { default: '${escapeString(String(v.label))}' },`;
      }).join("\n");
      parts.push(`const ${lowerFirst(name)}Labels: Partial<Record<${name}, Record<string, string>>> = {
${labelEntries}
};

`);
      parts.push(`/** Get label for ${name} value with locale support */
`);
      parts.push(`export function get${name}Label(value: ${name}, locale?: string): string {
`);
      parts.push(`  const labels = ${lowerFirst(name)}Labels[value];
`);
      parts.push(`  if (!labels) return value;
`);
      parts.push(`  if (locale && labels[locale]) return labels[locale];
`);
      parts.push(`  // Fallback: ja \u2192 en \u2192 first available
`);
      parts.push(`  return labels['ja'] ?? labels['en'] ?? Object.values(labels)[0] ?? value;
`);
      parts.push(`}

`);
    } else {
      const labelEntries = values.filter((v) => v.label !== void 0).map((v) => `  [${name}.${v.name}]: '${escapeString(String(v.label))}',`).join("\n");
      parts.push(`const ${lowerFirst(name)}Labels: Partial<Record<${name}, string>> = {
${labelEntries}
};

`);
      parts.push(`/** Get label for ${name} value (fallback to value if no label) */
`);
      parts.push(`export function get${name}Label(value: ${name}): string {
`);
      parts.push(`  return ${lowerFirst(name)}Labels[value] ?? value;
`);
      parts.push(`}

`);
    }
  } else {
    parts.push(`/** Get label for ${name} value (returns value as-is) */
`);
    parts.push(`export function get${name}Label(value: ${name}): string {
`);
    parts.push(`  return value;
`);
    parts.push(`}

`);
  }
  const hasExtra = values.some((v) => v.extra !== void 0);
  if (hasExtra) {
    const extraEntries = values.filter((v) => v.extra !== void 0).map((v) => `  [${name}.${v.name}]: ${JSON.stringify(v.extra)},`).join("\n");
    parts.push(`const ${lowerFirst(name)}Extra: Partial<Record<${name}, Record<string, unknown>>> = {
${extraEntries}
};

`);
    parts.push(`/** Get extra metadata for ${name} value (undefined if not defined) */
`);
    parts.push(`export function get${name}Extra(value: ${name}): Record<string, unknown> | undefined {
`);
    parts.push(`  return ${lowerFirst(name)}Extra[value];
`);
    parts.push(`}`);
  } else {
    parts.push(`/** Get extra metadata for ${name} value (undefined if not defined) */
`);
    parts.push(`export function get${name}Extra(_value: ${name}): Record<string, unknown> | undefined {
`);
    parts.push(`  return undefined;
`);
    parts.push(`}`);
  }
  return parts.join("");
}
function lowerFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
function escapeString(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function enumToUnionType(enumDef) {
  const type = enumDef.values.map((v) => `'${v.value}'`).join(" | ");
  return {
    name: enumDef.name,
    type,
    comment: enumDef.comment
  };
}
function formatTypeAlias(alias) {
  const { name, type, comment } = alias;
  const parts = [];
  if (comment) {
    parts.push(`/**
 * ${comment}
 */
`);
  }
  parts.push(`export type ${name} = ${type};

`);
  const values = type.split(" | ").map((v) => v.trim());
  parts.push(`/** All ${name} values */
`);
  parts.push(`export const ${name}Values: ${name}[] = [${values.join(", ")}];

`);
  parts.push(`/** Type guard for ${name} */
`);
  parts.push(`export function is${name}(value: unknown): value is ${name} {
`);
  parts.push(`  return ${name}Values.includes(value as ${name});
`);
  parts.push(`}

`);
  parts.push(`/** Get label for ${name} value (returns value as-is) */
`);
  parts.push(`export function get${name}Label(value: ${name}): string {
`);
  parts.push(`  return value;
`);
  parts.push(`}

`);
  parts.push(`/** Get extra metadata for ${name} value (always undefined for type aliases) */
`);
  parts.push(`export function get${name}Extra(_value: ${name}): Record<string, unknown> | undefined {
`);
  parts.push(`  return undefined;
`);
  parts.push(`}`);
  return parts.join("");
}
function extractInlineEnums(schemas, options = {}) {
  const results = [];
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum" || !schema.properties) {
      continue;
    }
    for (const [propName, property] of Object.entries(schema.properties)) {
      if (property.type === "Enum") {
        const enumProp = property;
        if (Array.isArray(enumProp.enum) && enumProp.enum.length > 0) {
          const typeName = `${schema.name}${toPascalCase(propName)}`;
          const displayName = resolveDisplayName2(enumProp.displayName, options);
          const hasLabels = enumProp.enum.some((v) => typeof v !== "string" && v.label !== void 0);
          if (hasLabels) {
            const values = enumProp.enum.map((v) => parseEnumValue(v, options));
            results.push({
              enum: {
                name: typeName,
                values,
                comment: displayName ?? `${schema.name} ${propName} enum`
              }
            });
          } else {
            const values = enumProp.enum.map(
              (v) => typeof v === "string" ? v : v.value
            );
            results.push({
              typeAlias: {
                name: typeName,
                type: values.map((v) => `'${v}'`).join(" | "),
                comment: displayName ?? `${schema.name} ${propName} enum`
              }
            });
          }
        }
      }
      if (property.type === "Select") {
        const selectProp = property;
        if (selectProp.options && selectProp.options.length > 0) {
          const typeName = `${schema.name}${toPascalCase(propName)}`;
          const displayName = resolveDisplayName2(selectProp.displayName, options);
          const hasLabels = selectProp.options.some((v) => typeof v !== "string" && v.label !== void 0);
          if (hasLabels) {
            const values = selectProp.options.map((v) => parseEnumValue(v, options));
            results.push({
              enum: {
                name: typeName,
                values,
                comment: displayName ?? `${schema.name} ${propName} options`
              }
            });
          } else {
            const values = selectProp.options.map(
              (v) => typeof v === "string" ? v : v.value
            );
            results.push({
              typeAlias: {
                name: typeName,
                type: values.map((v) => `'${v}'`).join(" | "),
                comment: displayName ?? `${schema.name} ${propName} options`
              }
            });
          }
        }
      }
    }
  }
  return results;
}

// src/validation-templates.ts
var DEFAULT_VALIDATION_TEMPLATES = {
  required: {
    ja: "${displayName}\u306F\u5FC5\u9808\u3067\u3059",
    en: "${displayName} is required",
    vi: "${displayName} l\xE0 b\u1EAFt bu\u1ED9c",
    ko: "${displayName}\uC740(\uB294) \uD544\uC218\uC785\uB2C8\uB2E4",
    zh: "${displayName}\u4E3A\u5FC5\u586B\u9879"
  },
  minLength: {
    ja: "${displayName}\u306F${min}\u6587\u5B57\u4EE5\u4E0A\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    en: "${displayName} must be at least ${min} characters",
    vi: "${displayName} ph\u1EA3i c\xF3 \xEDt nh\u1EA5t ${min} k\xFD t\u1EF1",
    ko: "${displayName}\uC740(\uB294) ${min}\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4",
    zh: "${displayName}\u81F3\u5C11\u9700\u8981${min}\u4E2A\u5B57\u7B26"
  },
  maxLength: {
    ja: "${displayName}\u306F${max}\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    en: "${displayName} must be at most ${max} characters",
    vi: "${displayName} t\u1ED1i \u0111a ${max} k\xFD t\u1EF1",
    ko: "${displayName}\uC740(\uB294) ${max}\uC790 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4",
    zh: "${displayName}\u4E0D\u80FD\u8D85\u8FC7${max}\u4E2A\u5B57\u7B26"
  },
  min: {
    ja: "${displayName}\u306F${min}\u4EE5\u4E0A\u306E\u5024\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    en: "${displayName} must be at least ${min}",
    vi: "${displayName} ph\u1EA3i l\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng ${min}",
    ko: "${displayName}\uC740(\uB294) ${min} \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4",
    zh: "${displayName}\u4E0D\u80FD\u5C0F\u4E8E${min}"
  },
  max: {
    ja: "${displayName}\u306F${max}\u4EE5\u4E0B\u306E\u5024\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    en: "${displayName} must be at most ${max}",
    vi: "${displayName} ph\u1EA3i nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng ${max}",
    ko: "${displayName}\uC740(\uB294) ${max} \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4",
    zh: "${displayName}\u4E0D\u80FD\u5927\u4E8E${max}"
  },
  email: {
    ja: "${displayName}\u306E\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093",
    en: "${displayName} is not a valid email address",
    vi: "${displayName} kh\xF4ng ph\u1EA3i l\xE0 \u0111\u1ECBa ch\u1EC9 email h\u1EE3p l\u1EC7",
    ko: "${displayName} \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
    zh: "${displayName}\u4E0D\u662F\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740"
  },
  url: {
    ja: "${displayName}\u306F\u6709\u52B9\u306AURL\u3067\u306F\u3042\u308A\u307E\u305B\u3093",
    en: "${displayName} is not a valid URL",
    vi: "${displayName} kh\xF4ng ph\u1EA3i l\xE0 URL h\u1EE3p l\u1EC7",
    ko: "${displayName}\uC740(\uB294) \uC720\uD6A8\uD55C URL\uC774 \uC544\uB2D9\uB2C8\uB2E4",
    zh: "${displayName}\u4E0D\u662F\u6709\u6548\u7684URL"
  },
  pattern: {
    ja: "${displayName}\u306E\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093",
    en: "${displayName} format is invalid",
    vi: "${displayName} kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng",
    ko: "${displayName} \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
    zh: "${displayName}\u683C\u5F0F\u4E0D\u6B63\u786E"
  },
  enum: {
    ja: "${displayName}\u306E\u5024\u304C\u7121\u52B9\u3067\u3059",
    en: "${displayName} has an invalid value",
    vi: "${displayName} c\xF3 gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7",
    ko: "${displayName} \uAC12\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
    zh: "${displayName}\u7684\u503C\u65E0\u6548"
  }
};
function mergeValidationTemplates(userTemplates) {
  if (!userTemplates) {
    return DEFAULT_VALIDATION_TEMPLATES;
  }
  const merged = {
    required: { ...DEFAULT_VALIDATION_TEMPLATES.required },
    minLength: { ...DEFAULT_VALIDATION_TEMPLATES.minLength },
    maxLength: { ...DEFAULT_VALIDATION_TEMPLATES.maxLength },
    min: { ...DEFAULT_VALIDATION_TEMPLATES.min },
    max: { ...DEFAULT_VALIDATION_TEMPLATES.max },
    email: { ...DEFAULT_VALIDATION_TEMPLATES.email },
    url: { ...DEFAULT_VALIDATION_TEMPLATES.url },
    pattern: { ...DEFAULT_VALIDATION_TEMPLATES.pattern },
    enum: { ...DEFAULT_VALIDATION_TEMPLATES.enum }
  };
  for (const [key, value] of Object.entries(userTemplates)) {
    if (value && key in merged) {
      merged[key] = {
        ...merged[key],
        ...value
      };
    }
  }
  return merged;
}
function formatValidationMessage(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value));
  }
  return result;
}
function getValidationMessages(templates, ruleType, locales, vars, fallbackLocale) {
  const ruleTemplates = templates[ruleType];
  const messages = {};
  for (const locale of locales) {
    const template = ruleTemplates[locale] ?? (fallbackLocale ? ruleTemplates[fallbackLocale] : void 0) ?? ruleTemplates["en"] ?? "";
    messages[locale] = formatValidationMessage(template, vars);
  }
  return messages;
}

// src/rules-generator.ts
function getMultiLocaleDisplayName(value, locales, fallbackLocale, defaultValue) {
  if (!value) {
    const result2 = {};
    for (const locale of locales) {
      result2[locale] = defaultValue;
    }
    return result2;
  }
  if (typeof value === "string") {
    const result2 = {};
    for (const locale of locales) {
      result2[locale] = value;
    }
    return result2;
  }
  const result = {};
  for (const locale of locales) {
    result[locale] = value[locale] ?? value[fallbackLocale] ?? value["en"] ?? defaultValue;
  }
  return result;
}
function generatePropertyRules(propName, property, displayName, locales, fallbackLocale, templates) {
  const rules = [];
  const propDef = property;
  if (!propDef.nullable) {
    rules.push({
      required: true,
      message: getValidationMessages(templates, "required", locales, { displayName: "${displayName}" }, fallbackLocale)
    });
  }
  if (property.type === "Email") {
    rules.push({
      type: "email",
      message: getValidationMessages(templates, "email", locales, { displayName: "${displayName}" }, fallbackLocale)
    });
  }
  if (property.type === "String" || property.type === "Text" || property.type === "LongText") {
    if (propDef.minLength) {
      rules.push({
        min: propDef.minLength,
        message: getValidationMessages(templates, "minLength", locales, { displayName: "${displayName}", min: propDef.minLength }, fallbackLocale)
      });
    }
    if (propDef.maxLength || propDef.length) {
      const max = propDef.maxLength ?? propDef.length;
      rules.push({
        max,
        message: getValidationMessages(templates, "maxLength", locales, { displayName: "${displayName}", max }, fallbackLocale)
      });
    }
  }
  if (property.type === "Int" || property.type === "BigInt" || property.type === "Float") {
    if (propDef.min !== void 0) {
      rules.push({
        type: property.type === "Float" ? "number" : "integer",
        min: propDef.min,
        message: getValidationMessages(templates, "min", locales, { displayName: "${displayName}", min: propDef.min }, fallbackLocale)
      });
    }
    if (propDef.max !== void 0) {
      rules.push({
        type: property.type === "Float" ? "number" : "integer",
        max: propDef.max,
        message: getValidationMessages(templates, "max", locales, { displayName: "${displayName}", max: propDef.max }, fallbackLocale)
      });
    }
  }
  if (propDef.pattern) {
    rules.push({
      pattern: propDef.pattern,
      message: getValidationMessages(templates, "pattern", locales, { displayName: "${displayName}" }, fallbackLocale)
    });
  }
  for (const rule of rules) {
    const newMessage = {};
    for (const locale of locales) {
      const msg = rule.message[locale];
      if (msg) {
        newMessage[locale] = msg.replace(/\$\{displayName\}/g, displayName[locale] ?? propName);
      }
    }
    rule.message = newMessage;
  }
  return rules;
}
function generateModelRules(schema, locales, fallbackLocale, templates) {
  const modelDisplayName = getMultiLocaleDisplayName(
    schema.displayName,
    locales,
    fallbackLocale,
    schema.name
  );
  const properties = {};
  if (schema.properties) {
    for (const [propName, property] of Object.entries(schema.properties)) {
      const propDef = property;
      const displayName = getMultiLocaleDisplayName(
        propDef.displayName,
        locales,
        fallbackLocale,
        propName
      );
      properties[propName] = {
        displayName,
        rules: generatePropertyRules(propName, property, displayName, locales, fallbackLocale, templates)
      };
    }
  }
  return {
    displayName: modelDisplayName,
    properties
  };
}
function getImportExt(options) {
  return options.useJsExtension ? ".js" : "";
}
function formatRulesFile(schemaName, rules, options) {
  const parts = [];
  const ext = getImportExt(options);
  parts.push(`/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * Auto-generated validation rules and metadata for ${schemaName}.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 */

import type { LocaleMap, ValidationRule } from '../common${ext}';

`);
  parts.push(`/** Display name for ${schemaName} */
`);
  parts.push(`export const ${schemaName}DisplayName: LocaleMap = ${JSON.stringify(rules.displayName, null, 2)};

`);
  parts.push(`/** Property display names for ${schemaName} */
`);
  parts.push(`export const ${schemaName}PropertyDisplayNames: Record<string, LocaleMap> = {
`);
  for (const [propName, propRules] of Object.entries(rules.properties)) {
    parts.push(`  ${propName}: ${JSON.stringify(propRules.displayName)},
`);
  }
  parts.push(`};

`);
  parts.push(`/** Validation rules for ${schemaName} (Ant Design compatible) */
`);
  parts.push(`export const ${schemaName}Rules: Record<string, ValidationRule[]> = {
`);
  for (const [propName, propRules] of Object.entries(rules.properties)) {
    if (propRules.rules.length > 0) {
      parts.push(`  ${propName}: [
`);
      for (const rule of propRules.rules) {
        const ruleObj = {};
        if (rule.required) ruleObj.required = true;
        if (rule.type) ruleObj.type = `'${rule.type}'`;
        if (rule.min !== void 0) ruleObj.min = rule.min;
        if (rule.max !== void 0) ruleObj.max = rule.max;
        if (rule.pattern) ruleObj.pattern = `/${rule.pattern}/`;
        ruleObj.message = rule.message;
        const ruleStr = Object.entries(ruleObj).map(([k, v]) => {
          if (k === "type") return `${k}: ${v}`;
          if (k === "pattern") return `${k}: ${v}`;
          return `${k}: ${JSON.stringify(v)}`;
        }).join(", ");
        parts.push(`    { ${ruleStr} },
`);
      }
      parts.push(`  ],
`);
    }
  }
  parts.push(`};

`);
  parts.push(`/** Get validation rules with messages for a specific locale */
`);
  parts.push(`export function get${schemaName}Rules(locale: string): Record<string, Array<{ required?: boolean; type?: string; min?: number; max?: number; pattern?: RegExp; message: string }>> {
  const result: Record<string, Array<{ required?: boolean; type?: string; min?: number; max?: number; pattern?: RegExp; message: string }>> = {};
  for (const [prop, rules] of Object.entries(${schemaName}Rules)) {
    result[prop] = rules.map(rule => ({
      ...rule,
      message: rule.message[locale] ?? rule.message['en'] ?? '',
    }));
  }
  return result;
}

`);
  parts.push(`/** Get display name for a specific locale */
`);
  parts.push(`export function get${schemaName}DisplayName(locale: string): string {
  return ${schemaName}DisplayName[locale] ?? ${schemaName}DisplayName['en'] ?? '${schemaName}';
}

`);
  parts.push(`/** Get property display name for a specific locale */
`);
  parts.push(`export function get${schemaName}PropertyDisplayName(property: string, locale: string): string {
  const names = ${schemaName}PropertyDisplayNames[property];
  return names?.[locale] ?? names?.['en'] ?? property;
}
`);
  return parts.join("");
}
function generateRulesFiles(schemas, options = {}) {
  const files = [];
  const localeConfig = options.localeConfig;
  const locales = [...localeConfig?.locales ?? ["en"]];
  const fallbackLocale = localeConfig?.fallbackLocale ?? "en";
  const templates = mergeValidationTemplates(options.validationTemplates);
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") continue;
    if (schema.options?.hidden === true) continue;
    const rules = generateModelRules(schema, locales, fallbackLocale, templates);
    const content = formatRulesFile(schema.name, rules, options);
    files.push({
      filePath: `rules/${schema.name}.rules.ts`,
      content,
      types: [`${schema.name}Rules`, `${schema.name}DisplayName`],
      overwrite: true
    });
  }
  return files;
}

// src/zod-generator.ts
function getMultiLocaleDisplayName2(value, locales, fallbackLocale, defaultValue) {
  if (!value) {
    const result2 = {};
    for (const locale of locales) {
      result2[locale] = defaultValue;
    }
    return result2;
  }
  if (typeof value === "string") {
    const result2 = {};
    for (const locale of locales) {
      result2[locale] = value;
    }
    return result2;
  }
  const result = {};
  for (const locale of locales) {
    result[locale] = value[locale] ?? value[fallbackLocale] ?? value["en"] ?? defaultValue;
  }
  return result;
}
function applyValidationRules(schema, rules, propType) {
  if (!rules) return schema;
  let result = schema;
  if (rules.url) {
    result = "z.string().url()";
  } else if (rules.uuid) {
    result = "z.string().uuid()";
  } else if (rules.ip) {
    result = "z.string().ip()";
  } else if (rules.ipv4) {
    result = 'z.string().ip({ version: "v4" })';
  } else if (rules.ipv6) {
    result = 'z.string().ip({ version: "v6" })';
  }
  const isStringType = ["String", "Text", "MediumText", "LongText", "Password", "Email"].includes(propType);
  if (isStringType) {
    if (rules.minLength !== void 0) {
      result += `.min(${rules.minLength})`;
    }
    if (rules.maxLength !== void 0) {
      result += `.max(${rules.maxLength})`;
    }
  }
  if (isStringType) {
    if (rules.alpha) {
      result += `.regex(/^[a-zA-Z]*$/, { message: 'Must contain only letters' })`;
    }
    if (rules.alphaNum) {
      result += `.regex(/^[a-zA-Z0-9]*$/, { message: 'Must contain only letters and numbers' })`;
    }
    if (rules.alphaDash) {
      result += `.regex(/^[a-zA-Z0-9_-]*$/, { message: 'Must contain only letters, numbers, dashes, and underscores' })`;
    }
    if (rules.numeric) {
      result += `.regex(/^\\d*$/, { message: 'Must contain only numbers' })`;
    }
    if (rules.digits !== void 0) {
      result += `.length(${rules.digits}).regex(/^\\d+$/, { message: 'Must be exactly ${rules.digits} digits' })`;
    }
    if (rules.digitsBetween) {
      const [min, max] = rules.digitsBetween;
      result += `.min(${min}).max(${max}).regex(/^\\d+$/, { message: 'Must be ${min}-${max} digits' })`;
    }
    if (rules.startsWith) {
      const prefixes = Array.isArray(rules.startsWith) ? rules.startsWith : [rules.startsWith];
      const validPrefixes = prefixes.filter((p) => p.length > 0);
      if (validPrefixes.length === 1) {
        result += `.startsWith('${validPrefixes[0]}')`;
      } else if (validPrefixes.length > 1) {
        const regex = validPrefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        result += `.regex(/^(${regex})/, { message: 'Must start with: ${validPrefixes.join(", ")}' })`;
      }
    }
    if (rules.endsWith) {
      const suffixes = Array.isArray(rules.endsWith) ? rules.endsWith : [rules.endsWith];
      const validSuffixes = suffixes.filter((s) => s.length > 0);
      if (validSuffixes.length === 1) {
        result += `.endsWith('${validSuffixes[0]}')`;
      } else if (validSuffixes.length > 1) {
        const regex = validSuffixes.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        result += `.regex(/(${regex})$/, { message: 'Must end with: ${validSuffixes.join(", ")}' })`;
      }
    }
    if (rules.lowercase) {
      result += `.refine(v => v === v.toLowerCase(), { message: 'Must be lowercase' })`;
    }
    if (rules.uppercase) {
      result += `.refine(v => v === v.toUpperCase(), { message: 'Must be uppercase' })`;
    }
  }
  if (propType === "Int" || propType === "TinyInt" || propType === "BigInt" || propType === "Float") {
    if (rules.min !== void 0) {
      result += `.gte(${rules.min})`;
    }
    if (rules.max !== void 0) {
      result += `.lte(${rules.max})`;
    }
    if (rules.between) {
      const [min, max] = rules.between;
      result += `.gte(${min}).lte(${max})`;
    }
    if (rules.gt !== void 0) {
      result += `.gt(${rules.gt})`;
    }
    if (rules.lt !== void 0) {
      result += `.lt(${rules.lt})`;
    }
    if (rules.multipleOf !== void 0) {
      result += `.multipleOf(${rules.multipleOf})`;
    }
  }
  return result;
}
function getZodSchemaForType(propDef, fieldName, customTypes) {
  const def = propDef;
  const isNullable = def.nullable ?? false;
  let schema = "";
  if (customTypes) {
    const customType = customTypes.get(propDef.type);
    if (customType && !customType.compound) {
      const sqlType = customType.sql?.sqlType || "VARCHAR";
      schema = "z.string()";
      if (customType.sql?.length) {
        schema += `.max(${customType.sql.length})`;
      }
      if (isNullable) {
        schema += ".optional().nullable()";
      }
      return schema;
    }
  }
  switch (propDef.type) {
    case "String":
    case "Text":
    case "MediumText":
    case "LongText":
    case "Password":
      schema = "z.string()";
      if (!isNullable) {
        schema += ".min(1)";
      }
      if (def.maxLength || def.length) {
        schema += `.max(${def.maxLength ?? def.length})`;
      }
      if (def.minLength && def.minLength > 1) {
        schema = schema.replace(".min(1)", `.min(${def.minLength})`);
      }
      break;
    case "Email":
      schema = "z.string().email()";
      if (def.maxLength || def.length) {
        schema += `.max(${def.maxLength ?? def.length ?? 255})`;
      }
      break;
    case "TinyInt":
    case "Int":
    case "BigInt":
      schema = "z.number().int()";
      if (def.min !== void 0) {
        schema += `.gte(${def.min})`;
      }
      if (def.max !== void 0) {
        schema += `.lte(${def.max})`;
      }
      break;
    case "Float":
      schema = "z.number()";
      if (def.min !== void 0) {
        schema += `.gte(${def.min})`;
      }
      if (def.max !== void 0) {
        schema += `.lte(${def.max})`;
      }
      break;
    case "Boolean":
      schema = "z.boolean()";
      break;
    case "Date":
      schema = "z.string().date()";
      break;
    case "DateTime":
    case "Timestamp":
      schema = "z.string().datetime({ offset: true })";
      break;
    case "Time":
      schema = "z.string().time()";
      break;
    case "Json":
      schema = "z.unknown()";
      break;
    case "EnumRef":
      if (typeof def.enum === "string") {
        schema = `z.nativeEnum(${def.enum})`;
      } else {
        schema = "z.string()";
      }
      break;
    case "Enum":
      if (typeof def.enum === "string") {
        schema = `${def.enum}Schema`;
      } else if (Array.isArray(def.enum)) {
        const values = def.enum.map((v) => `'${v}'`).join(", ");
        schema = `z.enum([${values}])`;
      } else {
        schema = "z.string()";
      }
      break;
    case "Select":
      if (def.options && def.options.length > 0) {
        const values = def.options.map((v) => `'${v}'`).join(", ");
        schema = `z.enum([${values}])`;
      } else {
        schema = "z.string()";
      }
      break;
    case "Lookup":
      schema = "z.number().int().positive()";
      break;
    case "Association":
      return "";
    case "File":
      return "";
    default:
      schema = "z.string()";
  }
  if (def.rules && schema) {
    schema = applyValidationRules(schema, def.rules, propDef.type);
  }
  if (isNullable && schema) {
    schema += ".optional().nullable()";
  }
  if (def.pattern && schema) {
    schema += `.regex(/${def.pattern}/)`;
  }
  return schema;
}
function generateCompoundTypeSchemas(propName, propDef, customType, options) {
  const schemas = [];
  const propFields = propDef.fields;
  const locales = options.localeConfig?.locales ?? ["en"];
  const fallbackLocale = options.localeConfig?.fallbackLocale ?? "en";
  if (!customType.expand) return schemas;
  for (const field of customType.expand) {
    const fieldName = `${toSnakeCase(propName)}_${toSnakeCase(field.suffix)}`;
    const fieldOverride = propFields?.[field.suffix];
    const isNullable = fieldOverride?.nullable ?? field.sql?.nullable ?? propDef.nullable ?? false;
    const pluginRules = field.rules;
    const overrideRules = fieldOverride?.rules;
    const length = fieldOverride?.length ?? overrideRules?.maxLength ?? pluginRules?.maxLength ?? field.sql?.length;
    const minLength = overrideRules?.minLength ?? pluginRules?.minLength;
    const pattern = overrideRules?.pattern ?? pluginRules?.pattern;
    const format = overrideRules?.format ?? pluginRules?.format;
    let schema = "z.string()";
    if (format === "email") {
      schema = "z.string().email()";
    } else if (format === "url") {
      schema = "z.string().url()";
    } else if (format === "phone") {
      schema = "z.string()";
    } else if (format === "postal_code") {
      schema = `z.string().regex(/^\\d{3}-?\\d{4}$/)`;
    }
    if (!isNullable) {
      const min = minLength ?? 1;
      schema += `.min(${min})`;
    } else if (minLength) {
      schema += `.min(${minLength})`;
    }
    if (length) {
      schema += `.max(${length})`;
    }
    if (pattern && !format) {
      schema += `.regex(/${pattern}/)`;
    }
    if (isNullable) {
      schema += ".optional().nullable()";
    }
    const propDisplayName = getMultiLocaleDisplayName2(
      propDef.displayName,
      locales,
      fallbackLocale,
      propName
    );
    schemas.push({
      fieldName,
      schema,
      inCreate: true,
      inUpdate: true,
      comment: `${propDisplayName["en"] ?? propName} (${field.suffix})`
    });
  }
  return schemas;
}
function generateZodSchemas(schema, options) {
  const schemas = [];
  const customTypes = options.customTypes;
  if (!schema.properties) return schemas;
  for (const [propName, propDef] of Object.entries(schema.properties)) {
    if (customTypes) {
      const customType = customTypes.get(propDef.type);
      if (customType?.compound) {
        schemas.push(...generateCompoundTypeSchemas(propName, propDef, customType, options));
        continue;
      }
    }
    const zodSchema = getZodSchemaForType(propDef, propName, customTypes);
    if (!zodSchema) continue;
    const fieldName = toSnakeCase(propName);
    schemas.push({
      fieldName,
      schema: zodSchema,
      inCreate: true,
      inUpdate: true,
      comment: void 0
    });
  }
  return schemas;
}
function generateDisplayNames(schema, options) {
  const locales = options.localeConfig?.locales ?? ["en"];
  const fallbackLocale = options.localeConfig?.fallbackLocale ?? "en";
  const customTypes = options.customTypes;
  const displayName = getMultiLocaleDisplayName2(
    schema.displayName,
    locales,
    fallbackLocale,
    schema.name
  );
  const propertyDisplayNames = {};
  const propertyPlaceholders = {};
  if (schema.properties) {
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      const prop = propDef;
      const fieldName = toSnakeCase(propName);
      if (customTypes) {
        const customType = customTypes.get(propDef.type);
        if (customType?.compound && customType.expand) {
          if (prop.displayName) {
            propertyDisplayNames[fieldName] = getMultiLocaleDisplayName2(
              prop.displayName,
              locales,
              fallbackLocale,
              propName
            );
          }
          for (const field of customType.expand) {
            const expandedFieldName = `${fieldName}_${toSnakeCase(field.suffix)}`;
            const fieldOverride = prop.fields?.[field.suffix];
            const labelSource = fieldOverride?.displayName ?? field.label;
            if (labelSource) {
              propertyDisplayNames[expandedFieldName] = getMultiLocaleDisplayName2(
                labelSource,
                locales,
                fallbackLocale,
                field.suffix
              );
            } else {
              propertyDisplayNames[expandedFieldName] = getMultiLocaleDisplayName2(
                prop.displayName,
                locales,
                fallbackLocale,
                propName
              );
              for (const locale of locales) {
                propertyDisplayNames[expandedFieldName] = {
                  ...propertyDisplayNames[expandedFieldName],
                  [locale]: `${propertyDisplayNames[expandedFieldName][locale]} (${field.suffix})`
                };
              }
            }
            const placeholderSource = fieldOverride?.placeholder ?? field.placeholder;
            if (placeholderSource) {
              propertyPlaceholders[expandedFieldName] = getMultiLocaleDisplayName2(
                placeholderSource,
                locales,
                fallbackLocale,
                ""
              );
            }
          }
          continue;
        }
      }
      propertyDisplayNames[fieldName] = getMultiLocaleDisplayName2(
        prop.displayName,
        locales,
        fallbackLocale,
        propName
      );
      if (prop.placeholder) {
        propertyPlaceholders[fieldName] = getMultiLocaleDisplayName2(
          prop.placeholder,
          locales,
          fallbackLocale,
          ""
        );
      }
    }
  }
  return { displayName, propertyDisplayNames, propertyPlaceholders };
}
function getExcludedFields(schema, customTypes) {
  const createExclude = /* @__PURE__ */ new Set();
  const updateExclude = /* @__PURE__ */ new Set();
  if (schema.options?.id !== false) {
    createExclude.add("id");
    updateExclude.add("id");
  }
  if (schema.options?.timestamps !== false) {
    createExclude.add("created_at");
    createExclude.add("updated_at");
    updateExclude.add("created_at");
    updateExclude.add("updated_at");
  }
  if (schema.options?.softDelete) {
    createExclude.add("deleted_at");
    updateExclude.add("deleted_at");
  }
  if (schema.properties) {
    if (schema.properties["emailVerifiedAt"] || schema.properties["email_verified_at"]) {
      createExclude.add("email_verified_at");
      updateExclude.add("email_verified_at");
    }
  }
  if (schema.properties && customTypes) {
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      const customType = customTypes.get(propDef.type);
      if (customType?.accessors) {
        for (const accessor of customType.accessors) {
          const fieldName = `${toSnakeCase(propName)}_${toSnakeCase(accessor.name)}`;
          createExclude.add(fieldName);
          updateExclude.add(fieldName);
        }
      }
    }
  }
  return { create: createExclude, update: updateExclude };
}
function formatZodSchemasSection(schemaName, zodSchemas, displayNames, excludedFields) {
  const parts = [];
  const lowerName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1);
  parts.push(`// ============================================================================
`);
  parts.push(`// I18n (Internationalization)
`);
  parts.push(`// ============================================================================

`);
  parts.push(`/**
`);
  parts.push(` * Unified i18n object for ${schemaName}
`);
  parts.push(` * Contains model label and all field labels/placeholders
`);
  parts.push(` */
`);
  parts.push(`export const ${lowerName}I18n = {
`);
  parts.push(`  /** Model display name */
`);
  parts.push(`  label: ${JSON.stringify(displayNames.displayName)},
`);
  parts.push(`  /** Field labels and placeholders */
`);
  parts.push(`  fields: {
`);
  for (const [propName, labelMap] of Object.entries(displayNames.propertyDisplayNames)) {
    const placeholderMap = displayNames.propertyPlaceholders[propName];
    parts.push(`    ${propName}: {
`);
    parts.push(`      label: ${JSON.stringify(labelMap)},
`);
    if (placeholderMap) {
      parts.push(`      placeholder: ${JSON.stringify(placeholderMap)},
`);
    }
    parts.push(`    },
`);
  }
  parts.push(`  },
`);
  parts.push(`} as const;

`);
  parts.push(`// ============================================================================
`);
  parts.push(`// Zod Schemas
`);
  parts.push(`// ============================================================================

`);
  parts.push(`/** Field schemas for ${schemaName} */
`);
  parts.push(`export const base${schemaName}Schemas = {
`);
  for (const prop of zodSchemas) {
    if (prop.comment) {
      parts.push(`  /** ${prop.comment} */
`);
    }
    parts.push(`  ${prop.fieldName}: ${prop.schema},
`);
  }
  parts.push(`} as const;

`);
  const createFields = zodSchemas.filter((p) => p.inCreate && !excludedFields.create.has(p.fieldName));
  parts.push(`/** Create schema for ${schemaName} (POST requests) */
`);
  parts.push(`export const base${schemaName}CreateSchema = z.object({
`);
  for (const prop of createFields) {
    parts.push(`  ${prop.fieldName}: base${schemaName}Schemas.${prop.fieldName},
`);
  }
  parts.push(`});

`);
  parts.push(`/** Update schema for ${schemaName} (PUT/PATCH requests) */
`);
  parts.push(`export const base${schemaName}UpdateSchema = base${schemaName}CreateSchema.partial();

`);
  parts.push(`// ============================================================================
`);
  parts.push(`// Inferred Types
`);
  parts.push(`// ============================================================================

`);
  parts.push(`export type Base${schemaName}Create = z.infer<typeof base${schemaName}CreateSchema>;
`);
  parts.push(`export type Base${schemaName}Update = z.infer<typeof base${schemaName}UpdateSchema>;

`);
  parts.push(`// ============================================================================
`);
  parts.push(`// I18n Helper Functions
`);
  parts.push(`// ============================================================================

`);
  parts.push(`/** Get model label for a specific locale */
`);
  parts.push(`export function get${schemaName}Label(locale: string): string {
`);
  parts.push(`  return ${lowerName}I18n.label[locale as keyof typeof ${lowerName}I18n.label] ?? ${lowerName}I18n.label['en'] ?? '${schemaName}';
`);
  parts.push(`}

`);
  parts.push(`/** Get field label for a specific locale */
`);
  parts.push(`export function get${schemaName}FieldLabel(field: string, locale: string): string {
`);
  parts.push(`  const fieldI18n = ${lowerName}I18n.fields[field as keyof typeof ${lowerName}I18n.fields];
`);
  parts.push(`  if (!fieldI18n) return field;
`);
  parts.push(`  return fieldI18n.label[locale as keyof typeof fieldI18n.label] ?? fieldI18n.label['en'] ?? field;
`);
  parts.push(`}

`);
  parts.push(`/** Get field placeholder for a specific locale */
`);
  parts.push(`export function get${schemaName}FieldPlaceholder(field: string, locale: string): string {
`);
  parts.push(`  const fieldI18n = ${lowerName}I18n.fields[field as keyof typeof ${lowerName}I18n.fields];
`);
  parts.push(`  if (!fieldI18n || !('placeholder' in fieldI18n)) return '';
`);
  parts.push(`  const placeholder = fieldI18n.placeholder as Record<string, string>;
`);
  parts.push(`  return placeholder[locale] ?? placeholder['en'] ?? '';
`);
  parts.push(`}
`);
  return parts.join("");
}
function formatZodModelFile(schemaName, ext = "", basePrefix = "./base") {
  const lowerName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1);
  return `/**
 * ${schemaName} Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { ${schemaName} as ${schemaName}Base } from '${basePrefix}/${schemaName}${ext}';
import {
  base${schemaName}Schemas,
  base${schemaName}CreateSchema,
  base${schemaName}UpdateSchema,
  ${lowerName}I18n,
  get${schemaName}Label,
  get${schemaName}FieldLabel,
  get${schemaName}FieldPlaceholder,
} from '${basePrefix}/${schemaName}${ext}';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface ${schemaName} extends ${schemaName}Base {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const ${lowerName}Schemas = { ...base${schemaName}Schemas };
export const ${lowerName}CreateSchema = base${schemaName}CreateSchema;
export const ${lowerName}UpdateSchema = base${schemaName}UpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type ${schemaName}Create = z.infer<typeof ${lowerName}CreateSchema>;
export type ${schemaName}Update = z.infer<typeof ${lowerName}UpdateSchema>;

// Re-export i18n and helpers
export {
  ${lowerName}I18n,
  get${schemaName}Label,
  get${schemaName}FieldLabel,
  get${schemaName}FieldPlaceholder,
};

// Re-export base type for internal use
export type { ${schemaName}Base };
`;
}

// src/generator.ts
var DEFAULT_OPTIONS = {
  readonly: false,
  // Changed: interfaces should be mutable for forms/mutations
  strictNullChecks: true,
  generateZodSchemas: true,
  // Generate Zod schemas by default
  generateRules: false,
  // Legacy Ant Design rules (deprecated, ignored when generateZodSchemas=true)
  useJsExtension: false
  // Bundlers (Vite, webpack) don't need .js extension
};
function getImportExt2(options) {
  return options.useJsExtension ? ".js" : "";
}
function generateBaseHeader() {
  return `/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * Auto-generated TypeScript types from Omnify schemas.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 */

`;
}
function generateModelHeader(schemaName) {
  return `/**
 * ${schemaName} Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types here.
 * This file will NOT be overwritten by the generator.
 */

`;
}
function getComputedFields(schema, customTypes) {
  const computedFields = [];
  if (!schema.properties) return computedFields;
  for (const [propName, propDef] of Object.entries(schema.properties)) {
    const snakeName = toSnakeCase(propName);
    const customType = customTypes?.get(propDef.type);
    if (customType?.accessors) {
      for (const accessor of customType.accessors) {
        computedFields.push(`${snakeName}_${toSnakeCase(accessor.name)}`);
      }
    }
  }
  return computedFields;
}
function generateUtilityTypes(schemaName, schema, customTypes) {
  const parts = [];
  const excludeFields = [];
  if (schema.options?.id !== false) {
    excludeFields.push("'id'");
  }
  if (schema.options?.timestamps !== false) {
    excludeFields.push("'created_at'", "'updated_at'");
  }
  if (schema.options?.softDelete) {
    excludeFields.push("'deleted_at'");
  }
  if (schema.properties?.["emailVerifiedAt"] || schema.properties?.["email_verified_at"]) {
    excludeFields.push("'email_verified_at'");
  }
  const computedFields = getComputedFields(schema, customTypes);
  for (const field of computedFields) {
    excludeFields.push(`'${field}'`);
  }
  const omitType = excludeFields.length > 0 ? `Omit<${schemaName}, ${excludeFields.join(" | ")}>` : schemaName;
  parts.push(`
/** For creating new ${schemaName} (POST requests) */`);
  parts.push(`
export type ${schemaName}Create = ${omitType};
`);
  parts.push(`
/** For updating ${schemaName} (PUT/PATCH requests) */`);
  parts.push(`
export type ${schemaName}Update = Partial<${schemaName}Create>;
`);
  return parts.join("");
}
function needsDateTimeImports(iface) {
  let dateTime = false;
  let date = false;
  for (const prop of iface.properties) {
    if (prop.type === "DateTimeString" || prop.type.includes("DateTimeString")) {
      dateTime = true;
    }
    if (prop.type === "DateString" || prop.type.includes("DateString")) {
      date = true;
    }
  }
  return { dateTime, date };
}
function generateBaseInterfaceFile(schemaName, schemas, options) {
  const interfaces = generateInterfaces(schemas, options);
  const iface = interfaces.find((i) => i.name === schemaName);
  const schema = schemas[schemaName];
  if (!iface || !schema) {
    throw new Error(`Interface not found for schema: ${schemaName}`);
  }
  const parts = [generateBaseHeader()];
  if (options.generateZodSchemas) {
    parts.push(`import { z } from 'zod';
`);
  }
  const dateImports = needsDateTimeImports(iface);
  const commonImports = [];
  if (dateImports.dateTime) commonImports.push("DateTimeString");
  if (dateImports.date) commonImports.push("DateString");
  const ext = getImportExt2(options);
  const isNodeModulesBase = options.baseImportPrefix?.startsWith("@");
  const commonImportPath = isNodeModulesBase ? "./common" : "../common";
  if (commonImports.length > 0) {
    parts.push(`import type { ${commonImports.join(", ")} } from '${commonImportPath}${ext}';
`);
  }
  if (iface.enumDependencies && iface.enumDependencies.length > 0) {
    const schemaEnumPrefix = options.schemaEnumImportPrefix ?? (options.enumImportPrefix?.startsWith("@") ? options.enumImportPrefix : options.enumImportPrefix ? `../${options.enumImportPrefix}` : "../enum");
    const pluginEnumNames = new Set(
      options.pluginEnums ? Array.from(options.pluginEnums.keys()) : []
    );
    const pluginEnumPrefix = options.pluginEnumImportPrefix ?? `${schemaEnumPrefix}/plugin`;
    for (const enumName of iface.enumDependencies) {
      const enumPath = pluginEnumNames.has(enumName) ? `${pluginEnumPrefix}/${enumName}${ext}` : `${schemaEnumPrefix}/${enumName}${ext}`;
      parts.push(`import { ${enumName} } from '${enumPath}';
`);
    }
  }
  if (iface.dependencies && iface.dependencies.length > 0) {
    for (const dep of iface.dependencies) {
      parts.push(`import type { ${dep} } from './${dep}${ext}';
`);
    }
    parts.push("\n");
  } else if (commonImports.length > 0 || options.generateZodSchemas || iface.enumDependencies && iface.enumDependencies.length > 0) {
    parts.push("\n");
  }
  parts.push(formatInterface(iface));
  parts.push("\n");
  if (options.generateZodSchemas) {
    const zodSchemas = generateZodSchemas(schema, options);
    const displayNames = generateDisplayNames(schema, options);
    const excludedFields = getExcludedFields(schema, options.customTypes);
    parts.push("\n");
    parts.push(formatZodSchemasSection(schemaName, zodSchemas, displayNames, excludedFields));
  } else {
    parts.push(generateUtilityTypes(schemaName, schema, options.customTypes));
  }
  return {
    filePath: `base/${schemaName}.ts`,
    content: parts.join(""),
    types: [schemaName, `${schemaName}Create`, `${schemaName}Update`],
    overwrite: true,
    category: "base"
  };
}
function generateEnumFile(enumDef, isPluginEnum = false) {
  const parts = [generateBaseHeader()];
  parts.push(formatEnum(enumDef));
  parts.push("\n");
  return {
    filePath: `${enumDef.name}.ts`,
    content: parts.join(""),
    types: [enumDef.name],
    overwrite: true,
    category: isPluginEnum ? "plugin-enum" : "enum"
  };
}
function generateTypeAliasFile(alias) {
  const parts = [generateBaseHeader()];
  parts.push(formatTypeAlias(alias));
  parts.push("\n");
  return {
    filePath: `${alias.name}.ts`,
    content: parts.join(""),
    types: [alias.name],
    overwrite: true,
    category: "enum"
  };
}
function generateModelFile(schemaName, options) {
  const basePrefix = options.baseImportPrefix ?? "./base";
  if (options.generateZodSchemas) {
    return {
      filePath: `${schemaName}.ts`,
      content: formatZodModelFile(schemaName, getImportExt2(options), basePrefix),
      types: [schemaName],
      overwrite: false
      // Never overwrite user models
    };
  }
  const parts = [generateModelHeader(schemaName)];
  const ext = getImportExt2(options);
  parts.push(`import type { ${schemaName} as ${schemaName}Base } from '${basePrefix}/${schemaName}${ext}';

`);
  parts.push(`/**
 * ${schemaName} model interface.
 * Add custom properties or methods here.
 */
`);
  parts.push(`export interface ${schemaName} extends ${schemaName}Base {
`);
  parts.push(`  // Add custom properties here
`);
  parts.push(`}

`);
  parts.push(`// Re-export base type for internal use
`);
  parts.push(`export type { ${schemaName}Base };
`);
  return {
    filePath: `${schemaName}.ts`,
    content: parts.join(""),
    types: [schemaName],
    overwrite: false
    // Never overwrite user models
  };
}
var DEFAULT_VALIDATION_MESSAGES = {
  required: {
    en: "${displayName} is required",
    ja: "${displayName}\u306F\u5FC5\u9808\u3067\u3059",
    vi: "${displayName} l\xE0 b\u1EAFt bu\u1ED9c",
    ko: "${displayName}\uC740(\uB294) \uD544\uC218\uC785\uB2C8\uB2E4",
    "zh-CN": "${displayName}\u662F\u5FC5\u586B\u9879",
    "zh-TW": "${displayName}\u70BA\u5FC5\u586B\u6B04\u4F4D",
    th: "${displayName} \u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01",
    es: "${displayName} es obligatorio"
  },
  minLength: {
    en: "${displayName} must be at least ${min} characters",
    ja: "${displayName}\u306F${min}\u6587\u5B57\u4EE5\u4E0A\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    vi: "${displayName} ph\u1EA3i c\xF3 \xEDt nh\u1EA5t ${min} k\xFD t\u1EF1",
    ko: "${displayName}\uC740(\uB294) ${min}\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4",
    "zh-CN": "${displayName}\u81F3\u5C11\u9700\u8981${min}\u4E2A\u5B57\u7B26",
    "zh-TW": "${displayName}\u81F3\u5C11\u9700\u8981${min}\u500B\u5B57\u5143",
    th: "${displayName} \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 ${min} \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23",
    es: "${displayName} debe tener al menos ${min} caracteres"
  },
  maxLength: {
    en: "${displayName} must be at most ${max} characters",
    ja: "${displayName}\u306F${max}\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    vi: "${displayName} kh\xF4ng \u0111\u01B0\u1EE3c qu\xE1 ${max} k\xFD t\u1EF1",
    ko: "${displayName}\uC740(\uB294) ${max}\uC790 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4",
    "zh-CN": "${displayName}\u6700\u591A${max}\u4E2A\u5B57\u7B26",
    "zh-TW": "${displayName}\u6700\u591A${max}\u500B\u5B57\u5143",
    th: "${displayName} \u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 ${max} \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23",
    es: "${displayName} debe tener como m\xE1ximo ${max} caracteres"
  },
  min: {
    en: "${displayName} must be at least ${min}",
    ja: "${displayName}\u306F${min}\u4EE5\u4E0A\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    vi: "${displayName} ph\u1EA3i l\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng ${min}",
    ko: "${displayName}\uC740(\uB294) ${min} \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4",
    "zh-CN": "${displayName}\u5FC5\u987B\u5927\u4E8E\u7B49\u4E8E${min}",
    "zh-TW": "${displayName}\u5FC5\u9808\u5927\u65BC\u7B49\u65BC${min}",
    th: "${displayName} \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A ${min}",
    es: "${displayName} debe ser al menos ${min}"
  },
  max: {
    en: "${displayName} must be at most ${max}",
    ja: "${displayName}\u306F${max}\u4EE5\u4E0B\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    vi: "${displayName} ph\u1EA3i nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng ${max}",
    ko: "${displayName}\uC740(\uB294) ${max} \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4",
    "zh-CN": "${displayName}\u5FC5\u987B\u5C0F\u4E8E\u7B49\u4E8E${max}",
    "zh-TW": "${displayName}\u5FC5\u9808\u5C0F\u65BC\u7B49\u65BC${max}",
    th: "${displayName} \u0E15\u0E49\u0E2D\u0E07\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A ${max}",
    es: "${displayName} debe ser como m\xE1ximo ${max}"
  },
  email: {
    en: "Please enter a valid email address",
    ja: "\u6709\u52B9\u306A\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    vi: "Vui l\xF2ng nh\u1EADp \u0111\u1ECBa ch\u1EC9 email h\u1EE3p l\u1EC7",
    ko: "\uC720\uD6A8\uD55C \uC774\uBA54\uC77C \uC8FC\uC18C\uB97C \uC785\uB825\uD558\uC138\uC694",
    "zh-CN": "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u7535\u5B50\u90AE\u4EF6\u5730\u5740",
    "zh-TW": "\u8ACB\u8F38\u5165\u6709\u6548\u7684\u96FB\u5B50\u90F5\u4EF6\u5730\u5740",
    th: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07",
    es: "Por favor, introduce una direcci\xF3n de correo electr\xF3nico v\xE1lida"
  },
  url: {
    en: "Please enter a valid URL",
    ja: "\u6709\u52B9\u306AURL\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    vi: "Vui l\xF2ng nh\u1EADp URL h\u1EE3p l\u1EC7",
    ko: "\uC720\uD6A8\uD55C URL\uC744 \uC785\uB825\uD558\uC138\uC694",
    "zh-CN": "\u8BF7\u8F93\u5165\u6709\u6548\u7684URL",
    "zh-TW": "\u8ACB\u8F38\u5165\u6709\u6548\u7684\u7DB2\u5740",
    th: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 URL \u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07",
    es: "Por favor, introduce una URL v\xE1lida"
  },
  pattern: {
    en: "${displayName} format is invalid",
    ja: "${displayName}\u306E\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093",
    vi: "${displayName} kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng",
    ko: "${displayName} \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
    "zh-CN": "${displayName}\u683C\u5F0F\u4E0D\u6B63\u786E",
    "zh-TW": "${displayName}\u683C\u5F0F\u4E0D\u6B63\u78BA",
    th: "\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A${displayName}\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07",
    es: "El formato de ${displayName} no es v\xE1lido"
  }
};
function generateCommonFile(options) {
  const locales = options.localeConfig?.locales ?? ["ja", "en"];
  const localeUnion = locales.map((l) => `'${l}'`).join(" | ");
  const content = `${generateBaseHeader()}
/**
 * Locale map for multi-language support.
 */
export interface LocaleMap {
  [locale: string]: string;
}

/**
 * Supported locales in this project.
 */
export type Locale = ${localeUnion};

/**
 * Validation rule with multi-locale messages.
 * Use get{Model}Rules(locale) to get Ant Design compatible rules with string messages.
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'integer' | 'array' | 'object';
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp;
  message: LocaleMap;
}

/**
 * ISO 8601 date-time string.
 */
export type DateTimeString = string;

/**
 * ISO 8601 date string (YYYY-MM-DD).
 */
export type DateString = string;
`;
  const isNodeModulesBase = options.baseImportPrefix?.startsWith("@");
  return {
    filePath: "common.ts",
    content,
    types: ["LocaleMap", "Locale", "ValidationRule", "DateTimeString", "DateString"],
    overwrite: true,
    category: isNodeModulesBase ? "base" : void 0
  };
}
function generateI18nFile(options) {
  const locales = options.localeConfig?.locales ?? ["ja", "en"];
  const defaultLocale = options.localeConfig?.defaultLocale ?? "ja";
  const fallbackLocale = options.localeConfig?.fallbackLocale ?? "en";
  const userMessages = options.localeConfig?.messages ?? {};
  const mergedMessages = {};
  for (const [key, defaultMsgs] of Object.entries(DEFAULT_VALIDATION_MESSAGES)) {
    mergedMessages[key] = {};
    for (const locale of locales) {
      if (defaultMsgs[locale]) {
        mergedMessages[key][locale] = defaultMsgs[locale];
      }
    }
  }
  for (const [key, userMsgs] of Object.entries(userMessages)) {
    if (userMsgs) {
      if (!mergedMessages[key]) {
        mergedMessages[key] = {};
      }
      for (const [locale, msg] of Object.entries(userMsgs)) {
        mergedMessages[key][locale] = msg;
      }
    }
  }
  const messagesJson = JSON.stringify(mergedMessages, null, 2);
  const ext = getImportExt2(options);
  const isNodeModulesBase = options.baseImportPrefix?.startsWith("@");
  const commonImportPath = isNodeModulesBase ? `${options.baseImportPrefix}/common` : "./common";
  const content = `${generateBaseHeader()}
import type { LocaleMap } from '${commonImportPath}${ext}';

/**
 * Default locale for this project.
 */
export const defaultLocale = '${defaultLocale}' as const;

/**
 * Fallback locale when requested locale is not found.
 */
export const fallbackLocale = '${fallbackLocale}' as const;

/**
 * Supported locales in this project.
 */
export const supportedLocales = ${JSON.stringify(locales)} as const;

/**
 * Validation messages for all supported locales.
 * Use getMessage(key, locale, params) to get formatted message.
 */
export const validationMessages = ${messagesJson} as const;

/**
 * Get validation message for a specific key and locale.
 * Supports template placeholders: \${displayName}, \${min}, \${max}, etc.
 *
 * @param key - Message key (e.g., 'required', 'minLength')
 * @param locale - Locale code (e.g., 'ja', 'en')
 * @param params - Template parameters to replace
 * @returns Formatted message string
 *
 * @example
 * getMessage('required', 'ja', { displayName: '\u6C0F\u540D' })
 * // => '\u6C0F\u540D\u306F\u5FC5\u9808\u3067\u3059'
 */
export function getMessage(
  key: string,
  locale: string,
  params: Record<string, string | number> = {}
): string {
  const messages = validationMessages[key as keyof typeof validationMessages];
  if (!messages) return key;

  let message = (messages as LocaleMap)[locale]
    ?? (messages as LocaleMap)[fallbackLocale]
    ?? (messages as LocaleMap)[defaultLocale]
    ?? key;

  // Replace template placeholders
  for (const [param, value] of Object.entries(params)) {
    message = message.replace(new RegExp(\`\\\\$\\{\${param}\\}\`, 'g'), String(value));
  }

  return message;
}

/**
 * Get all validation messages for a specific locale.
 *
 * @param locale - Locale code
 * @returns Object with all messages for the locale
 */
export function getMessages(locale: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(validationMessages)) {
    result[key] = (messages as LocaleMap)[locale]
      ?? (messages as LocaleMap)[fallbackLocale]
      ?? (messages as LocaleMap)[defaultLocale]
      ?? key;
  }
  return result;
}
`;
  return {
    filePath: "i18n.ts",
    content,
    types: ["validationMessages", "getMessage", "getMessages"],
    overwrite: true
  };
}
function generateIndexFile(schemas, enums, pluginEnums, typeAliases, options) {
  const parts = [generateBaseHeader()];
  const ext = getImportExt2(options);
  const isNodeModulesBase = options.baseImportPrefix?.startsWith("@");
  const commonImportPath = isNodeModulesBase ? `${options.baseImportPrefix}/common` : "./common";
  const i18nImportPath = isNodeModulesBase ? `${options.baseImportPrefix}/i18n` : "./i18n";
  parts.push(`// Common Types
`);
  parts.push(`export type { LocaleMap, Locale, ValidationRule, DateTimeString, DateString } from '${commonImportPath}${ext}';

`);
  parts.push(`// i18n (Internationalization)
`);
  parts.push(`export {
`);
  parts.push(`  defaultLocale,
`);
  parts.push(`  fallbackLocale,
`);
  parts.push(`  supportedLocales,
`);
  parts.push(`  validationMessages,
`);
  parts.push(`  getMessage,
`);
  parts.push(`  getMessages,
`);
  parts.push(`} from '${i18nImportPath}${ext}';

`);
  const enumPrefix = options.enumImportPrefix ?? "./enum";
  if (enums.length > 0) {
    parts.push(`// Schema Enums
`);
    for (const enumDef of enums) {
      parts.push(`export {
`);
      parts.push(`  ${enumDef.name},
`);
      parts.push(`  ${enumDef.name}Values,
`);
      parts.push(`  is${enumDef.name},
`);
      parts.push(`  get${enumDef.name}Label,
`);
      parts.push(`  get${enumDef.name}Extra,
`);
      parts.push(`} from '${enumPrefix}/${enumDef.name}${ext}';
`);
    }
    parts.push("\n");
  }
  if (pluginEnums.length > 0) {
    const pluginEnumPrefix = options.pluginEnumImportPrefix ?? `${enumPrefix}/plugin`;
    parts.push(`// Plugin Enums
`);
    for (const enumDef of pluginEnums) {
      parts.push(`export {
`);
      parts.push(`  ${enumDef.name},
`);
      parts.push(`  ${enumDef.name}Values,
`);
      parts.push(`  is${enumDef.name},
`);
      parts.push(`  get${enumDef.name}Label,
`);
      parts.push(`  get${enumDef.name}Extra,
`);
      parts.push(`} from '${pluginEnumPrefix}/${enumDef.name}${ext}';
`);
    }
    parts.push("\n");
  }
  if (typeAliases.length > 0) {
    parts.push(`// Inline Enums (Type Aliases)
`);
    for (const alias of typeAliases) {
      parts.push(`export {
`);
      parts.push(`  type ${alias.name},
`);
      parts.push(`  ${alias.name}Values,
`);
      parts.push(`  is${alias.name},
`);
      parts.push(`  get${alias.name}Label,
`);
      parts.push(`  get${alias.name}Extra,
`);
      parts.push(`} from '${enumPrefix}/${alias.name}${ext}';
`);
    }
    parts.push("\n");
  }
  if (options.generateZodSchemas) {
    parts.push(`// Models (with Zod schemas, i18n, and Create/Update types)
`);
    for (const schema of Object.values(schemas)) {
      if (schema.kind === "enum") continue;
      if (schema.options?.hidden === true) continue;
      const lowerName = schema.name.charAt(0).toLowerCase() + schema.name.slice(1);
      parts.push(`export type { ${schema.name}, ${schema.name}Create, ${schema.name}Update } from './${schema.name}${ext}';
`);
      parts.push(`export {
`);
      parts.push(`  ${lowerName}Schemas,
`);
      parts.push(`  ${lowerName}CreateSchema,
`);
      parts.push(`  ${lowerName}UpdateSchema,
`);
      parts.push(`  ${lowerName}I18n,
`);
      parts.push(`  get${schema.name}Label,
`);
      parts.push(`  get${schema.name}FieldLabel,
`);
      parts.push(`  get${schema.name}FieldPlaceholder,
`);
      parts.push(`} from './${schema.name}${ext}';
`);
    }
  } else {
    const basePrefix = options.baseImportPrefix ?? "./base";
    parts.push(`// Models (with Create/Update utility types)
`);
    for (const schema of Object.values(schemas)) {
      if (schema.kind === "enum") continue;
      if (schema.options?.hidden === true) continue;
      parts.push(`export type { ${schema.name} } from './${schema.name}${ext}';
`);
      parts.push(`export type { ${schema.name}Create, ${schema.name}Update } from '${basePrefix}/${schema.name}${ext}';
`);
    }
    if (options.generateRules) {
      parts.push(`
// Validation Rules
`);
      for (const schema of Object.values(schemas)) {
        if (schema.kind === "enum") continue;
        if (schema.options?.hidden === true) continue;
        parts.push(`export {
`);
        parts.push(`  get${schema.name}Rules,
`);
        parts.push(`  get${schema.name}DisplayName,
`);
        parts.push(`  get${schema.name}PropertyDisplayName,
`);
        parts.push(`} from './rules/${schema.name}.rules${ext}';
`);
      }
    }
  }
  return {
    filePath: "index.ts",
    content: parts.join(""),
    types: [],
    overwrite: true
  };
}
function generateTypeScript(schemas, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const files = [];
  const schemasByName = /* @__PURE__ */ new Map();
  for (const schema of Object.values(schemas)) {
    const paths = schemasByName.get(schema.name) ?? [];
    paths.push(schema.relativePath ?? schema.filePath);
    schemasByName.set(schema.name, paths);
  }
  const duplicateSchemas = Array.from(schemasByName.entries()).filter(([, paths]) => paths.length > 1);
  if (duplicateSchemas.length > 0) {
    const errors = duplicateSchemas.map(
      ([name, paths]) => `  - "${name}" defined in: ${paths.join(", ")}`
    ).join("\n");
    throw new Error(
      `Duplicate schema/enum names detected. Names must be globally unique:
${errors}
Hint: Rename to unique names like "Blog${duplicateSchemas[0][0]}" or "Shop${duplicateSchemas[0][0]}"`
    );
  }
  if (opts.pluginEnums && opts.pluginEnums.size > 0) {
    const conflicts = [];
    for (const schema of Object.values(schemas)) {
      if (schema.kind === "enum" && opts.pluginEnums.has(schema.name)) {
        conflicts.push(`"${schema.name}" (schema: ${schema.relativePath ?? schema.filePath}, plugin enum)`);
      }
    }
    if (conflicts.length > 0) {
      throw new Error(
        `Schema enum conflicts with plugin enum:
  - ${conflicts.join("\n  - ")}
Hint: Rename your schema enum to avoid conflict with plugin-provided enums`
      );
    }
  }
  const enums = generateEnums(schemas, opts);
  for (const enumDef of enums) {
    files.push(generateEnumFile(enumDef, false));
  }
  if (opts.pluginEnums && opts.pluginEnums.size > 0) {
    const pluginEnums = generatePluginEnums(opts.pluginEnums, opts);
    for (const enumDef of pluginEnums) {
      files.push(generateEnumFile(enumDef, true));
    }
  }
  const inlineEnums = extractInlineEnums(schemas, opts);
  const inlineTypeAliases = [];
  for (const item of inlineEnums) {
    if (item.enum) {
      enums.push(item.enum);
      files.push(generateEnumFile(item.enum, false));
    } else if (item.typeAlias) {
      inlineTypeAliases.push(item.typeAlias);
      files.push(generateTypeAliasFile(item.typeAlias));
    }
  }
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") continue;
    if (schema.options?.hidden === true) continue;
    files.push(generateBaseInterfaceFile(schema.name, schemas, opts));
  }
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") continue;
    if (schema.options?.hidden === true) continue;
    files.push(generateModelFile(schema.name, opts));
  }
  if (!opts.generateZodSchemas && opts.generateRules) {
    const rulesFiles = generateRulesFiles(schemas, opts);
    files.push(...rulesFiles);
  }
  files.push(generateCommonFile(opts));
  files.push(generateI18nFile(opts));
  const pluginEnumsList = opts.pluginEnums ? generatePluginEnums(opts.pluginEnums, opts) : [];
  files.push(generateIndexFile(schemas, enums, pluginEnumsList, inlineTypeAliases, opts));
  return files;
}

export {
  toPropertyName,
  toInterfaceName,
  getPropertyType,
  propertyToTSProperty,
  schemaToInterface,
  formatProperty,
  formatInterface,
  generateInterfaces,
  toEnumMemberName,
  toEnumName,
  schemaToEnum,
  generateEnums,
  pluginEnumToTSEnum,
  generatePluginEnums,
  formatEnum,
  enumToUnionType,
  formatTypeAlias,
  extractInlineEnums,
  DEFAULT_VALIDATION_TEMPLATES,
  mergeValidationTemplates,
  formatValidationMessage,
  getValidationMessages,
  generateModelRules,
  generateRulesFiles,
  generateTypeScript
};
//# sourceMappingURL=chunk-VLDDJNHY.js.map