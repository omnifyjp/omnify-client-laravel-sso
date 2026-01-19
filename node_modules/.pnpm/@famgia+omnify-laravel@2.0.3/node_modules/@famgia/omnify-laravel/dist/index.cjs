"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  extractManyToManyRelations: () => extractManyToManyRelations,
  extractMorphToManyRelations: () => extractMorphToManyRelations,
  formatColumnMethod: () => formatColumnMethod,
  formatForeignKey: () => formatForeignKey,
  formatIndex: () => formatIndex,
  formatMigrationFile: () => formatMigrationFile,
  generateAIGuides: () => generateAIGuides,
  generateAlterMigration: () => generateAlterMigration,
  generateDropMigrationForTable: () => generateDropMigrationForTable,
  generateDropTableMigration: () => generateDropTableMigration,
  generateFactories: () => generateFactories,
  generateForeignKey: () => generateForeignKey,
  generateMigrationFromSchema: () => generateMigrationFromSchema,
  generateMigrations: () => generateMigrations,
  generateMigrationsFromChanges: () => generateMigrationsFromChanges,
  generateModels: () => generateModels,
  generateMorphToManyPivotBlueprint: () => generateMorphToManyPivotBlueprint,
  generatePivotTableBlueprint: () => generatePivotTableBlueprint,
  generatePivotTableName: () => generatePivotTableName,
  generatePrimaryKeyColumn: () => generatePrimaryKeyColumn,
  generateProviderRegistration: () => generateProviderRegistration,
  generateSoftDeleteColumn: () => generateSoftDeleteColumn,
  generateTimestampColumns: () => generateTimestampColumns,
  getFactoryPath: () => getFactoryPath,
  getMigrationPath: () => getMigrationPath,
  getModelPath: () => getModelPath,
  laravelPlugin: () => laravelPlugin,
  propertyToColumnMethod: () => propertyToColumnMethod,
  schemaToBlueprint: () => schemaToBlueprint,
  shouldGenerateAIGuides: () => shouldGenerateAIGuides,
  toColumnName: () => toColumnName,
  toTableName: () => toTableName
});
module.exports = __toCommonJS(index_exports);

// src/migration/schema-builder.ts
var import_omnify_types = require("@famgia/omnify-types");

// src/utils.ts
var import_pluralize = __toESM(require("pluralize"), 1);
function getEnumStringValues(enumArray) {
  return enumArray.map((item) => {
    if (typeof item === "string") {
      return item;
    }
    if (typeof item === "object" && item !== null && "value" in item) {
      return item.value;
    }
    return String(item);
  });
}
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toLowerCase();
}
function toPascalCase(str) {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase());
}
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
function pluralize(word) {
  return import_pluralize.default.plural(word);
}
function singularize(word) {
  return import_pluralize.default.singular(word);
}

// src/migration/schema-builder.ts
var TYPE_METHOD_MAP = {
  String: "string",
  TinyInt: "tinyInteger",
  Int: "integer",
  BigInt: "bigInteger",
  Float: "double",
  Decimal: "decimal",
  Boolean: "boolean",
  Text: "text",
  MediumText: "mediumText",
  LongText: "longText",
  Date: "date",
  Time: "time",
  DateTime: "dateTime",
  Timestamp: "timestamp",
  Json: "json",
  Email: "string",
  Password: "string",
  Enum: "enum",
  EnumRef: "string"
  // EnumRef stores the enum value as string (lookup via schema)
  // Note: File type is now polymorphic - no column generated, uses files table
};
var PK_METHOD_MAP = {
  Int: "increments",
  BigInt: "id",
  Uuid: "uuid",
  String: "string"
};
function getIdType(schema) {
  return schema.options?.idType ?? "BigInt";
}
function hasAutoId(schema) {
  return schema.options?.id !== false;
}
function toColumnName(propertyName) {
  return propertyName.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}
function toTableName(schemaName) {
  const snakeCase = schemaName.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
  if (snakeCase.endsWith("y")) {
    return snakeCase.slice(0, -1) + "ies";
  } else if (snakeCase.endsWith("s") || snakeCase.endsWith("x") || snakeCase.endsWith("ch") || snakeCase.endsWith("sh")) {
    return snakeCase + "es";
  } else {
    return snakeCase + "s";
  }
}
function propertyToColumnMethod(propertyName, property, options = {}) {
  if (property.type === "Association") {
    return null;
  }
  if (property.type === "File") {
    return null;
  }
  const columnName = toColumnName(propertyName);
  const method = TYPE_METHOD_MAP[property.type] ?? "string";
  const args = [columnName];
  const modifiers = [];
  const propWithLength = property;
  if (method === "string" && propWithLength.length) {
    args.push(propWithLength.length);
  } else if (property.type === "EnumRef") {
    args.push(50);
  }
  if (property.type === "Decimal") {
    const decimalProp = property;
    const precision = decimalProp.precision ?? 8;
    const scale = decimalProp.scale ?? 2;
    args.push(precision, scale);
  }
  if (property.type === "Enum") {
    const enumProp = property;
    if (enumProp.enum && enumProp.enum.length > 0) {
      const enumValues = getEnumStringValues(enumProp.enum);
      args.push(enumValues);
    }
  }
  const baseProp = property;
  if (baseProp.primary) {
    modifiers.push({ method: "primary" });
  }
  if (baseProp.nullable) {
    modifiers.push({ method: "nullable" });
  }
  if (baseProp.unique) {
    modifiers.push({ method: "unique" });
  }
  if (baseProp.default !== void 0 && baseProp.default !== null) {
    modifiers.push({ method: "default", args: [baseProp.default] });
  }
  if (baseProp.unsigned && (method === "tinyInteger" || method === "integer" || method === "bigInteger")) {
    modifiers.push({ method: "unsigned" });
  }
  if (method === "timestamp") {
    const timestampProp = property;
    if (timestampProp.useCurrent) {
      modifiers.push({ method: "useCurrent" });
    }
    if (timestampProp.useCurrentOnUpdate) {
      modifiers.push({ method: "useCurrentOnUpdate" });
    }
  }
  const rawDisplayName = property.displayName;
  if (rawDisplayName) {
    const displayName = (0, import_omnify_types.resolveLocalizedString)(rawDisplayName, options.locale);
    if (displayName) {
      modifiers.push({ method: "comment", args: [displayName] });
    }
  }
  return {
    name: columnName,
    method,
    args,
    modifiers
  };
}
function generatePrimaryKeyColumn(pkType = "BigInt") {
  const method = PK_METHOD_MAP[pkType] ?? "id";
  if (pkType === "Uuid") {
    return {
      name: "id",
      method: "uuid",
      args: ["id"],
      modifiers: [{ method: "primary" }]
    };
  }
  if (pkType === "String") {
    return {
      name: "id",
      method: "string",
      args: ["id", 255],
      modifiers: [{ method: "primary" }]
    };
  }
  return {
    name: "id",
    method,
    args: method === "id" ? [] : ["id"],
    modifiers: []
  };
}
function generateTimestampColumns() {
  return [
    {
      name: "created_at",
      method: "timestamp",
      args: ["created_at"],
      modifiers: [{ method: "nullable" }]
    },
    {
      name: "updated_at",
      method: "timestamp",
      args: ["updated_at"],
      modifiers: [{ method: "nullable" }]
    }
  ];
}
function generateSoftDeleteColumn() {
  return {
    name: "deleted_at",
    method: "timestamp",
    args: ["deleted_at"],
    modifiers: [{ method: "nullable" }]
  };
}
function generatePolymorphicColumns(propertyName, property, allSchemas) {
  if (property.type !== "Association") {
    return null;
  }
  const assocProp = property;
  if (assocProp.relation !== "MorphTo") {
    return null;
  }
  const isNullable2 = assocProp.nullable !== false;
  const targets = assocProp.targets;
  if (!targets || targets.length === 0) {
    return null;
  }
  const columnBaseName = toColumnName(propertyName);
  const typeColumnName = `${columnBaseName}_type`;
  const idColumnName = `${columnBaseName}_id`;
  const typeColumn = {
    name: typeColumnName,
    method: "enum",
    args: [typeColumnName, targets],
    modifiers: isNullable2 ? [{ method: "nullable" }] : []
  };
  const idTypes = /* @__PURE__ */ new Set();
  for (const targetName of targets) {
    const targetSchema = allSchemas[targetName];
    if (targetSchema) {
      const targetIdType = targetSchema.options?.idType ?? "BigInt";
      idTypes.add(targetIdType);
    }
  }
  let idMethod = "unsignedBigInteger";
  let idArgs = [];
  if (idTypes.size === 1) {
    const singleType = [...idTypes][0];
    if (singleType === "Uuid") {
      idMethod = "string";
      idArgs = [idColumnName, 36];
    } else if (singleType === "String") {
      idMethod = "string";
      idArgs = [idColumnName, 255];
    } else if (singleType === "Int") {
      idMethod = "unsignedInteger";
      idArgs = [idColumnName];
    } else {
      idMethod = "unsignedBigInteger";
      idArgs = [idColumnName];
    }
  } else if (idTypes.size > 1) {
    idMethod = "string";
    idArgs = [idColumnName, 36];
  } else {
    idArgs = [idColumnName];
  }
  const idColumn = {
    name: idColumnName,
    method: idMethod,
    args: idArgs.length > 0 ? idArgs : [idColumnName],
    modifiers: isNullable2 ? [{ method: "nullable" }] : []
  };
  const indexes = [
    {
      columns: [typeColumnName, idColumnName],
      unique: false
    }
  ];
  return { typeColumn, idColumn, indexes };
}
function generateForeignKey(propertyName, property, allSchemas, options = {}) {
  if (property.type !== "Association") {
    return null;
  }
  const assocProp = property;
  if (assocProp.relation !== "ManyToOne" && assocProp.relation !== "OneToOne") {
    return null;
  }
  if (assocProp.mappedBy) {
    return null;
  }
  const columnName = toColumnName(propertyName) + "_id";
  const targetSchema = assocProp.target ? allSchemas[assocProp.target] : void 0;
  const targetTable = assocProp.target ? toTableName(assocProp.target) : "unknown";
  const targetPkType = targetSchema ? getIdType(targetSchema) : "BigInt";
  let method = "unsignedBigInteger";
  if (targetPkType === "Int") {
    method = "unsignedInteger";
  } else if (targetPkType === "Uuid") {
    method = "uuid";
  } else if (targetPkType === "String") {
    method = "string";
  }
  const modifiers = [];
  if (assocProp.nullable === true) {
    modifiers.push({ method: "nullable" });
  }
  if (assocProp.default !== void 0 && assocProp.default !== null) {
    modifiers.push({ method: "default", args: [assocProp.default] });
  }
  if (assocProp.displayName) {
    const displayName = (0, import_omnify_types.resolveLocalizedString)(assocProp.displayName, options.locale);
    if (displayName) {
      modifiers.push({ method: "comment", args: [displayName] });
    }
  }
  const column = {
    name: columnName,
    method,
    args: [columnName],
    modifiers
  };
  const foreignKey = {
    columns: [columnName],
    references: "id",
    on: [targetTable],
    onDelete: assocProp.onDelete ?? "restrict",
    onUpdate: assocProp.onUpdate ?? "cascade"
  };
  const index = {
    columns: [columnName],
    unique: false
  };
  return { column, foreignKey, index };
}
function expandCompoundType(propName, property, customTypes, options = {}) {
  const typeDef = customTypes.get(property.type);
  if (!typeDef || !typeDef.compound || !typeDef.expand) {
    return null;
  }
  const expanded = [];
  const baseProp = property;
  for (const field of typeDef.expand) {
    const suffixSnake = toColumnName(field.suffix);
    const columnName = `${propName}_${suffixSnake}`;
    const expandedProp = {
      type: "String"
      // Default type, will be overridden by sql definition
    };
    const fieldOverrides = baseProp.fields;
    const fieldOverride = fieldOverrides?.[field.suffix];
    const fieldWithEnumRef = field;
    if (fieldWithEnumRef.enumRef) {
      const enumDef = options.pluginEnums?.get(fieldWithEnumRef.enumRef);
      if (enumDef && enumDef.values.length > 0) {
        expandedProp.type = "Enum";
        expandedProp.enum = enumDef.values.map((v) => v.value);
      } else {
        expandedProp.type = "EnumRef";
        expandedProp.enum = fieldWithEnumRef.enumRef;
      }
      if (fieldOverride?.nullable !== void 0) {
        expandedProp.nullable = fieldOverride.nullable;
      } else if (baseProp.nullable !== void 0) {
        expandedProp.nullable = baseProp.nullable;
      }
    } else if (field.sql) {
      const sqlType = field.sql.sqlType.toUpperCase();
      if (sqlType === "VARCHAR" || sqlType === "CHAR" || sqlType === "STRING") {
        expandedProp.type = "String";
        if (fieldOverride?.length) {
          expandedProp.length = fieldOverride.length;
        } else if (field.sql.length) {
          expandedProp.length = field.sql.length;
        }
      } else if (sqlType === "TINYINT") {
        expandedProp.type = "TinyInt";
      } else if (sqlType === "INT" || sqlType === "INTEGER") {
        expandedProp.type = "Int";
      } else if (sqlType === "BIGINT") {
        expandedProp.type = "BigInt";
      } else if (sqlType === "TEXT") {
        expandedProp.type = "Text";
      } else if (sqlType === "BOOLEAN" || sqlType === "BOOL") {
        expandedProp.type = "Boolean";
      } else if (sqlType === "DECIMAL") {
        expandedProp.type = "Decimal";
        if (field.sql.precision) expandedProp.precision = field.sql.precision;
        if (field.sql.scale) expandedProp.scale = field.sql.scale;
      } else if (sqlType === "DATE") {
        expandedProp.type = "Date";
      } else if (sqlType === "TIMESTAMP" || sqlType === "DATETIME") {
        expandedProp.type = "Timestamp";
      }
      if (field.sql.unsigned) {
        expandedProp.unsigned = true;
      }
      if (field.sql.default !== void 0) {
        expandedProp.default = field.sql.default;
      }
      if (field.sql.nullable !== void 0) {
        expandedProp.nullable = field.sql.nullable;
      } else if (baseProp.nullable !== void 0) {
        expandedProp.nullable = baseProp.nullable;
      }
      if (fieldOverride?.nullable !== void 0) {
        expandedProp.nullable = fieldOverride.nullable;
      }
    }
    if (baseProp.displayName) {
      const resolvedDisplayName = (0, import_omnify_types.resolveLocalizedString)(
        baseProp.displayName,
        options.locale
      );
      if (resolvedDisplayName) {
        expandedProp.displayName = `${resolvedDisplayName} (${field.suffix})`;
      }
    }
    expanded.push({
      name: columnName,
      property: expandedProp
    });
  }
  return expanded;
}
function schemaToBlueprint(schema, allSchemas, options = {}) {
  const { customTypes = /* @__PURE__ */ new Map(), pluginEnums = /* @__PURE__ */ new Map(), locale } = options;
  const compoundOptions = { locale, pluginEnums };
  const tableName = schema.options?.tableName ?? toTableName(schema.name);
  const columns = [];
  const foreignKeys = [];
  const indexes = [];
  const explicitColumnNames = /* @__PURE__ */ new Set();
  if (schema.properties) {
    for (const [propName, property] of Object.entries(schema.properties)) {
      if (property.type !== "Association") {
        explicitColumnNames.add(toColumnName(propName));
      }
    }
  }
  if (hasAutoId(schema)) {
    const pkType = getIdType(schema);
    columns.push(generatePrimaryKeyColumn(pkType));
  }
  const pivotFor = schema.pivotFor;
  if (schema.kind === "pivot" && pivotFor && pivotFor.length === 2) {
    for (const targetSchemaName of pivotFor) {
      const targetSchema = allSchemas[targetSchemaName];
      const fkColumnName = `${toColumnName(targetSchemaName)}_id`;
      if (!explicitColumnNames.has(fkColumnName)) {
        const targetIdType = targetSchema?.options?.idType ?? "BigInt";
        const columnType = targetIdType === "Uuid" ? "uuid" : targetIdType === "String" ? "string" : "unsignedBigInteger";
        columns.push({
          name: fkColumnName,
          method: columnType,
          args: [fkColumnName],
          // Column name must be first arg
          modifiers: []
        });
        explicitColumnNames.add(fkColumnName);
      }
      const targetTableName = targetSchema?.options?.tableName ?? toTableName(targetSchemaName);
      foreignKeys.push({
        columns: [fkColumnName],
        references: "id",
        on: [targetTableName],
        onDelete: "CASCADE"
      });
      indexes.push({
        columns: [fkColumnName],
        unique: false
      });
    }
  }
  const columnOptions = { locale };
  if (schema.properties) {
    for (const [propName, property] of Object.entries(schema.properties)) {
      const expandedProps = expandCompoundType(propName, property, customTypes, compoundOptions);
      if (expandedProps) {
        for (const { name: expandedName, property: expandedProp } of expandedProps) {
          const columnMethod2 = propertyToColumnMethod(expandedName, expandedProp, columnOptions);
          if (columnMethod2) {
            columns.push(columnMethod2);
          }
        }
        continue;
      }
      const columnMethod = propertyToColumnMethod(propName, property, columnOptions);
      if (columnMethod) {
        columns.push(columnMethod);
      }
      const fkResult = generateForeignKey(propName, property, allSchemas, columnOptions);
      if (fkResult) {
        if (!explicitColumnNames.has(fkResult.column.name)) {
          columns.push(fkResult.column);
        }
        foreignKeys.push(fkResult.foreignKey);
        indexes.push(fkResult.index);
      }
      const polyResult = generatePolymorphicColumns(propName, property, allSchemas);
      if (polyResult) {
        columns.push(polyResult.typeColumn);
        columns.push(polyResult.idColumn);
        indexes.push(...polyResult.indexes);
      }
    }
  }
  if (schema.options?.timestamps !== false) {
    columns.push(...generateTimestampColumns());
  }
  if (schema.options?.softDelete) {
    columns.push(generateSoftDeleteColumn());
  }
  if (schema.options?.indexes) {
    const propToColName = (propName) => {
      const colName = toColumnName(propName);
      const prop = schema.properties?.[propName];
      if (prop?.type === "Association") {
        const assoc = prop;
        if ((assoc.relation === "ManyToOne" || assoc.relation === "OneToOne") && !assoc.mappedBy) {
          return colName + "_id";
        }
      }
      return colName;
    };
    for (const index of schema.options.indexes) {
      if (typeof index === "string") {
        indexes.push({
          columns: [propToColName(index)],
          unique: false
        });
      } else {
        indexes.push({
          name: index.name,
          columns: index.columns.map(propToColName),
          unique: index.unique ?? false
        });
      }
    }
  }
  if (schema.options?.unique) {
    const propToColName = (propName) => {
      const colName = toColumnName(propName);
      const prop = schema.properties?.[propName];
      if (prop?.type === "Association") {
        const assoc = prop;
        if ((assoc.relation === "ManyToOne" || assoc.relation === "OneToOne") && !assoc.mappedBy) {
          return colName + "_id";
        }
      }
      return colName;
    };
    const uniqueConstraints = Array.isArray(schema.options.unique[0]) ? schema.options.unique : [schema.options.unique];
    for (const constraint of uniqueConstraints) {
      indexes.push({
        columns: constraint.map(propToColName),
        unique: true
      });
    }
  }
  const seenIndexes = /* @__PURE__ */ new Set();
  const uniqueIndexes = indexes.filter((idx) => {
    const key = idx.columns.join(",") + (idx.unique ? ":unique" : "");
    if (seenIndexes.has(key)) {
      return false;
    }
    seenIndexes.add(key);
    return true;
  });
  let primaryKey;
  if (hasAutoId(schema)) {
    primaryKey = ["id"];
  } else if (schema.properties) {
    const pkColumns = [];
    for (const [propName, property] of Object.entries(schema.properties)) {
      if (property.primary) {
        pkColumns.push(toColumnName(propName));
      }
    }
    if (pkColumns.length > 0) {
      primaryKey = pkColumns;
    }
  }
  const pivotForPk = schema.pivotFor;
  if (schema.kind === "pivot" && !hasAutoId(schema) && !primaryKey && pivotForPk && pivotForPk.length === 2) {
    primaryKey = pivotForPk.map((name) => `${toColumnName(name)}_id`);
  }
  let finalColumns = columns;
  if (primaryKey && primaryKey.length > 1) {
    const pkSet = new Set(primaryKey);
    finalColumns = columns.map((col) => {
      if (pkSet.has(col.name)) {
        const filteredModifiers = col.modifiers.filter((mod) => mod.method !== "primary");
        return { ...col, modifiers: filteredModifiers };
      }
      return col;
    });
  }
  return {
    tableName,
    columns: finalColumns,
    primaryKey,
    foreignKeys,
    indexes: uniqueIndexes
  };
}
function formatColumnMethod(column) {
  const args = column.args.map((arg) => {
    if (typeof arg === "string") {
      return `'${arg}'`;
    }
    if (Array.isArray(arg)) {
      return `[${arg.map((v) => `'${v}'`).join(", ")}]`;
    }
    return String(arg);
  }).join(", ");
  let code = `$table->${column.method}(${args})`;
  for (const modifier of column.modifiers) {
    if (modifier.args && modifier.args.length > 0) {
      const modArgs = modifier.args.map((arg) => {
        if (typeof arg === "string") {
          return `'${arg}'`;
        }
        if (typeof arg === "boolean") {
          return arg ? "true" : "false";
        }
        if (typeof arg === "number") {
          return String(arg);
        }
        return String(arg);
      }).join(", ");
      code += `->${modifier.method}(${modArgs})`;
    } else {
      code += `->${modifier.method}()`;
    }
  }
  return code + ";";
}
function formatForeignKey(fk) {
  const column = fk.columns[0];
  const table = fk.on[0];
  let code = `$table->foreign('${column}')->references('${fk.references}')->on('${table}')`;
  if (fk.onDelete) {
    code += `->onDelete('${fk.onDelete}')`;
  }
  if (fk.onUpdate) {
    code += `->onUpdate('${fk.onUpdate}')`;
  }
  return code + ";";
}
function formatIndex(index) {
  const columns = index.columns.length === 1 ? `'${index.columns[0]}'` : `[${index.columns.map((c) => `'${c}'`).join(", ")}]`;
  const method = index.unique ? "unique" : "index";
  const name = index.name ? `, '${index.name}'` : "";
  return `$table->${method}(${columns}${name});`;
}
function generatePivotTableName(sourceTable, targetTable, customName) {
  if (customName) {
    return customName;
  }
  const tables = [sourceTable, targetTable].sort();
  const singular1 = singularize(tables[0]);
  const singular2 = singularize(tables[1]);
  return `${singular1}_${singular2}`;
}
function extractManyToManyRelations(schema, allSchemas) {
  const pivotTables = [];
  if (!schema.properties) {
    return pivotTables;
  }
  const sourceTable = toTableName(schema.name);
  const sourcePkType = getIdType(schema);
  for (const [, property] of Object.entries(schema.properties)) {
    if (property.type !== "Association") {
      continue;
    }
    const assocProp = property;
    if (assocProp.relation !== "ManyToMany") {
      continue;
    }
    if (assocProp.mappedBy) {
      continue;
    }
    const targetName = assocProp.target;
    if (!targetName) {
      continue;
    }
    const targetSchema = allSchemas[targetName];
    const targetTable = toTableName(targetName);
    const targetPkType = targetSchema ? getIdType(targetSchema) : "BigInt";
    let isOwningSide;
    if (assocProp.owning !== void 0) {
      isOwningSide = assocProp.owning;
    } else if (assocProp.pivotFields && Object.keys(assocProp.pivotFields).length > 0) {
      isOwningSide = true;
    } else {
      let targetHasMappedByToThisSide = false;
      if (targetSchema?.properties) {
        for (const [, targetProp] of Object.entries(targetSchema.properties)) {
          if (targetProp.type !== "Association") continue;
          const targetAssoc = targetProp;
          if (targetAssoc.relation === "ManyToMany" && targetAssoc.target === schema.name && targetAssoc.mappedBy) {
            targetHasMappedByToThisSide = true;
            break;
          }
        }
      }
      if (targetHasMappedByToThisSide) {
        isOwningSide = true;
      } else {
        isOwningSide = schema.name < targetName;
      }
    }
    if (!isOwningSide) {
      continue;
    }
    const pivotTableName = generatePivotTableName(sourceTable, targetTable, assocProp.joinTable);
    const sourceColumn = singularize(sourceTable) + "_id";
    const targetColumn = singularize(targetTable) + "_id";
    const pivotFields = [];
    if (assocProp.pivotFields) {
      for (const [fieldName, fieldDef] of Object.entries(assocProp.pivotFields)) {
        let enumValues;
        if (fieldDef.type === "Enum") {
          const rawEnum = fieldDef.enum;
          if (rawEnum && Array.isArray(rawEnum)) {
            enumValues = rawEnum.map((v) => typeof v === "string" ? v : v.value);
          }
        }
        pivotFields.push({
          name: toColumnName(fieldName),
          type: fieldDef.type,
          nullable: fieldDef.nullable,
          default: fieldDef.default,
          length: fieldDef.length,
          unsigned: fieldDef.unsigned,
          enum: enumValues
        });
      }
    }
    pivotTables.push({
      tableName: pivotTableName,
      sourceTable,
      targetTable,
      sourceColumn,
      targetColumn,
      sourcePkType,
      targetPkType,
      onDelete: assocProp.onDelete,
      onUpdate: assocProp.onUpdate,
      pivotFields: pivotFields.length > 0 ? pivotFields : void 0
    });
  }
  return pivotTables;
}
function pivotFieldToColumn(field) {
  const method = TYPE_METHOD_MAP[field.type] ?? "string";
  const args = [field.name];
  const modifiers = [];
  if (method === "string" && field.length) {
    args.push(field.length);
  }
  if (field.type === "Enum" && field.enum && field.enum.length > 0) {
    args.push(field.enum);
  }
  if (field.nullable) {
    modifiers.push({ method: "nullable" });
  }
  if (field.default !== void 0 && field.default !== null) {
    modifiers.push({ method: "default", args: [field.default] });
  }
  if (field.unsigned && (method === "tinyInteger" || method === "integer" || method === "bigInteger")) {
    modifiers.push({ method: "unsigned" });
  }
  return {
    name: field.name,
    method,
    args,
    modifiers
  };
}
function generatePivotTableBlueprint(pivot) {
  const columns = [];
  const foreignKeys = [];
  const indexes = [];
  const getMethodForPkType = (pkType) => {
    switch (pkType) {
      case "Int":
        return "unsignedInteger";
      case "Uuid":
        return "uuid";
      case "String":
        return "string";
      default:
        return "unsignedBigInteger";
    }
  };
  columns.push({
    name: pivot.sourceColumn,
    method: getMethodForPkType(pivot.sourcePkType),
    args: [pivot.sourceColumn],
    modifiers: []
  });
  columns.push({
    name: pivot.targetColumn,
    method: getMethodForPkType(pivot.targetPkType),
    args: [pivot.targetColumn],
    modifiers: []
  });
  if (pivot.pivotFields && pivot.pivotFields.length > 0) {
    for (const field of pivot.pivotFields) {
      columns.push(pivotFieldToColumn(field));
    }
  }
  columns.push(...generateTimestampColumns());
  foreignKeys.push({
    columns: [pivot.sourceColumn],
    references: "id",
    on: [pivot.sourceTable],
    onDelete: pivot.onDelete ?? "cascade",
    onUpdate: pivot.onUpdate ?? "cascade"
  });
  foreignKeys.push({
    columns: [pivot.targetColumn],
    references: "id",
    on: [pivot.targetTable],
    onDelete: pivot.onDelete ?? "cascade",
    onUpdate: pivot.onUpdate ?? "cascade"
  });
  indexes.push({
    columns: [pivot.sourceColumn, pivot.targetColumn],
    unique: true
  });
  indexes.push({
    columns: [pivot.sourceColumn],
    unique: false
  });
  indexes.push({
    columns: [pivot.targetColumn],
    unique: false
  });
  return {
    tableName: pivot.tableName,
    columns,
    primaryKey: [pivot.sourceColumn, pivot.targetColumn],
    foreignKeys,
    indexes
  };
}
function extractMorphToManyRelations(schema, allSchemas) {
  const morphPivotTables = [];
  if (!schema.properties) {
    return morphPivotTables;
  }
  for (const [propName, property] of Object.entries(schema.properties)) {
    if (property.type !== "Association") {
      continue;
    }
    const assocProp = property;
    if (assocProp.relation !== "MorphToMany") {
      continue;
    }
    const targetName = assocProp.target;
    if (!targetName) {
      continue;
    }
    const targetSchema = allSchemas[targetName];
    const targetTable = toTableName(targetName);
    const targetPkType = targetSchema ? getIdType(targetSchema) : "BigInt";
    const isOwningSide = assocProp.owning ?? schema.name < targetName;
    if (!isOwningSide) {
      continue;
    }
    const morphTargets = [];
    morphTargets.push(schema.name);
    for (const [otherName, otherSchema] of Object.entries(allSchemas)) {
      if (otherName === schema.name) continue;
      if (!otherSchema.properties) continue;
      for (const otherProp of Object.values(otherSchema.properties)) {
        if (otherProp.type !== "Association") continue;
        const otherAssoc = otherProp;
        if (otherAssoc.relation === "MorphToMany" && otherAssoc.target === targetName) {
          if (!morphTargets.includes(otherName)) {
            morphTargets.push(otherName);
          }
        }
      }
    }
    const defaultTableName = targetTable.replace(/s$/, "") + "ables";
    const tableName = assocProp.joinTable ?? defaultTableName;
    const targetColumn = singularize(targetTable) + "_id";
    const morphName = propName.replace(/s$/, "") + "able";
    morphPivotTables.push({
      tableName,
      targetTable,
      targetColumn,
      targetPkType,
      morphName,
      morphTargets,
      onDelete: assocProp.onDelete,
      onUpdate: assocProp.onUpdate
    });
  }
  return morphPivotTables;
}
function generateMorphToManyPivotBlueprint(pivot) {
  const columns = [];
  const foreignKeys = [];
  const indexes = [];
  const getMethodForPkType = (pkType) => {
    switch (pkType) {
      case "Int":
        return "unsignedInteger";
      case "Uuid":
        return "uuid";
      case "String":
        return "string";
      default:
        return "unsignedBigInteger";
    }
  };
  columns.push({
    name: pivot.targetColumn,
    method: getMethodForPkType(pivot.targetPkType),
    args: [pivot.targetColumn],
    modifiers: []
  });
  const typeColumnName = `${pivot.morphName}_type`;
  columns.push({
    name: typeColumnName,
    method: "enum",
    args: [typeColumnName, pivot.morphTargets],
    modifiers: []
  });
  const idColumnName = `${pivot.morphName}_id`;
  columns.push({
    name: idColumnName,
    method: "unsignedBigInteger",
    // Default to BigInt for polymorphic IDs
    args: [idColumnName],
    modifiers: []
  });
  foreignKeys.push({
    columns: [pivot.targetColumn],
    references: "id",
    on: [pivot.targetTable],
    onDelete: pivot.onDelete ?? "cascade",
    onUpdate: pivot.onUpdate ?? "cascade"
  });
  indexes.push({
    columns: [pivot.targetColumn, typeColumnName, idColumnName],
    unique: true
  });
  indexes.push({
    columns: [typeColumnName, idColumnName],
    unique: false
  });
  indexes.push({
    columns: [pivot.targetColumn],
    unique: false
  });
  return {
    tableName: pivot.tableName,
    columns,
    primaryKey: [pivot.targetColumn, typeColumnName, idColumnName],
    foreignKeys,
    indexes
  };
}

// src/migration/generator.ts
function generateTimestamp() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}_${month}_${day}_${hours}${minutes}${seconds}`;
}
function toClassName(tableName, type) {
  const pascalCase = tableName.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  switch (type) {
    case "create":
      return `Create${pascalCase}Table`;
    case "alter":
      return `Alter${pascalCase}Table`;
    case "drop":
      return `Drop${pascalCase}Table`;
  }
}
function generateFileName(tableName, type, timestamp) {
  const ts = timestamp ?? generateTimestamp();
  const action = type === "create" ? "create" : type === "drop" ? "drop" : "update";
  return `${ts}_${action}_${tableName}_table.php`;
}
function renderCreateTableUp(blueprint) {
  const lines = [];
  for (const column of blueprint.columns) {
    lines.push(`            ${formatColumnMethod(column)}`);
  }
  return lines.join("\n");
}
function renderForeignKeys(blueprint) {
  if (blueprint.foreignKeys.length === 0) {
    return "";
  }
  const lines = blueprint.foreignKeys.map((fk) => `            ${formatForeignKey(fk)}`);
  return "\n" + lines.join("\n");
}
function renderIndexes(blueprint) {
  const customIndexes = blueprint.indexes.filter((idx) => {
    if (idx.unique && idx.columns.length === 1) {
      return false;
    }
    return true;
  });
  if (customIndexes.length === 0) {
    return "";
  }
  const lines = customIndexes.map((idx) => `            ${formatIndex(idx)}`);
  return "\n" + lines.join("\n");
}
function renderCompositePrimaryKey(blueprint) {
  if (!blueprint.primaryKey || blueprint.primaryKey.length <= 1) {
    return "";
  }
  const columnsStr = blueprint.primaryKey.map((c) => `'${c}'`).join(", ");
  return `
            $table->primary([${columnsStr}]);`;
}
function generateCreateMigration(blueprint, options = {}) {
  const className = toClassName(blueprint.tableName, "create");
  const fileName = generateFileName(blueprint.tableName, "create", options.timestamp);
  const connection = options.connection ? `
    protected $connection = '${options.connection}';
` : "";
  const upContent = renderCreateTableUp(blueprint);
  const foreignKeyContent = renderForeignKeys(blueprint);
  const indexContent = renderIndexes(blueprint);
  const primaryKeyContent = renderCompositePrimaryKey(blueprint);
  const content = `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{${connection}
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('${blueprint.tableName}', function (Blueprint $table) {
${upContent}${foreignKeyContent}${indexContent}${primaryKeyContent}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('${blueprint.tableName}');
    }
};
`;
  return {
    fileName,
    className,
    content,
    tables: [blueprint.tableName],
    type: "create"
  };
}
function generateDropMigration(tableName, options = {}) {
  const className = toClassName(tableName, "drop");
  const fileName = generateFileName(tableName, "drop", options.timestamp);
  const connection = options.connection ? `
    protected $connection = '${options.connection}';
` : "";
  const content = `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{${connection}
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('${tableName}');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot recreate table without schema information
        // This is a one-way migration
    }
};
`;
  return {
    fileName,
    className,
    content,
    tables: [tableName],
    type: "drop"
  };
}
function extractDependencies(schema) {
  const deps = [];
  if (schema.kind === "pivot" && schema.pivotFor) {
    deps.push(...schema.pivotFor);
  }
  if (!schema.properties) {
    return deps;
  }
  for (const property of Object.values(schema.properties)) {
    if (property.type !== "Association") {
      continue;
    }
    const assocProp = property;
    if ((assocProp.relation === "ManyToOne" || assocProp.relation === "OneToOne") && !assocProp.mappedBy && assocProp.target) {
      deps.push(assocProp.target);
    }
  }
  return deps;
}
function topologicalSort(schemas) {
  const schemaList = Object.values(schemas).filter((s) => s.kind !== "enum");
  const sorted = [];
  const visited = /* @__PURE__ */ new Set();
  const visiting = /* @__PURE__ */ new Set();
  function visit(schema) {
    if (visited.has(schema.name)) {
      return;
    }
    if (visiting.has(schema.name)) {
      return;
    }
    visiting.add(schema.name);
    const deps = extractDependencies(schema);
    for (const depName of deps) {
      const depSchema = schemas[depName];
      if (depSchema && depSchema.kind !== "enum") {
        visit(depSchema);
      }
    }
    visiting.delete(schema.name);
    visited.add(schema.name);
    sorted.push(schema);
  }
  for (const schema of schemaList) {
    visit(schema);
  }
  return sorted;
}
function generateMigrations(schemas, options = {}) {
  const migrations = [];
  const pivotTablesGenerated = /* @__PURE__ */ new Set();
  let timestampOffset = 0;
  const sortedSchemas = topologicalSort(schemas);
  const baseTimestamp = options.timestamp ?? generateTimestamp();
  for (const schema of sortedSchemas) {
    const offsetTimestamp = incrementTimestamp(baseTimestamp, timestampOffset);
    timestampOffset++;
    const blueprint = schemaToBlueprint(schema, schemas, {
      customTypes: options.customTypes,
      pluginEnums: options.pluginEnums,
      locale: options.locale
    });
    const migration = generateCreateMigration(blueprint, {
      ...options,
      timestamp: offsetTimestamp
    });
    migrations.push({
      ...migration,
      schemaName: schema.name
    });
  }
  const explicitPivotTableNames = /* @__PURE__ */ new Set();
  for (const schema of sortedSchemas) {
    const schemaTableName = schema.options?.tableName ?? toTableName(schema.name);
    explicitPivotTableNames.add(schemaTableName);
  }
  for (const schema of sortedSchemas) {
    const pivotTables = extractManyToManyRelations(schema, schemas);
    for (const pivot of pivotTables) {
      if (pivotTablesGenerated.has(pivot.tableName)) {
        continue;
      }
      if (explicitPivotTableNames.has(pivot.tableName)) {
        pivotTablesGenerated.add(pivot.tableName);
        continue;
      }
      pivotTablesGenerated.add(pivot.tableName);
      const offsetTimestamp = incrementTimestamp(baseTimestamp, timestampOffset);
      timestampOffset++;
      const blueprint = generatePivotTableBlueprint(pivot);
      const migration = generateCreateMigration(blueprint, {
        ...options,
        timestamp: offsetTimestamp
      });
      migrations.push(migration);
    }
  }
  return migrations;
}
function incrementTimestamp(timestamp, seconds) {
  if (seconds === 0) return timestamp;
  const parts = timestamp.split("_");
  if (parts.length < 4) {
    return timestamp;
  }
  const yearPart = parts[0] ?? "2024";
  const monthPart = parts[1] ?? "01";
  const dayPart = parts[2] ?? "01";
  const timePart = parts[3] ?? "000000";
  const year = parseInt(yearPart, 10);
  const month = parseInt(monthPart, 10) - 1;
  const day = parseInt(dayPart, 10);
  const hours = parseInt(timePart.substring(0, 2), 10);
  const minutes = parseInt(timePart.substring(2, 4), 10);
  const secs = parseInt(timePart.substring(4, 6), 10);
  const date = new Date(year, month, day, hours, minutes, secs + seconds);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");
  const newHours = String(date.getHours()).padStart(2, "0");
  const newMinutes = String(date.getMinutes()).padStart(2, "0");
  const newSecs = String(date.getSeconds()).padStart(2, "0");
  return `${newYear}_${newMonth}_${newDay}_${newHours}${newMinutes}${newSecs}`;
}
function generateMigrationFromSchema(schema, allSchemas, options = {}) {
  const blueprint = schemaToBlueprint(schema, allSchemas);
  return generateCreateMigration(blueprint, options);
}
function generateDropMigrationForTable(tableName, options = {}) {
  return generateDropMigration(tableName, options);
}
function formatMigrationFile(migration) {
  return migration.content;
}
function getMigrationPath(migration, outputDir = "database/migrations") {
  return `${outputDir}/${migration.fileName}`;
}

// src/migration/alter-generator.ts
var TYPE_METHOD_MAP2 = {
  String: "string",
  TinyInt: "tinyInteger",
  Int: "integer",
  BigInt: "bigInteger",
  Float: "double",
  Decimal: "decimal",
  Boolean: "boolean",
  Text: "text",
  MediumText: "mediumText",
  LongText: "longText",
  Date: "date",
  Time: "time",
  DateTime: "dateTime",
  Timestamp: "timestamp",
  Json: "json",
  Email: "string",
  Password: "string",
  File: "string",
  MultiFile: "json",
  Enum: "enum",
  Select: "string",
  Lookup: "unsignedBigInteger"
};
function isAssociationWithFkColumn(prop) {
  if (prop.type !== "Association") return false;
  const relation = prop.relation;
  if (relation !== "ManyToOne" && relation !== "OneToOne") return false;
  if (prop.mappedBy) return false;
  return true;
}
function getAssociationFkColumnName(columnName) {
  const snakeColumn = toColumnName(columnName);
  return `${snakeColumn}_id`;
}
function generateTimestamp2() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}_${month}_${day}_${hours}${minutes}${seconds}`;
}
function formatAddColumn(columnName, prop) {
  const lines = [];
  if (isAssociationWithFkColumn(prop)) {
    const fkColumn = getAssociationFkColumnName(columnName);
    let code2 = `$table->unsignedBigInteger('${fkColumn}')`;
    if (prop.nullable) code2 += "->nullable()";
    lines.push(code2 + ";");
    if (prop.target) {
      const targetTable = toTableName(prop.target);
      let fkCode = `$table->foreign('${fkColumn}')->references('id')->on('${targetTable}')`;
      if (prop.onDelete) {
        fkCode += `->onDelete('${prop.onDelete}')`;
      }
      if (prop.onUpdate) {
        fkCode += `->onUpdate('${prop.onUpdate}')`;
      }
      lines.push(fkCode + ";");
    }
    return lines;
  }
  const snakeColumn = toColumnName(columnName);
  const method = TYPE_METHOD_MAP2[prop.type] ?? "string";
  let code;
  if (prop.type === "Decimal") {
    const precision = prop.precision ?? 8;
    const scale = prop.scale ?? 2;
    code = `$table->${method}('${snakeColumn}', ${precision}, ${scale})`;
  } else {
    code = `$table->${method}('${snakeColumn}')`;
  }
  if (prop.nullable) code += "->nullable()";
  if (prop.unique) code += "->unique()";
  if (prop.default !== void 0) {
    const defaultValue = typeof prop.default === "string" ? `'${prop.default}'` : JSON.stringify(prop.default);
    code += `->default(${defaultValue})`;
  }
  lines.push(code + ";");
  return lines;
}
function formatDropColumn(columnName, prop) {
  const lines = [];
  if (prop && isAssociationWithFkColumn(prop)) {
    const fkColumn = getAssociationFkColumnName(columnName);
    lines.push(`$table->dropForeign(['${fkColumn}']);`);
    lines.push(`$table->dropColumn('${fkColumn}');`);
    return lines;
  }
  const snakeColumn = toColumnName(columnName);
  lines.push(`$table->dropColumn('${snakeColumn}');`);
  return lines;
}
function formatRenameColumn(oldName, newName) {
  const oldSnake = toColumnName(oldName);
  const newSnake = toColumnName(newName);
  return `$table->renameColumn('${oldSnake}', '${newSnake}');`;
}
function formatModifyColumn(columnName, _prevProp, currProp) {
  const snakeColumn = toColumnName(columnName);
  const method = TYPE_METHOD_MAP2[currProp.type] ?? "string";
  let code;
  if (currProp.type === "Decimal") {
    const precision = currProp.precision ?? 8;
    const scale = currProp.scale ?? 2;
    code = `$table->${method}('${snakeColumn}', ${precision}, ${scale})`;
  } else {
    code = `$table->${method}('${snakeColumn}')`;
  }
  if (currProp.nullable) code += "->nullable()";
  if (currProp.unique) code += "->unique()";
  if (currProp.default !== void 0) {
    const defaultValue = typeof currProp.default === "string" ? `'${currProp.default}'` : JSON.stringify(currProp.default);
    code += `->default(${defaultValue})`;
  }
  return code + "->change();";
}
function formatAddIndex(columns, unique) {
  const snakeColumns = columns.map(toColumnName);
  const method = unique ? "unique" : "index";
  const colsArg = snakeColumns.length === 1 ? `'${snakeColumns[0]}'` : `[${snakeColumns.map((c) => `'${c}'`).join(", ")}]`;
  return `$table->${method}(${colsArg});`;
}
function formatDropIndex(tableName, columns, unique) {
  const snakeColumns = columns.map(toColumnName);
  const method = unique ? "dropUnique" : "dropIndex";
  const suffix = unique ? "unique" : "index";
  const indexName = `${tableName}_${snakeColumns.join("_")}_${suffix}`;
  return `$table->${method}('${indexName}');`;
}
function generateAlterMigrationContent(tableName, change, options = {}) {
  const upLines = [];
  const downLines = [];
  if (change.columnChanges) {
    for (const col of change.columnChanges) {
      if (col.changeType === "added" && col.currentDef) {
        const addLines = formatAddColumn(col.column, col.currentDef);
        for (const line of addLines) {
          upLines.push(`            ${line}`);
        }
        const dropLines = formatDropColumn(col.column, col.currentDef);
        for (const line of dropLines) {
          downLines.push(`            ${line}`);
        }
      } else if (col.changeType === "removed" && col.previousDef) {
        const dropLines = formatDropColumn(col.column, col.previousDef);
        for (const line of dropLines) {
          upLines.push(`            ${line}`);
        }
        const addLines = formatAddColumn(col.column, col.previousDef);
        for (const line of addLines) {
          downLines.push(`            ${line}`);
        }
      } else if (col.changeType === "modified" && col.previousDef && col.currentDef) {
        upLines.push(`            ${formatModifyColumn(col.column, col.previousDef, col.currentDef)}`);
        downLines.push(`            ${formatModifyColumn(col.column, col.currentDef, col.previousDef)}`);
      } else if (col.changeType === "renamed" && col.previousColumn) {
        upLines.push(`            ${formatRenameColumn(col.previousColumn, col.column)}`);
        downLines.push(`            ${formatRenameColumn(col.column, col.previousColumn)}`);
        if (col.modifications && col.modifications.length > 0 && col.previousDef && col.currentDef) {
          upLines.push(`            ${formatModifyColumn(col.column, col.previousDef, col.currentDef)}`);
          downLines.push(`            ${formatModifyColumn(col.column, col.currentDef, col.previousDef)}`);
        }
      }
    }
  }
  if (change.indexChanges) {
    for (const idx of change.indexChanges) {
      if (idx.changeType === "added") {
        upLines.push(`            ${formatAddIndex(idx.index.columns, idx.index.unique)}`);
        downLines.push(`            ${formatDropIndex(tableName, idx.index.columns, idx.index.unique)}`);
      } else {
        upLines.push(`            ${formatDropIndex(tableName, idx.index.columns, idx.index.unique)}`);
        downLines.push(`            ${formatAddIndex(idx.index.columns, idx.index.unique)}`);
      }
    }
  }
  if (change.optionChanges) {
    if (change.optionChanges.timestamps) {
      const { from, to } = change.optionChanges.timestamps;
      if (to && !from) {
        upLines.push(`            $table->timestamps();`);
        downLines.push(`            $table->dropTimestamps();`);
      } else if (from && !to) {
        upLines.push(`            $table->dropTimestamps();`);
        downLines.push(`            $table->timestamps();`);
      }
    }
    if (change.optionChanges.softDelete) {
      const { from, to } = change.optionChanges.softDelete;
      if (to && !from) {
        upLines.push(`            $table->softDeletes();`);
        downLines.push(`            $table->dropSoftDeletes();`);
      } else if (from && !to) {
        upLines.push(`            $table->dropSoftDeletes();`);
        downLines.push(`            $table->softDeletes();`);
      }
    }
    if (change.optionChanges.idType) {
      const { from, to } = change.optionChanges.idType;
      const fromType = from ?? "BigInt";
      const toType = to ?? "BigInt";
      const getColumnMethod = (type) => {
        switch (type) {
          case "Uuid":
            return "uuid";
          case "Int":
            return "unsignedInteger";
          case "String":
            return "string";
          default:
            return "unsignedBigInteger";
        }
      };
      const toMethod = getColumnMethod(toType);
      const fromMethod = getColumnMethod(fromType);
      upLines.push(`            // Changing primary key type from ${fromType} to ${toType}`);
      upLines.push(`            // Note: This requires doctrine/dbal package`);
      if (toType === "Uuid") {
        upLines.push(`            $table->dropPrimary('id');`);
        upLines.push(`            $table->uuid('id')->change();`);
        upLines.push(`            $table->primary('id');`);
      } else if (fromType === "Uuid") {
        upLines.push(`            $table->dropPrimary('id');`);
        upLines.push(`            $table->${toMethod}('id')->change();`);
        upLines.push(`            $table->primary('id');`);
      } else {
        upLines.push(`            $table->${toMethod}('id')->change();`);
      }
      downLines.push(`            // Reverting primary key type from ${toType} to ${fromType}`);
      if (fromType === "Uuid") {
        downLines.push(`            $table->dropPrimary('id');`);
        downLines.push(`            $table->uuid('id')->change();`);
        downLines.push(`            $table->primary('id');`);
      } else if (toType === "Uuid") {
        downLines.push(`            $table->dropPrimary('id');`);
        downLines.push(`            $table->${fromMethod}('id')->change();`);
        downLines.push(`            $table->primary('id');`);
      } else {
        downLines.push(`            $table->${fromMethod}('id')->change();`);
      }
    }
  }
  const connection = options.connection ? `
    protected $connection = '${options.connection}';
` : "";
  return `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{${connection}
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('${tableName}', function (Blueprint $table) {
${upLines.join("\n")}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('${tableName}', function (Blueprint $table) {
${downLines.join("\n")}
        });
    }
};
`;
}
function generateAlterMigration(change, options = {}) {
  if (change.changeType !== "modified") {
    return null;
  }
  const hasChanges = change.columnChanges && change.columnChanges.length > 0 || change.indexChanges && change.indexChanges.length > 0 || change.optionChanges && (change.optionChanges.timestamps || change.optionChanges.softDelete || change.optionChanges.idType);
  if (!hasChanges) {
    return null;
  }
  const tableName = toTableName(change.schemaName);
  const timestamp = options.timestamp ?? generateTimestamp2();
  const fileName = `${timestamp}_update_${tableName}_table.php`;
  const content = generateAlterMigrationContent(tableName, change, options);
  return {
    fileName,
    className: `Update${change.schemaName}Table`,
    content,
    tables: [tableName],
    type: "alter"
  };
}
function generateDropTableMigration(schemaName, options = {}) {
  const tableName = toTableName(schemaName);
  const timestamp = options.timestamp ?? generateTimestamp2();
  const fileName = `${timestamp}_drop_${tableName}_table.php`;
  const connection = options.connection ? `
    protected $connection = '${options.connection}';
` : "";
  const content = `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{${connection}
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('${tableName}');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot recreate table without full schema
        // Consider restoring from backup if needed
    }
};
`;
  return {
    fileName,
    className: `Drop${schemaName}Table`,
    content,
    tables: [tableName],
    type: "drop"
  };
}
function generateMigrationsFromChanges(changes, options = {}) {
  const migrations = [];
  let timestampOffset = 0;
  const baseTimestamp = options.timestamp ?? generateTimestamp2();
  const getNextTimestamp = () => {
    const offset = timestampOffset++;
    if (offset === 0) return baseTimestamp;
    const parts = baseTimestamp.split("_");
    if (parts.length >= 4) {
      const timePart = parts[3] ?? "000000";
      const secs = parseInt(timePart.substring(4, 6), 10) + offset;
      const newSecs = String(secs % 60).padStart(2, "0");
      parts[3] = timePart.substring(0, 4) + newSecs;
      return parts.join("_");
    }
    return baseTimestamp;
  };
  for (const change of changes) {
    if (change.changeType === "modified") {
      const migration = generateAlterMigration(change, {
        ...options,
        timestamp: getNextTimestamp()
      });
      if (migration) {
        migrations.push(migration);
      }
    } else if (change.changeType === "removed") {
      migrations.push(
        generateDropTableMigration(change.schemaName, {
          ...options,
          timestamp: getNextTimestamp()
        })
      );
    }
  }
  return migrations;
}

// src/model/generator.ts
var import_omnify_types2 = require("@famgia/omnify-types");
var DEFAULT_OPTIONS = {
  baseModelNamespace: "App\\Models\\OmnifyBase",
  modelNamespace: "App\\Models",
  baseModelClassName: "BaseModel",
  baseModelPath: "app/Models/OmnifyBase",
  modelPath: "app/Models",
  providersPath: "app/Providers",
  customTypes: /* @__PURE__ */ new Map()
};
function generateLocalizedDisplayNames(displayName, indent = "        ") {
  if (displayName === void 0) {
    return "";
  }
  if (typeof displayName === "string") {
    return `${indent}'en' => '${escapePhpString(displayName)}',`;
  }
  if ((0, import_omnify_types2.isLocaleMap)(displayName)) {
    const entries = Object.entries(displayName).map(([locale, value]) => `${indent}'${locale}' => '${escapePhpString(value)}',`).join("\n");
    return entries;
  }
  return "";
}
function generatePropertyLocalizedDisplayNames(schema, indent = "        ") {
  const properties = schema.properties ?? {};
  const entries = [];
  for (const [propName, propDef] of Object.entries(properties)) {
    const snakeName = toSnakeCase(propName);
    const displayName = propDef.displayName;
    if (displayName === void 0) {
      continue;
    }
    const innerIndent = indent + "    ";
    if (typeof displayName === "string") {
      entries.push(`${indent}'${snakeName}' => [
${innerIndent}'en' => '${escapePhpString(displayName)}',
${indent}],`);
    } else if ((0, import_omnify_types2.isLocaleMap)(displayName)) {
      const localeEntries = Object.entries(displayName).map(([locale, value]) => `${innerIndent}'${locale}' => '${escapePhpString(value)}',`).join("\n");
      entries.push(`${indent}'${snakeName}' => [
${localeEntries}
${indent}],`);
    }
  }
  return entries.join("\n");
}
function escapePhpString(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function resolveOptions(options) {
  return {
    baseModelNamespace: options?.baseModelNamespace ?? DEFAULT_OPTIONS.baseModelNamespace,
    modelNamespace: options?.modelNamespace ?? DEFAULT_OPTIONS.modelNamespace,
    baseModelClassName: options?.baseModelClassName ?? DEFAULT_OPTIONS.baseModelClassName,
    baseModelPath: options?.baseModelPath ?? DEFAULT_OPTIONS.baseModelPath,
    modelPath: options?.modelPath ?? DEFAULT_OPTIONS.modelPath,
    providersPath: options?.providersPath ?? DEFAULT_OPTIONS.providersPath,
    customTypes: options?.customTypes ?? /* @__PURE__ */ new Map()
  };
}
function resolveSchemaOptions(schema, globalOptions) {
  const pkgOutput = schema.packageOutput?.laravel;
  if (!pkgOutput) {
    return globalOptions;
  }
  const base = pkgOutput.base;
  const modelsNs = pkgOutput.modelsNamespace;
  const baseNs = modelsNs.replace(/\\Models$/, "");
  return {
    modelNamespace: modelsNs,
    baseModelNamespace: pkgOutput.baseModelsNamespace ?? `${modelsNs}\\OmnifyBase`,
    baseModelClassName: "BaseModel",
    modelPath: `${base}/${pkgOutput.modelsPath ?? "src/Models"}`,
    baseModelPath: `${base}/${pkgOutput.baseModelsPath ?? "src/Models/OmnifyBase"}`,
    providersPath: `${base}/${pkgOutput.providersPath ?? "src/Providers"}`,
    customTypes: globalOptions.customTypes
  };
}
function getCastType(propDef) {
  switch (propDef.type) {
    case "Boolean":
      return "boolean";
    case "Int":
    case "BigInt":
      return "integer";
    case "Float":
      return "float";
    case "Decimal":
      return "decimal:" + (propDef.scale ?? 2);
    case "Json":
      return "array";
    case "Date":
      return "date";
    case "DateTime":
    case "Timestamp":
      return "datetime";
    case "Password":
      return "hashed";
    default:
      return null;
  }
}
function isNullable(propDef) {
  return "nullable" in propDef && propDef.nullable === true;
}
function getPhpDocType(propDef, schemas) {
  const nullable = isNullable(propDef);
  switch (propDef.type) {
    case "String":
    case "Text":
    case "LongText":
    case "Email":
    case "Password":
      return "string" + (nullable ? "|null" : "");
    case "Int":
    case "BigInt":
      return "int" + (nullable ? "|null" : "");
    case "Float":
    case "Decimal":
      return "float" + (nullable ? "|null" : "");
    case "Boolean":
      return "bool" + (nullable ? "|null" : "");
    case "Date":
    case "DateTime":
    case "Time":
    case "Timestamp":
      return "\\Carbon\\Carbon" + (nullable ? "|null" : "");
    case "Json":
      return "array" + (nullable ? "|null" : "");
    case "Enum":
    case "EnumRef":
      return "string" + (nullable ? "|null" : "");
    case "Association": {
      const assoc = propDef;
      if (assoc.target) {
        const className = toPascalCase(assoc.target);
        switch (assoc.relation) {
          case "OneToMany":
          case "ManyToMany":
          case "MorphMany":
          case "MorphToMany":
          case "MorphedByMany":
            return `\\Illuminate\\Database\\Eloquent\\Collection<${className}>`;
          default:
            return className + "|null";
        }
      }
      return "mixed";
    }
    default:
      return "mixed";
  }
}
function generateBaseModel(schemas, options, stubContent) {
  const modelMap = Object.values(schemas).filter((s) => s.kind !== "enum" && s.kind !== "partial").map((s) => {
    const className = toPascalCase(s.name);
    return `        '${s.name}' => \\${options.modelNamespace}\\${className}::class,`;
  }).join("\n");
  const content = stubContent.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace).replace(/\{\{BASE_MODEL_CLASS\}\}/g, options.baseModelClassName).replace(/\{\{MODEL_MAP\}\}/g, modelMap);
  return {
    path: `${options.baseModelPath}/${options.baseModelClassName}.php`,
    content,
    type: "base-model",
    overwrite: true,
    schemaName: "__base__"
  };
}
function generateEntityBaseModel(schema, schemas, options, stubContent, authStubContent, pivotStubContent) {
  const className = toPascalCase(schema.name);
  const tableName = schema.options?.tableName ?? pluralize(toSnakeCase(schema.name));
  const isAuth = schema.options?.authenticatable ?? false;
  const hasAutoId2 = schema.options?.id !== false;
  let primaryKey = "id";
  let isStringKey = false;
  let isUuid = false;
  let isNonIncrementing = false;
  if (hasAutoId2) {
    const idType = schema.options?.idType ?? "BigInt";
    isUuid = idType === "Uuid";
    isStringKey = idType === "Uuid" || idType === "String";
    isNonIncrementing = isUuid;
  } else {
    const properties2 = schema.properties ?? {};
    for (const [propName, propDef] of Object.entries(properties2)) {
      if (propDef.primary === true) {
        primaryKey = toSnakeCase(propName);
        const propType = propDef.type;
        isStringKey = propType === "String" || propType === "Text" || propType === "Email";
        isNonIncrementing = true;
        break;
      }
    }
  }
  const imports = [];
  const traits = [];
  const fillable = [];
  const hidden = [];
  const appends = [];
  const casts = [];
  const relations = [];
  const docProperties = [];
  if (schema.options?.softDelete) {
    imports.push("use Illuminate\\Database\\Eloquent\\SoftDeletes;");
    traits.push("    use SoftDeletes;");
  }
  const properties = schema.properties ?? {};
  for (const [propName, propDef] of Object.entries(properties)) {
    const snakeName = toSnakeCase(propName);
    const typeDef = options.customTypes.get(propDef.type);
    const isCompoundType = typeDef?.compound && typeDef.expand;
    if (!isCompoundType) {
      const phpType = getPhpDocType(propDef, schemas);
      docProperties.push(` * @property ${phpType} $${snakeName}`);
    }
    if (propDef.type === "Association") {
      const assoc = propDef;
      if (assoc.target) {
        imports.push(`use ${options.modelNamespace}\\${toPascalCase(assoc.target)};`);
      }
      relations.push(generateRelation(propName, assoc, schema, schemas, options));
      if (assoc.relation === "ManyToOne" || assoc.relation === "OneToOne") {
        if (!assoc.mappedBy) {
          const fkName = toSnakeCase(propName) + "_id";
          fillable.push(`        '${fkName}',`);
          const targetSchema = assoc.target ? schemas[assoc.target] : void 0;
          const targetIdType = targetSchema?.options?.idType ?? "BigInt";
          const fkPhpType = targetIdType === "Uuid" || targetIdType === "String" ? "string" : "int";
          docProperties.push(` * @property ${fkPhpType}|null $${fkName}`);
        }
      }
      if (assoc.relation === "MorphTo") {
        const morphTargets = assoc.targets;
        const baseName = toSnakeCase(propName);
        const typeCol = `${baseName}_type`;
        const idCol = `${baseName}_id`;
        fillable.push(`        '${typeCol}',`);
        fillable.push(`        '${idCol}',`);
        let usesUuid = false;
        let usesMixed = false;
        const idTypes = /* @__PURE__ */ new Set();
        if (morphTargets) {
          for (const target of morphTargets) {
            const targetSchema = schemas[target];
            if (targetSchema) {
              const targetIdType = targetSchema.options?.idType ?? "BigInt";
              idTypes.add(targetIdType);
              if (targetIdType === "Uuid") usesUuid = true;
            }
          }
          usesMixed = idTypes.size > 1;
        }
        if (usesUuid || usesMixed) {
          casts.push(`            '${idCol}' => 'string',`);
        }
        docProperties.push(` * @property string|null $${typeCol}`);
        docProperties.push(` * @property string|int|null $${idCol}`);
      }
    } else if (propDef.type === "Password") {
      const propWithFillable = propDef;
      if (propWithFillable.fillable !== false) {
        fillable.push(`        '${snakeName}',`);
      }
      hidden.push(`        '${snakeName}',`);
      const cast = getCastType(propDef);
      if (cast) {
        casts.push(`            '${snakeName}' => '${cast}',`);
      }
    } else if (propDef.type === "File") {
      const relMethod = generateFileRelation(propName, propDef);
      relations.push(relMethod);
    } else {
      const propWithOptions = propDef;
      const isFillable = propWithOptions.fillable !== false;
      const isHidden = propWithOptions.hidden === true;
      const typeDef2 = options.customTypes.get(propDef.type);
      const isCompoundType2 = typeDef2?.compound && typeDef2.expand;
      if (isCompoundType2 && typeDef2.expand) {
        const fieldOverrides = propWithOptions.fields ?? {};
        const basePropWithNullable = propDef;
        for (const field of typeDef2.expand) {
          const suffixSnake = toSnakeCase(field.suffix);
          const fieldName = `${snakeName}_${suffixSnake}`;
          const override = fieldOverrides[field.suffix];
          const fieldNullable = override?.nullable ?? basePropWithNullable.nullable ?? false;
          const phpType = field.typescript?.type === "number" ? "int" : "string";
          const nullSuffix = fieldNullable ? "|null" : "";
          docProperties.push(` * @property ${phpType}${nullSuffix} $${fieldName}`);
          const fieldFillable = override?.fillable !== void 0 ? override.fillable : isFillable;
          if (fieldFillable) {
            fillable.push(`        '${fieldName}',`);
          }
          const fieldHidden = override?.hidden !== void 0 ? override.hidden : isHidden;
          if (fieldHidden) {
            hidden.push(`        '${fieldName}',`);
          }
        }
      } else {
        if (isFillable) {
          fillable.push(`        '${snakeName}',`);
        }
        const cast = getCastType(propDef);
        if (cast) {
          casts.push(`            '${snakeName}' => '${cast}',`);
        }
        if (isHidden) {
          hidden.push(`        '${snakeName}',`);
        }
      }
      if (typeDef2?.compound && typeDef2.accessors) {
        for (const accessor of typeDef2.accessors) {
          const accessorName = `${snakeName}_${toSnakeCase(accessor.name)}`;
          appends.push(`        '${accessorName}',`);
          const methodName = toPascalCase(accessorName);
          const separator = accessor.separator ?? " ";
          const fieldRefs = accessor.fields.map((field) => {
            const fieldName = `${snakeName}_${toSnakeCase(field)}`;
            return `$this->${fieldName}`;
          });
          const accessorMethod = `    /**
     * Get the ${accessor.name.replace(/_/g, " ")} attribute.
     */
    public function get${methodName}Attribute(): ?string
    {
        $parts = array_filter([${fieldRefs.join(", ")}], fn($v) => $v !== null && $v !== '');
        return count($parts) > 0 ? implode('${separator}', $parts) : null;
    }`;
          relations.push(accessorMethod);
        }
      }
    }
  }
  const docComment = `/**
 * ${className}BaseModel
 *
${docProperties.join("\n")}
 */`;
  const isPivot = schema.kind === "pivot";
  let stub;
  if (isPivot && pivotStubContent) {
    stub = pivotStubContent;
  } else if (isAuth) {
    stub = authStubContent;
  } else {
    stub = stubContent;
  }
  const keyType = isStringKey ? `    /**
     * The "type" of the primary key ID.
     */
    protected $keyType = 'string';

` : "";
  const incrementing = isNonIncrementing ? `    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

` : "";
  if (isUuid) {
    imports.push("use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;");
    traits.push("    use HasUuids;");
  }
  const content = stub.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace).replace(/\{\{BASE_MODEL_CLASS\}\}/g, options.baseModelClassName).replace(/\{\{CLASS_NAME\}\}/g, className).replace(/\{\{TABLE_NAME\}\}/g, tableName).replace(/\{\{PRIMARY_KEY\}\}/g, primaryKey).replace(/\{\{KEY_TYPE\}\}/g, keyType).replace(/\{\{INCREMENTING\}\}/g, incrementing).replace(/\{\{TIMESTAMPS\}\}/g, schema.options?.timestamps !== false ? "true" : "false").replace(/\{\{IMPORTS\}\}/g, [...new Set(imports)].sort().join("\n")).replace(/\{\{TRAITS\}\}/g, traits.join("\n")).replace(/\{\{DOC_COMMENT\}\}/g, docComment).replace(/\{\{FILLABLE\}\}/g, fillable.join("\n")).replace(/\{\{HIDDEN\}\}/g, hidden.join("\n")).replace(/\{\{APPENDS\}\}/g, appends.join("\n")).replace(/\{\{CASTS\}\}/g, casts.join("\n")).replace(/\{\{RELATIONS\}\}/g, relations.join("\n\n"));
  return {
    path: `${options.baseModelPath}/${className}BaseModel.php`,
    content,
    type: "entity-base",
    overwrite: true,
    schemaName: schema.name
  };
}
function findInverseRelation(currentSchemaName, targetSchemaName, schemas) {
  const targetSchema = schemas[targetSchemaName];
  if (!targetSchema || !targetSchema.properties) {
    return null;
  }
  for (const [propName, propDef] of Object.entries(targetSchema.properties)) {
    if (propDef.type === "Association") {
      const assoc = propDef;
      if (assoc.relation === "ManyToOne" && assoc.target === currentSchemaName) {
        return propName;
      }
    }
  }
  return null;
}
function generateRelation(propName, assoc, schema, schemas, options) {
  const methodName = toCamelCase(propName);
  const targetClass = assoc.target ? toPascalCase(assoc.target) : "";
  const fkName = toSnakeCase(propName) + "_id";
  switch (assoc.relation) {
    case "ManyToOne":
      return `    /**
     * Get the ${propName} that owns this model.
     */
    public function ${methodName}(): BelongsTo
    {
        return $this->belongsTo(${targetClass}::class, '${fkName}');
    }`;
    case "OneToOne":
      if (assoc.mappedBy) {
        return `    /**
     * Get the ${propName} for this model.
     */
    public function ${methodName}(): HasOne
    {
        return $this->hasOne(${targetClass}::class, '${toSnakeCase(assoc.mappedBy)}_id');
    }`;
      }
      return `    /**
     * Get the ${propName} that owns this model.
     */
    public function ${methodName}(): BelongsTo
    {
        return $this->belongsTo(${targetClass}::class, '${fkName}');
    }`;
    case "OneToMany": {
      let foreignKey;
      if (assoc.inversedBy) {
        foreignKey = toSnakeCase(assoc.inversedBy) + "_id";
      } else if (assoc.target) {
        const inverseRelation = findInverseRelation(schema.name, assoc.target, schemas);
        if (inverseRelation) {
          foreignKey = toSnakeCase(inverseRelation) + "_id";
        } else {
          foreignKey = toSnakeCase(schema.name) + "_id";
        }
      } else {
        foreignKey = toSnakeCase(propName) + "_id";
      }
      return `    /**
     * Get the ${propName} for this model.
     */
    public function ${methodName}(): HasMany
    {
        return $this->hasMany(${targetClass}::class, '${foreignKey}');
    }`;
    }
    case "ManyToMany": {
      const pivotTable = assoc.joinTable ?? `${toSnakeCase(propName)}_pivot`;
      let pivotFieldNames = [];
      if (assoc.pivotFields && Object.keys(assoc.pivotFields).length > 0) {
        pivotFieldNames = Object.keys(assoc.pivotFields).map((f) => toSnakeCase(f));
      } else if (assoc.mappedBy && assoc.target) {
        const targetSchema = schemas[assoc.target];
        if (targetSchema?.properties) {
          const owningProp = targetSchema.properties[assoc.mappedBy];
          if (owningProp?.type === "Association") {
            const owningAssoc = owningProp;
            if (owningAssoc.pivotFields && Object.keys(owningAssoc.pivotFields).length > 0) {
              pivotFieldNames = Object.keys(owningAssoc.pivotFields).map((f) => toSnakeCase(f));
            }
          }
        }
      }
      const pivotFieldsCode = pivotFieldNames.length > 0 ? pivotFieldNames.map((f) => `'${f}'`).join(", ") : null;
      const withPivotLine = pivotFieldsCode ? `
            ->withPivot(${pivotFieldsCode})` : "";
      return `    /**
     * The ${propName} that belong to this model.
     */
    public function ${methodName}(): BelongsToMany
    {
        return $this->belongsToMany(${targetClass}::class, '${pivotTable}')${withPivotLine}
            ->withTimestamps();
    }`;
    }
    case "MorphTo":
      return `    /**
     * Get the parent ${propName} model.
     */
    public function ${methodName}(): MorphTo
    {
        return $this->morphTo('${methodName}');
    }`;
    case "MorphOne":
      return `    /**
     * Get the ${propName} for this model.
     */
    public function ${methodName}(): MorphOne
    {
        return $this->morphOne(${targetClass}::class, '${assoc.morphName ?? propName}');
    }`;
    case "MorphMany":
      return `    /**
     * Get the ${propName} for this model.
     */
    public function ${methodName}(): MorphMany
    {
        return $this->morphMany(${targetClass}::class, '${assoc.morphName ?? propName}');
    }`;
    default:
      return `    // TODO: Implement ${assoc.relation} relation for ${propName}`;
  }
}
function generateFileRelation(propName, propDef) {
  const methodName = toCamelCase(propName);
  const relationType = propDef.multiple ? "MorphMany" : "MorphOne";
  const relationMethod = propDef.multiple ? "morphMany" : "morphOne";
  return `    /**
     * Get the ${propName} file(s) for this model.
     */
    public function ${methodName}(): ${relationType}
    {
        return $this->${relationMethod}(FileUpload::class, 'uploadable')
            ->where('attribute_name', '${propName}');
    }`;
}
function generateEntityModel(schema, options, stubContent) {
  const className = toPascalCase(schema.name);
  const content = stubContent.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace).replace(/\{\{MODEL_NAMESPACE\}\}/g, options.modelNamespace).replace(/\{\{CLASS_NAME\}\}/g, className);
  return {
    path: `${options.modelPath}/${className}.php`,
    content,
    type: "entity",
    overwrite: false,
    // Never overwrite user models
    schemaName: schema.name
  };
}
function getStubContent(stubName) {
  const stubs = {
    "base-model": `<?php

namespace {{BASE_MODEL_NAMESPACE}};

/**
 * Base model class for all Omnify-generated models.
 * Contains model mapping for polymorphic relations.
 *
 * DO NOT EDIT - This file is auto-generated by Omnify.
 * Any changes will be overwritten on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\Relation;

abstract class {{BASE_MODEL_CLASS}} extends Model
{
    /**
     * Model class map for polymorphic relations.
     */
    protected static array $modelMap = [
{{MODEL_MAP}}
    ];

    /**
     * Boot the model and register morph map.
     */
    protected static function boot(): void
    {
        parent::boot();

        // Register morph map for polymorphic relations
        Relation::enforceMorphMap(static::$modelMap);
    }

    /**
     * Get the model class for a given morph type.
     */
    public static function getModelClass(string $morphType): ?string
    {
        return static::$modelMap[$morphType] ?? null;
    }
}
`,
    "entity-base": `<?php

namespace {{BASE_MODEL_NAMESPACE}};

/**
 * DO NOT EDIT - This file is auto-generated by Omnify.
 * Any changes will be overwritten on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\HasOne;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;
use Illuminate\\Database\\Eloquent\\Relations\\MorphTo;
use Illuminate\\Database\\Eloquent\\Relations\\MorphOne;
use Illuminate\\Database\\Eloquent\\Relations\\MorphMany;
use Illuminate\\Database\\Eloquent\\Relations\\MorphToMany;
use Illuminate\\Database\\Eloquent\\Collection as EloquentCollection;
use {{BASE_MODEL_NAMESPACE}}\\Traits\\HasLocalizedDisplayName;
use {{BASE_MODEL_NAMESPACE}}\\Locales\\{{CLASS_NAME}}Locales;
{{IMPORTS}}

{{DOC_COMMENT}}
class {{CLASS_NAME}}BaseModel extends {{BASE_MODEL_CLASS}}
{
    use HasLocalizedDisplayName;
{{TRAITS}}
    /**
     * The table associated with the model.
     */
    protected $table = '{{TABLE_NAME}}';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = '{{PRIMARY_KEY}}';

{{KEY_TYPE}}
{{INCREMENTING}}
    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = {{TIMESTAMPS}};

    /**
     * Localized display names for this model.
     *
     * @var array<string, string>
     */
    protected static array $localizedDisplayNames = {{CLASS_NAME}}Locales::DISPLAY_NAMES;

    /**
     * Localized display names for properties.
     *
     * @var array<string, array<string, string>>
     */
    protected static array $localizedPropertyDisplayNames = {{CLASS_NAME}}Locales::PROPERTY_DISPLAY_NAMES;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
{{FILLABLE}}
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
{{HIDDEN}}
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
{{APPENDS}}
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
{{CASTS}}
        ];
    }

{{RELATIONS}}
}
`,
    "entity-base-auth": `<?php

namespace {{BASE_MODEL_NAMESPACE}};

/**
 * DO NOT EDIT - This file is auto-generated by Omnify.
 * Any changes will be overwritten on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\HasOne;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;
use Illuminate\\Database\\Eloquent\\Relations\\MorphTo;
use Illuminate\\Database\\Eloquent\\Relations\\MorphOne;
use Illuminate\\Database\\Eloquent\\Relations\\MorphMany;
use Illuminate\\Database\\Eloquent\\Relations\\MorphToMany;
use Illuminate\\Database\\Eloquent\\Collection as EloquentCollection;
use Illuminate\\Notifications\\Notifiable;
use {{BASE_MODEL_NAMESPACE}}\\Traits\\HasLocalizedDisplayName;
use {{BASE_MODEL_NAMESPACE}}\\Locales\\{{CLASS_NAME}}Locales;
{{IMPORTS}}

{{DOC_COMMENT}}
class {{CLASS_NAME}}BaseModel extends Authenticatable
{
    use Notifiable;
    use HasLocalizedDisplayName;
{{TRAITS}}
    /**
     * The table associated with the model.
     */
    protected $table = '{{TABLE_NAME}}';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = '{{PRIMARY_KEY}}';

{{KEY_TYPE}}
{{INCREMENTING}}
    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = {{TIMESTAMPS}};

    /**
     * Localized display names for this model.
     *
     * @var array<string, string>
     */
    protected static array $localizedDisplayNames = {{CLASS_NAME}}Locales::DISPLAY_NAMES;

    /**
     * Localized display names for properties.
     *
     * @var array<string, array<string, string>>
     */
    protected static array $localizedPropertyDisplayNames = {{CLASS_NAME}}Locales::PROPERTY_DISPLAY_NAMES;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
{{FILLABLE}}
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
{{HIDDEN}}
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
{{APPENDS}}
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
{{CASTS}}
        ];
    }

{{RELATIONS}}
}
`,
    "entity-base-pivot": `<?php

namespace {{BASE_MODEL_NAMESPACE}};

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This is a PIVOT MODEL - auto-generated by Omnify.
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */

use Illuminate\\Database\\Eloquent\\Relations\\Pivot;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use {{BASE_MODEL_NAMESPACE}}\\Locales\\{{CLASS_NAME}}Locales;
{{IMPORTS}}

{{DOC_COMMENT}}
class {{CLASS_NAME}}BaseModel extends Pivot
{
    use HasLocalizedDisplayName;
{{TRAITS}}
    /**
     * The table associated with the model.
     */
    protected $table = '{{TABLE_NAME}}';

{{INCREMENTING}}
    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = {{TIMESTAMPS}};

    /**
     * Localized display names for this model.
     *
     * @var array<string, string>
     */
    protected static array $localizedDisplayNames = {{CLASS_NAME}}Locales::DISPLAY_NAMES;

    /**
     * Localized display names for properties.
     *
     * @var array<string, array<string, string>>
     */
    protected static array $localizedPropertyDisplayNames = {{CLASS_NAME}}Locales::PROPERTY_DISPLAY_NAMES;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
{{FILLABLE}}
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
{{HIDDEN}}
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
{{CASTS}}
        ];
    }

{{RELATIONS}}
}
`,
    "entity": `<?php

namespace {{MODEL_NAMESPACE}};

use {{BASE_MODEL_NAMESPACE}}\\{{CLASS_NAME}}BaseModel;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;

/**
 * {{CLASS_NAME}} Model
 *
 * This file is generated once and can be customized.
 * Add your custom methods and logic here.
 */
class {{CLASS_NAME}} extends {{CLASS_NAME}}BaseModel
{
    use HasFactory;

    /**
     * Create a new model instance.
     */
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
    }

    // Add your custom methods here
}
`,
    "service-provider": `<?php

namespace App\\Providers;

use Illuminate\\Database\\Eloquent\\Relations\\Relation;
use Illuminate\\Support\\ServiceProvider;

/**
 * Omnify Service Provider
 *
 * DO NOT EDIT - This file is auto-generated by Omnify.
 * Any changes will be overwritten on next generation.
 *
 * - Loads Omnify migrations from database/migrations/omnify
 * - Registers morph map for polymorphic relationships
 *
 * @generated by @famgia/omnify-laravel
 */
class OmnifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Load Omnify migrations from custom directory
        $this->loadMigrationsFrom(database_path('migrations/omnify'));

        // Register morph map for polymorphic relationships
        Relation::enforceMorphMap([
{{MORPH_MAP}}
        ]);
    }
}
`,
    "has-localized-display-name": `<?php

namespace {{BASE_MODEL_NAMESPACE}}\\Traits;

/**
 * Trait for localized display names.
 * Uses Laravel's app()->getLocale() for locale resolution.
 *
 * DO NOT EDIT - This file is auto-generated by Omnify.
 * Any changes will be overwritten on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */
trait HasLocalizedDisplayName
{
    /**
     * Get the localized display name for this model.
     *
     * @param string|null $locale Locale code (defaults to app locale)
     * @return string
     */
    public static function displayName(?string $locale = null): string
    {
        $locale = $locale ?? app()->getLocale();
        $displayNames = static::$localizedDisplayNames ?? [];

        return $displayNames[$locale]
            ?? $displayNames[config('app.fallback_locale', 'en')]
            ?? $displayNames[array_key_first($displayNames) ?? 'en']
            ?? class_basename(static::class);
    }

    /**
     * Get all localized display names for this model.
     *
     * @return array<string, string>
     */
    public static function allDisplayNames(): array
    {
        return static::$localizedDisplayNames ?? [];
    }

    /**
     * Get the localized display name for a property.
     *
     * @param string $property Property name
     * @param string|null $locale Locale code (defaults to app locale)
     * @return string
     */
    public static function propertyDisplayName(string $property, ?string $locale = null): string
    {
        $locale = $locale ?? app()->getLocale();
        $displayNames = static::$localizedPropertyDisplayNames[$property] ?? [];

        return $displayNames[$locale]
            ?? $displayNames[config('app.fallback_locale', 'en')]
            ?? $displayNames[array_key_first($displayNames) ?? 'en']
            ?? $property;
    }

    /**
     * Get all localized display names for a property.
     *
     * @param string $property Property name
     * @return array<string, string>
     */
    public static function allPropertyDisplayNames(string $property): array
    {
        return static::$localizedPropertyDisplayNames[$property] ?? [];
    }

    /**
     * Get all property display names for a given locale.
     *
     * @param string|null $locale Locale code (defaults to app locale)
     * @return array<string, string>
     */
    public static function allPropertyDisplayNamesForLocale(?string $locale = null): array
    {
        $locale = $locale ?? app()->getLocale();
        $result = [];

        foreach (static::$localizedPropertyDisplayNames ?? [] as $property => $displayNames) {
            $result[$property] = $displayNames[$locale]
                ?? $displayNames[config('app.fallback_locale', 'en')]
                ?? $displayNames[array_key_first($displayNames) ?? 'en']
                ?? $property;
        }

        return $result;
    }
}
`,
    "locales": `<?php

namespace {{BASE_MODEL_NAMESPACE}}\\Locales;

/**
 * Localized display names for {{CLASS_NAME}}.
 *
 * DO NOT EDIT - This file is auto-generated by Omnify.
 * Any changes will be overwritten on next generation.
 *
 * @generated by @famgia/omnify-laravel
 */
class {{CLASS_NAME}}Locales
{
    /**
     * Localized display names for the model.
     *
     * @var array<string, string>
     */
    public const DISPLAY_NAMES = [
{{LOCALIZED_DISPLAY_NAMES}}
    ];

    /**
     * Localized display names for properties.
     *
     * @var array<string, array<string, string>>
     */
    public const PROPERTY_DISPLAY_NAMES = [
{{LOCALIZED_PROPERTY_DISPLAY_NAMES}}
    ];
}
`
  };
  return stubs[stubName] ?? "";
}
function generateServiceProvider(schemas, options, stubContent) {
  const morphMap = Object.values(schemas).filter(
    (s) => s.kind !== "enum" && s.kind !== "partial" && s.options?.hidden !== true && !s.packageOutput
    // Skip schemas from external packages (additionalSchemaPaths)
  ).map((s) => {
    const className = toPascalCase(s.name);
    return `            '${s.name}' => \\${options.modelNamespace}\\${className}::class,`;
  }).join("\n");
  const content = stubContent.replace(/\{\{MORPH_MAP\}\}/g, morphMap);
  return {
    path: `${options.providersPath}/OmnifyServiceProvider.php`,
    content,
    type: "service-provider",
    overwrite: true,
    // Always overwrite to keep morph map in sync
    schemaName: "__service_provider__"
  };
}
function generatePackageServiceProvider(schemas, options, packageBase, stubContent) {
  const baseNs = options.modelNamespace.replace(/\\Models$/, "");
  const nsParts = baseNs.split("\\");
  const packageName = nsParts[nsParts.length - 1];
  const providerName = `${packageName}ServiceProvider`;
  const providerNamespace = `${baseNs}\\Providers`;
  const morphMap = Object.values(schemas).filter((s) => s.kind !== "enum" && s.kind !== "partial" && s.options?.hidden !== true).map((s) => {
    const className = toPascalCase(s.name);
    return `            '${s.name}' => \\${options.modelNamespace}\\${className}::class,`;
  }).join("\n");
  const content = `<?php

namespace ${providerNamespace};

use Illuminate\\Database\\Eloquent\\Relations\\Relation;
use Illuminate\\Support\\ServiceProvider;

/**
 * ${packageName} Service Provider
 *
 * This provider is auto-generated by Omnify.
 * Register it in composer.json extra.laravel.providers for auto-discovery.
 */
class ${providerName} extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load migrations from package
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');

        // Enforce morph map for this package's models
        Relation::enforceMorphMap([
${morphMap}
        ]);
    }
}
`;
  return {
    path: `${options.providersPath}/${providerName}.php`,
    content,
    type: "service-provider",
    overwrite: true,
    schemaName: `__package_service_provider__${packageName}`
  };
}
function generatePackageBaseModel(schemas, options, stubContent) {
  const modelMap = Object.values(schemas).filter((s) => s.kind !== "enum" && s.kind !== "partial").map((s) => {
    const className = toPascalCase(s.name);
    return `        '${s.name}' => \\${options.modelNamespace}\\${className}::class,`;
  }).join("\n");
  const content = stubContent.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace).replace(/\{\{BASE_MODEL_CLASS\}\}/g, "BaseModel").replace(/\{\{MODEL_MAP\}\}/g, modelMap);
  return {
    path: `${options.baseModelPath}/BaseModel.php`,
    content,
    type: "base-model",
    overwrite: true,
    schemaName: "__package_base_model__"
  };
}
function generatePackageTrait(options, stubContent) {
  const content = stubContent.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace);
  return {
    path: `${options.baseModelPath}/Traits/HasLocalizedDisplayName.php`,
    content,
    type: "trait",
    overwrite: true,
    schemaName: "__package_trait__"
  };
}
function generateLocalizedDisplayNameTrait(options, stubContent) {
  const content = stubContent.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace);
  return {
    path: `${options.baseModelPath}/Traits/HasLocalizedDisplayName.php`,
    content,
    type: "trait",
    overwrite: true,
    // Always overwrite trait
    schemaName: "__trait__"
  };
}
function generateLocalesClass(schema, options, stubContent) {
  const className = toPascalCase(schema.name);
  const localizedDisplayNames = generateLocalizedDisplayNames(schema.displayName);
  const localizedPropertyDisplayNames = generatePropertyLocalizedDisplayNames(schema);
  const content = stubContent.replace(/\{\{BASE_MODEL_NAMESPACE\}\}/g, options.baseModelNamespace).replace(/\{\{CLASS_NAME\}\}/g, className).replace(/\{\{LOCALIZED_DISPLAY_NAMES\}\}/g, localizedDisplayNames).replace(/\{\{LOCALIZED_PROPERTY_DISPLAY_NAMES\}\}/g, localizedPropertyDisplayNames);
  return {
    path: `${options.baseModelPath}/Locales/${className}Locales.php`,
    content,
    type: "locales",
    overwrite: true,
    // Always overwrite locales
    schemaName: schema.name
  };
}
function generateModels(schemas, options) {
  const globalResolved = resolveOptions(options);
  const models = [];
  const mainSchemas = {};
  const packageSchemaGroups = /* @__PURE__ */ new Map();
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.packageOutput?.laravel) {
      const base = schema.packageOutput.laravel.base;
      if (!packageSchemaGroups.has(base)) {
        packageSchemaGroups.set(base, {
          schemas: {},
          resolved: resolveSchemaOptions(schema, globalResolved)
        });
      }
      packageSchemaGroups.get(base).schemas[name] = schema;
    } else {
      mainSchemas[name] = schema;
    }
  }
  models.push(generateBaseModel(schemas, globalResolved, getStubContent("base-model")));
  models.push(generateLocalizedDisplayNameTrait(globalResolved, getStubContent("has-localized-display-name")));
  models.push(generateServiceProvider(schemas, globalResolved, getStubContent("service-provider")));
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum" || schema.kind === "partial") {
      continue;
    }
    if (schema.options?.hidden === true) {
      continue;
    }
    const schemaResolved = resolveSchemaOptions(schema, globalResolved);
    models.push(generateLocalesClass(schema, schemaResolved, getStubContent("locales")));
    models.push(generateEntityBaseModel(
      schema,
      schemas,
      schemaResolved,
      getStubContent("entity-base"),
      getStubContent("entity-base-auth"),
      getStubContent("entity-base-pivot")
    ));
    models.push(generateEntityModel(schema, schemaResolved, getStubContent("entity")));
  }
  for (const [base, { schemas: pkgSchemas, resolved: pkgResolved }] of packageSchemaGroups) {
    models.push(generatePackageBaseModel(pkgSchemas, pkgResolved, getStubContent("base-model")));
    models.push(generatePackageTrait(pkgResolved, getStubContent("has-localized-display-name")));
    models.push(generatePackageServiceProvider(pkgSchemas, pkgResolved, base, getStubContent("service-provider")));
  }
  return models;
}
function getModelPath(model) {
  return model.path;
}
function generateProviderRegistration(existingContent, laravelVersion, laravelRoot = "") {
  const providerClass = "App\\Providers\\OmnifyServiceProvider::class";
  const providerLine = `    ${providerClass},`;
  const bootstrapPath = laravelRoot ? `${laravelRoot}/bootstrap/providers.php` : "bootstrap/providers.php";
  const configPath = laravelRoot ? `${laravelRoot}/config/app.php` : "config/app.php";
  if (existingContent && existingContent.includes("OmnifyServiceProvider")) {
    return {
      path: laravelVersion === "laravel11+" ? bootstrapPath : configPath,
      content: existingContent,
      laravelVersion,
      alreadyRegistered: true
    };
  }
  if (laravelVersion === "laravel11+") {
    if (existingContent) {
      const lines = existingContent.split("\n");
      const result = [];
      let inserted = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inserted && line.trim() === "];") {
          result.push(providerLine);
          inserted = true;
        }
        result.push(line);
      }
      return {
        path: bootstrapPath,
        content: result.join("\n"),
        laravelVersion,
        alreadyRegistered: false
      };
    } else {
      return {
        path: bootstrapPath,
        content: `<?php

return [
    App\\Providers\\AppServiceProvider::class,
${providerLine}
];
`,
        laravelVersion,
        alreadyRegistered: false
      };
    }
  } else {
    if (existingContent) {
      const providersSectionRegex = /'providers'\s*=>\s*\[[\s\S]*?\n(\s*)\]/m;
      const match = existingContent.match(providersSectionRegex);
      if (match) {
        const providersStart = existingContent.indexOf("'providers'");
        if (providersStart === -1) {
          return null;
        }
        let depth = 0;
        let foundStart = false;
        let insertPos = -1;
        for (let i = providersStart; i < existingContent.length; i++) {
          const char = existingContent[i];
          if (char === "[") {
            foundStart = true;
            depth++;
          } else if (char === "]") {
            depth--;
            if (foundStart && depth === 0) {
              insertPos = i;
              break;
            }
          }
        }
        if (insertPos !== -1) {
          const beforeClose = existingContent.substring(0, insertPos);
          const lastNewline = beforeClose.lastIndexOf("\n");
          const content = existingContent.substring(0, lastNewline + 1) + providerLine + "\n" + existingContent.substring(lastNewline + 1);
          return {
            path: configPath,
            content,
            laravelVersion,
            alreadyRegistered: false
          };
        }
      }
      return null;
    } else {
      return null;
    }
  }
}

// src/factory/generator.ts
function resolveOptions2(options) {
  return {
    modelNamespace: options?.modelNamespace ?? "App\\Models",
    factoryPath: options?.factoryPath ?? "database/factories",
    fakerLocale: options?.fakerLocale ?? "en_US",
    customTypes: options?.customTypes ?? /* @__PURE__ */ new Map(),
    pluginEnums: options?.pluginEnums ?? /* @__PURE__ */ new Map()
  };
}
function resolveSchemaOptions2(schema, globalOptions) {
  const pkgOutput = schema.packageOutput?.laravel;
  if (!pkgOutput) {
    return globalOptions;
  }
  const base = pkgOutput.base;
  return {
    ...globalOptions,
    modelNamespace: pkgOutput.modelsNamespace,
    factoryPath: `${base}/${pkgOutput.factoriesPath ?? "database/factories"}`
  };
}
function getStubContent2() {
  return `<?php

namespace Database\\Factories;

use {{MODEL_NAMESPACE}}\\{{MODEL_NAME}};
use Illuminate\\Database\\Eloquent\\Factories\\Factory;
{{IMPORTS}}

/**
 * @extends Factory<{{MODEL_NAME}}>
 */
class {{MODEL_NAME}}Factory extends Factory
{
    protected $model = {{MODEL_NAME}}::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
{{ATTRIBUTES}}
        ];
    }
}
`;
}
function generateJapaneseCompoundFake(propertyName, property, options) {
  const typeDef = options.customTypes.get(property.type);
  if (!typeDef || !typeDef.compound || !typeDef.expand) {
    return null;
  }
  const snakeName = toSnakeCase(propertyName);
  const lines = [];
  const jaFaker = "fake('ja_JP')";
  switch (property.type) {
    case "JapaneseName":
      lines.push(`'${snakeName}_lastname' => ${jaFaker}->lastName(),`);
      lines.push(`'${snakeName}_firstname' => ${jaFaker}->firstName(),`);
      lines.push(`'${snakeName}_kana_lastname' => ${jaFaker}->lastKanaName(),`);
      lines.push(`'${snakeName}_kana_firstname' => ${jaFaker}->firstKanaName(),`);
      break;
    case "JapaneseAddress": {
      lines.push(`'${snakeName}_postal_code' => ${jaFaker}->postcode(),`);
      const prefectureEnum = options.pluginEnums.get("Prefecture");
      if (prefectureEnum && prefectureEnum.values.length > 0) {
        const keys = prefectureEnum.values.map((v) => `'${v.value}'`).join(", ");
        lines.push(`'${snakeName}_prefecture' => fake()->randomElement([${keys}]),`);
      } else {
        lines.push(`'${snakeName}_prefecture' => fake()->randomElement(['hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima', 'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa', 'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi', 'mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama', 'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi', 'tokushima', 'kagawa', 'ehime', 'kochi', 'fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa']),`);
      }
      lines.push(`'${snakeName}_address1' => ${jaFaker}->city() . ${jaFaker}->ward(),`);
      lines.push(`'${snakeName}_address2' => ${jaFaker}->streetAddress(),`);
      lines.push(`'${snakeName}_address3' => ${jaFaker}->optional()->secondaryAddress(),`);
      break;
    }
    case "JapaneseBankAccount":
      lines.push(`'${snakeName}_bank_code' => ${jaFaker}->regexify('[0-9]{4}'),`);
      lines.push(`'${snakeName}_branch_code' => ${jaFaker}->regexify('[0-9]{3}'),`);
      lines.push(`'${snakeName}_account_type' => ${jaFaker}->randomElement(['1', '2', '4']),`);
      lines.push(`'${snakeName}_account_number' => ${jaFaker}->regexify('[0-9]{7}'),`);
      lines.push(`'${snakeName}_account_holder' => ${jaFaker}->lastKanaName() . ' ' . ${jaFaker}->firstKanaName(),`);
      break;
    default:
      for (const field of typeDef.expand) {
        const suffixSnake = toSnakeCase(field.suffix);
        const fieldName = `${snakeName}_${suffixSnake}`;
        const sql = field.sql;
        if (sql?.sqlType === "TINYINT" || sql?.sqlType === "INT" || sql?.sqlType === "BIGINT") {
          lines.push(`'${fieldName}' => fake()->numberBetween(1, 100),`);
        } else {
          lines.push(`'${fieldName}' => fake()->words(2, true),`);
        }
      }
      break;
  }
  return lines;
}
function generateJapaneseSimpleFake(propertyName, property) {
  const snakeName = toSnakeCase(propertyName);
  const jaFaker = "fake('ja_JP')";
  switch (property.type) {
    case "JapanesePhone":
      return `'${snakeName}' => ${jaFaker}->phoneNumber(),`;
    case "JapanesePostalCode":
      return `'${snakeName}' => ${jaFaker}->postcode(),`;
    default:
      return null;
  }
}
function generateFakeData(propertyName, property, schema, schemas, options) {
  const type = property.type;
  if (["deleted_at", "created_at", "updated_at"].includes(propertyName)) {
    return null;
  }
  if (type === "Association") {
    return null;
  }
  const japaneseFake = generateJapaneseSimpleFake(propertyName, property);
  if (japaneseFake) {
    return japaneseFake;
  }
  switch (type) {
    case "String":
      return generateStringFake(propertyName, property);
    case "Email":
      return `'${propertyName}' => fake()->unique()->safeEmail(),`;
    case "Password":
      return `'${propertyName}' => bcrypt('password'),`;
    case "Int":
    case "BigInt":
      return generateIntFake(propertyName, property);
    case "Float":
    case "Decimal":
      return `'${propertyName}' => fake()->randomFloat(2, 1, 10000),`;
    case "Boolean":
      return `'${propertyName}' => fake()->boolean(),`;
    case "Text":
      return `'${propertyName}' => fake()->paragraphs(3, true),`;
    case "LongText":
      return `'${propertyName}' => fake()->paragraphs(5, true),`;
    case "Date":
      return `'${propertyName}' => fake()->date(),`;
    case "Time":
      return `'${propertyName}' => fake()->time(),`;
    case "Timestamp":
    case "DateTime":
      return `'${propertyName}' => fake()->dateTime(),`;
    case "Json":
      return `'${propertyName}' => [],`;
    case "Enum":
      return generateEnumFake(propertyName, property);
    case "EnumRef":
      return generateEnumRefFake(propertyName, property, schemas);
    default:
      return `'${propertyName}' => fake()->sentence(),`;
  }
}
function generateStringFake(propertyName, property) {
  if (propertyName === "slug") {
    return `'${propertyName}' => fake()->unique()->slug(2),`;
  }
  if (propertyName === "uuid" || propertyName === "uid") {
    return `'${propertyName}' => (string) \\Illuminate\\Support\\Str::uuid(),`;
  }
  if (propertyName.includes("email")) {
    return `'${propertyName}' => fake()->unique()->safeEmail(),`;
  }
  if (propertyName.includes("phone")) {
    return `'${propertyName}' => fake()->phoneNumber(),`;
  }
  if (propertyName.includes("image") || propertyName.includes("photo") || propertyName.includes("avatar")) {
    return `'${propertyName}' => fake()->imageUrl(),`;
  }
  if (propertyName.includes("url") || propertyName.includes("website")) {
    return `'${propertyName}' => fake()->url(),`;
  }
  if (propertyName.includes("path") || propertyName.includes("file")) {
    return `'${propertyName}' => 'uploads/' . fake()->uuid() . '.jpg',`;
  }
  if (propertyName === "name" || propertyName === "title") {
    return `'${propertyName}' => fake()->sentence(3),`;
  }
  if (propertyName.includes("name")) {
    return `'${propertyName}' => fake()->name(),`;
  }
  if (propertyName.includes("address")) {
    return `'${propertyName}' => fake()->address(),`;
  }
  if (propertyName.includes("city")) {
    return `'${propertyName}' => fake()->city(),`;
  }
  if (propertyName.includes("country")) {
    return `'${propertyName}' => fake()->country(),`;
  }
  if (propertyName.includes("zip") || propertyName.includes("postal")) {
    return `'${propertyName}' => fake()->postcode(),`;
  }
  if (propertyName.includes("color")) {
    return `'${propertyName}' => fake()->hexColor(),`;
  }
  if (propertyName.includes("token") || propertyName.includes("secret") || propertyName.includes("key")) {
    return `'${propertyName}' => \\Illuminate\\Support\\Str::random(32),`;
  }
  if (propertyName.includes("code")) {
    return `'${propertyName}' => fake()->unique()->regexify('[A-Z0-9]{8}'),`;
  }
  const length = property.length;
  if (length && length <= 50) {
    return `'${propertyName}' => fake()->words(3, true),`;
  }
  return `'${propertyName}' => fake()->sentence(),`;
}
function generateIntFake(propertyName, property) {
  const isUnique = "unique" in property && property.unique === true;
  const uniquePrefix = isUnique ? "unique()->" : "";
  if (propertyName.includes("count") || propertyName.includes("quantity")) {
    return `'${propertyName}' => fake()->${uniquePrefix}numberBetween(0, 100),`;
  }
  if (propertyName.includes("price") || propertyName.includes("amount") || propertyName.includes("cost")) {
    return `'${propertyName}' => fake()->${uniquePrefix}numberBetween(100, 10000),`;
  }
  if (propertyName.includes("order") || propertyName.includes("sort") || propertyName.includes("position")) {
    return `'${propertyName}' => fake()->${uniquePrefix}numberBetween(1, 100),`;
  }
  if (propertyName.includes("age")) {
    return `'${propertyName}' => fake()->${uniquePrefix}numberBetween(18, 80),`;
  }
  if (propertyName.includes("year")) {
    return `'${propertyName}' => fake()->${uniquePrefix}year(),`;
  }
  const range = isUnique ? "1, 1000000" : "1, 1000";
  return `'${propertyName}' => fake()->${uniquePrefix}numberBetween(${range}),`;
}
function generateEnumFake(propertyName, property) {
  const enumValues = property.enum;
  if (!enumValues || enumValues.length === 0) {
    return `'${propertyName}' => null,`;
  }
  const values = enumValues.map((v) => typeof v === "string" ? v : v.value);
  const valuesStr = values.map((v) => `'${v}'`).join(", ");
  return `'${propertyName}' => fake()->randomElement([${valuesStr}]),`;
}
function generateEnumRefFake(propertyName, property, schemas) {
  const enumName = property.enum;
  if (!enumName) {
    return `'${propertyName}' => null,`;
  }
  const enumSchema = schemas[enumName];
  if (!enumSchema || enumSchema.kind !== "enum" || !enumSchema.values) {
    return `'${propertyName}' => null,`;
  }
  const valuesStr = enumSchema.values.map((v) => `'${v}'`).join(", ");
  return `'${propertyName}' => fake()->randomElement([${valuesStr}]),`;
}
function generateAssociationFake(propertyName, property, schema, schemas, modelNamespace) {
  if (property.type !== "Association") {
    return null;
  }
  const relation = property.relation;
  const target = property.target;
  if (relation !== "ManyToOne" || !target) {
    return null;
  }
  const foreignKey = `${toSnakeCase(propertyName)}_id`;
  const isNullable2 = property.nullable ?? false;
  const targetSchema = schemas[target];
  if (!targetSchema) {
    return null;
  }
  let fake;
  if (isNullable2) {
    fake = `'${foreignKey}' => ${target}::query()->inRandomOrder()->first()?->id,`;
  } else {
    fake = `'${foreignKey}' => ${target}::query()->inRandomOrder()->first()?->id ?? ${target}::factory()->create()->id,`;
  }
  let importStatement;
  if (target !== schema.name) {
    importStatement = `use ${modelNamespace}\\${target};`;
  }
  return { fake, import: importStatement };
}
function generateFactory(schema, schemas, options, stubContent) {
  if (schema.kind === "enum") {
    return null;
  }
  if (schema.options?.hidden) {
    return null;
  }
  const modelName = toPascalCase(schema.name);
  const factoryName = `${modelName}Factory`;
  const attributes = [];
  const imports = [];
  if (schema.properties) {
    for (const [propName, prop] of Object.entries(schema.properties)) {
      if (prop.type === "Association") {
        const assocResult = generateAssociationFake(propName, prop, schema, schemas, options.modelNamespace);
        if (assocResult) {
          attributes.push(assocResult.fake);
          if (assocResult.import) {
            imports.push(assocResult.import);
          }
        }
        continue;
      }
      const compoundFakes = generateJapaneseCompoundFake(propName, prop, options);
      if (compoundFakes) {
        attributes.push(...compoundFakes);
        continue;
      }
      const fake = generateFakeData(propName, prop, schema, schemas, options);
      if (fake) {
        attributes.push(fake);
      }
    }
  }
  let content = stubContent;
  content = content.replace(/\{\{MODEL_NAMESPACE\}\}/g, options.modelNamespace);
  content = content.replace(/\{\{MODEL_NAME\}\}/g, modelName);
  const uniqueImports = [...new Set(imports)];
  const importsStr = uniqueImports.length > 0 ? "\n" + uniqueImports.join("\n") : "";
  content = content.replace(/\{\{IMPORTS\}\}/g, importsStr);
  const attributesStr = attributes.length > 0 ? attributes.map((a) => `            ${a}`).join("\n") : "";
  content = content.replace(/\{\{ATTRIBUTES\}\}/g, attributesStr);
  return {
    name: factoryName,
    schemaName: schema.name,
    path: `${options.factoryPath}/${factoryName}.php`,
    content,
    overwrite: false
    // Factories should not overwrite existing files
  };
}
function generateFactories(schemas, options) {
  const globalResolved = resolveOptions2(options);
  const stubContent = getStubContent2();
  const factories = [];
  for (const schema of Object.values(schemas)) {
    const schemaResolved = resolveSchemaOptions2(schema, globalResolved);
    const factory = generateFactory(schema, schemas, schemaResolved, stubContent);
    if (factory) {
      factories.push(factory);
    }
  }
  return factories;
}
function getFactoryPath(factory) {
  return factory.path;
}

// src/plugin.ts
var import_node_fs2 = require("fs");
var import_node_path2 = require("path");

// src/request/generator.ts
var import_omnify_types3 = require("@famgia/omnify-types");
var DEFAULT_OPTIONS2 = {
  baseRequestNamespace: "App\\Http\\Requests\\OmnifyBase",
  requestNamespace: "App\\Http\\Requests",
  baseRequestPath: "app/Http/Requests/OmnifyBase",
  requestPath: "app/Http/Requests",
  modelNamespace: "App\\Models",
  customTypes: /* @__PURE__ */ new Map(),
  locale: "en"
};
var SKIP_FIELDS = /* @__PURE__ */ new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "remember_token",
  "email_verified_at"
]);
function getExampleValue(fieldName, type) {
  if (fieldName.endsWith("_lastname") && !fieldName.includes("kana")) {
    return "\u7530\u4E2D";
  }
  if (fieldName.endsWith("_firstname") && !fieldName.includes("kana")) {
    return "\u592A\u90CE";
  }
  if (fieldName.includes("kana_lastname") || fieldName.endsWith("_kana_lastname")) {
    return "\u30BF\u30CA\u30AB";
  }
  if (fieldName.includes("kana_firstname") || fieldName.endsWith("_kana_firstname")) {
    return "\u30BF\u30ED\u30A6";
  }
  if (fieldName.includes("email")) {
    return "user@example.com";
  }
  if (fieldName.includes("password")) {
    return "password123";
  }
  if (fieldName.includes("url") || fieldName.includes("website")) {
    return "https://example.com";
  }
  if (fieldName.endsWith("_id")) {
    return 1;
  }
  if (fieldName.endsWith("_at")) {
    return "2024-01-01T00:00:00Z";
  }
  if (type === "boolean") {
    return true;
  }
  if (type === "integer") {
    return 1;
  }
  return void 0;
}
function mapValidationToOpenApiType(rules, fieldName) {
  if (fieldName.includes("email")) {
    return { type: "string", format: "email" };
  }
  if (fieldName.includes("password")) {
    return { type: "string", format: "password" };
  }
  if (fieldName.includes("url") || fieldName.includes("website")) {
    return { type: "string", format: "uri" };
  }
  for (const rule of rules) {
    if (rule === "'integer'") {
      return { type: "integer" };
    }
    if (rule === "'boolean'") {
      return { type: "boolean" };
    }
    if (rule === "'numeric'") {
      return { type: "number" };
    }
    if (rule === "'array'") {
      return { type: "array" };
    }
    if (rule === "'email'") {
      return { type: "string", format: "email" };
    }
    if (rule === "'url'") {
      return { type: "string", format: "uri" };
    }
    if (rule === "'date'") {
      if (fieldName.endsWith("_at")) {
        return { type: "string", format: "date-time" };
      }
      return { type: "string", format: "date" };
    }
  }
  return { type: "string" };
}
function extractConstraints(rules) {
  const constraints = {};
  for (const rule of rules) {
    const maxMatch = rule.match(/'max:(\d+)'/);
    if (maxMatch) {
      constraints.maxLength = parseInt(maxMatch[1], 10);
    }
    const minMatch = rule.match(/'min:(\d+)'/);
    if (minMatch) {
      constraints.minLength = parseInt(minMatch[1], 10);
    }
    if (rule === "'nullable'") {
      constraints.nullable = true;
    }
    const inMatch = rule.match(/Rule::in\(\[([^\]]+)\]\)/);
    if (inMatch) {
      const values = inMatch[1].split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
      constraints.enum = values;
    }
  }
  return constraints;
}
function formatRequestOpenApiProperty(prop, indent) {
  const parts = [`property: '${prop.property}'`, `type: '${prop.type}'`];
  if (prop.format) {
    parts.push(`format: '${prop.format}'`);
  }
  if (prop.maxLength) {
    parts.push(`maxLength: ${prop.maxLength}`);
  }
  if (prop.minLength) {
    parts.push(`minLength: ${prop.minLength}`);
  }
  if (prop.nullable) {
    parts.push(`nullable: true`);
  }
  if (prop.enum) {
    const enumValues = getEnumStringValues(prop.enum);
    const enumStr = enumValues.map((v) => `'${v}'`).join(", ");
    parts.push(`enum: [${enumStr}]`);
  }
  if (prop.example !== void 0) {
    if (typeof prop.example === "string") {
      parts.push(`example: '${escapePhpString2(prop.example)}'`);
    } else {
      parts.push(`example: ${prop.example}`);
    }
  }
  return `${indent}new OA\\Property(${parts.join(", ")})`;
}
function resolveOptions3(options) {
  return {
    baseRequestNamespace: options?.baseRequestNamespace ?? DEFAULT_OPTIONS2.baseRequestNamespace,
    requestNamespace: options?.requestNamespace ?? DEFAULT_OPTIONS2.requestNamespace,
    baseRequestPath: options?.baseRequestPath ?? DEFAULT_OPTIONS2.baseRequestPath,
    requestPath: options?.requestPath ?? DEFAULT_OPTIONS2.requestPath,
    modelNamespace: options?.modelNamespace ?? DEFAULT_OPTIONS2.modelNamespace,
    customTypes: options?.customTypes ?? /* @__PURE__ */ new Map(),
    locale: options?.locale ?? DEFAULT_OPTIONS2.locale
  };
}
function escapePhpString2(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function getDisplayName(displayName, locale, fallback) {
  if (!displayName) return fallback;
  if (typeof displayName === "string") return displayName;
  if ((0, import_omnify_types3.isLocaleMap)(displayName)) {
    return displayName[locale] ?? displayName["en"] ?? fallback;
  }
  return fallback;
}
function getModuleName(schema) {
  if (schema.module) {
    return schema.module;
  }
  return "";
}
function generateStoreRules(propName, propDef, schema, schemas, options) {
  const rules = [];
  const snakeName = toSnakeCase(propName);
  const prop = propDef;
  const tableName = schema.options?.tableName ?? pluralize(toSnakeCase(schema.name));
  const isNullable2 = prop.nullable === true;
  if (!isNullable2) {
    rules.push("'required'");
  } else {
    rules.push("'nullable'");
  }
  switch (propDef.type) {
    case "String":
    case "Email":
    case "Password":
      rules.push("'string'");
      const length = prop.length ?? 255;
      rules.push(`'max:${length}'`);
      if (propDef.type === "Email") {
        rules.push("'email'");
      }
      break;
    case "Text":
    case "MediumText":
    case "LongText":
      rules.push("'string'");
      break;
    case "TinyInt":
    case "Int":
    case "BigInt":
      rules.push("'integer'");
      if (prop.min !== void 0) {
        rules.push(`'min:${prop.min}'`);
      }
      if (prop.max !== void 0) {
        rules.push(`'max:${prop.max}'`);
      }
      break;
    case "Float":
    case "Decimal":
      rules.push("'numeric'");
      if (prop.min !== void 0) {
        rules.push(`'min:${prop.min}'`);
      }
      if (prop.max !== void 0) {
        rules.push(`'max:${prop.max}'`);
      }
      break;
    case "Boolean":
      rules.push("'boolean'");
      break;
    case "Date":
      rules.push("'date'");
      break;
    case "DateTime":
    case "Timestamp":
      rules.push("'date'");
      break;
    case "Json":
      rules.push("'array'");
      break;
    case "Enum":
    case "EnumRef":
      rules.push("'string'");
      if (prop.enum && Array.isArray(prop.enum)) {
        const enumValues = getEnumStringValues(prop.enum);
        const values = enumValues.map((v) => `'${v}'`).join(", ");
        rules.push(`Rule::in([${values}])`);
      }
      break;
    case "Association":
      const assoc = propDef;
      if (assoc.relation === "ManyToOne" || assoc.relation === "OneToOne") {
        if (assoc.target) {
          const targetSchema = schemas[assoc.target];
          const targetTable = targetSchema?.options?.tableName ?? pluralize(toSnakeCase(assoc.target));
          rules.push("'integer'");
          rules.push(`'exists:${targetTable},id'`);
        }
      }
      break;
    default:
      const customType = options.customTypes.get(propDef.type);
      if (customType && !customType.compound) {
        if (propDef.type === "JapanesePhone") {
          rules.push("'string'");
          rules.push("'max:15'");
          rules.push("'regex:/^\\d{2,4}-\\d{2,4}-\\d{4}$/'");
        } else if (propDef.type === "JapanesePostalCode") {
          rules.push("'string'");
          rules.push("'max:8'");
          rules.push("'regex:/^\\d{3}-\\d{4}$/'");
        } else {
          const sqlType = customType.sql?.sqlType ?? "VARCHAR";
          const sqlLength = customType.sql?.length ?? 255;
          if (sqlType === "VARCHAR" || sqlType === "TEXT") {
            rules.push("'string'");
            if (sqlType === "VARCHAR") {
              rules.push(`'max:${sqlLength}'`);
            }
          } else if (sqlType === "INT" || sqlType === "TINYINT" || sqlType === "BIGINT") {
            rules.push("'integer'");
          } else if (sqlType === "DECIMAL" || sqlType === "FLOAT") {
            rules.push("'numeric'");
          }
        }
      }
      break;
  }
  if (prop.unique === true) {
    rules.push(`'unique:${tableName}'`);
  }
  return rules;
}
function generateUpdateRules(propName, propDef, schema, schemas, options) {
  const rules = [];
  const snakeName = toSnakeCase(propName);
  const prop = propDef;
  const tableName = schema.options?.tableName ?? pluralize(toSnakeCase(schema.name));
  const modelVar = toSnakeCase(schema.name);
  rules.push("'sometimes'");
  switch (propDef.type) {
    case "String":
    case "Email":
    case "Password":
      rules.push("'string'");
      const length = prop.length ?? 255;
      rules.push(`'max:${length}'`);
      if (propDef.type === "Email") {
        rules.push("'email'");
      }
      break;
    case "Text":
    case "MediumText":
    case "LongText":
      rules.push("'string'");
      break;
    case "TinyInt":
    case "Int":
    case "BigInt":
      rules.push("'integer'");
      if (prop.min !== void 0) {
        rules.push(`'min:${prop.min}'`);
      }
      if (prop.max !== void 0) {
        rules.push(`'max:${prop.max}'`);
      }
      break;
    case "Float":
    case "Decimal":
      rules.push("'numeric'");
      if (prop.min !== void 0) {
        rules.push(`'min:${prop.min}'`);
      }
      if (prop.max !== void 0) {
        rules.push(`'max:${prop.max}'`);
      }
      break;
    case "Boolean":
      rules.push("'boolean'");
      break;
    case "Date":
      rules.push("'date'");
      break;
    case "DateTime":
    case "Timestamp":
      rules.push("'date'");
      break;
    case "Json":
      rules.push("'array'");
      break;
    case "Enum":
    case "EnumRef":
      rules.push("'string'");
      if (prop.enum && Array.isArray(prop.enum)) {
        const enumValues = getEnumStringValues(prop.enum);
        const values = enumValues.map((v) => `'${v}'`).join(", ");
        rules.push(`Rule::in([${values}])`);
      }
      break;
    case "Association":
      const assoc = propDef;
      if (assoc.relation === "ManyToOne" || assoc.relation === "OneToOne") {
        if (assoc.target) {
          const targetSchema = schemas[assoc.target];
          const targetTable = targetSchema?.options?.tableName ?? pluralize(toSnakeCase(assoc.target));
          rules.push("'integer'");
          rules.push(`'exists:${targetTable},id'`);
        }
      }
      break;
    default:
      const customType = options.customTypes.get(propDef.type);
      if (customType && !customType.compound) {
        if (propDef.type === "JapanesePhone") {
          rules.push("'string'");
          rules.push("'max:15'");
          rules.push("'regex:/^\\d{2,4}-\\d{2,4}-\\d{4}$/'");
        } else if (propDef.type === "JapanesePostalCode") {
          rules.push("'string'");
          rules.push("'max:8'");
          rules.push("'regex:/^\\d{3}-\\d{4}$/'");
        } else {
          const sqlType = customType.sql?.sqlType ?? "VARCHAR";
          const sqlLength = customType.sql?.length ?? 255;
          if (sqlType === "VARCHAR" || sqlType === "TEXT") {
            rules.push("'string'");
            if (sqlType === "VARCHAR") {
              rules.push(`'max:${sqlLength}'`);
            }
          } else if (sqlType === "INT" || sqlType === "TINYINT" || sqlType === "BIGINT") {
            rules.push("'integer'");
          } else if (sqlType === "DECIMAL" || sqlType === "FLOAT") {
            rules.push("'numeric'");
          }
        }
      }
      break;
  }
  if (prop.unique === true) {
    rules.push(`Rule::unique('${tableName}')->ignore($this->route('${modelVar}'))`);
  }
  return rules;
}
function getCompoundFieldRules(typeName, suffix, field, fieldOverride) {
  const rules = [];
  const sql = field.sql;
  const length = fieldOverride?.length ?? sql?.length ?? 255;
  switch (typeName) {
    case "JapaneseName":
      rules.push("'string'");
      rules.push(`'max:${length}'`);
      if (suffix === "KanaLastname" || suffix === "KanaFirstname") {
        rules.push("'regex:/^[\\x{30A0}-\\x{30FF}\\x{3000}-\\x{303F}\\x{FF00}-\\x{FF9F}\\s]+$/u'");
      }
      break;
    case "JapaneseAddress":
      if (suffix === "PostalCode") {
        rules.push("'string'");
        rules.push("'max:8'");
        rules.push("'regex:/^\\d{3}-\\d{4}$/'");
      } else if (suffix === "PrefectureId") {
        rules.push("'integer'");
        rules.push("'between:1,47'");
      } else {
        rules.push("'string'");
        rules.push(`'max:${length}'`);
      }
      break;
    case "JapaneseBankAccount":
      if (suffix === "BankCode") {
        rules.push("'string'");
        rules.push("'size:4'");
        rules.push("'regex:/^\\d{4}$/'");
      } else if (suffix === "BranchCode") {
        rules.push("'string'");
        rules.push("'size:3'");
        rules.push("'regex:/^\\d{3}$/'");
      } else if (suffix === "AccountType") {
        rules.push("'string'");
        rules.push("Rule::in(['1', '2', '4'])");
      } else if (suffix === "AccountNumber") {
        rules.push("'string'");
        rules.push("'max:7'");
        rules.push("'regex:/^\\d{1,7}$/'");
      } else if (suffix === "AccountHolder") {
        rules.push("'string'");
        rules.push(`'max:${length}'`);
        rules.push("'regex:/^[\\x{30A0}-\\x{30FF}\\x{3000}-\\x{303F}\\x{FF00}-\\x{FF9F}\\s]+$/u'");
      }
      break;
    default:
      if (sql?.sqlType === "TINYINT" || sql?.sqlType === "INT" || sql?.sqlType === "BIGINT") {
        rules.push("'integer'");
        if (sql?.unsigned) {
          rules.push("'min:0'");
        }
      } else {
        rules.push("'string'");
        rules.push(`'max:${length}'`);
      }
      break;
  }
  return rules;
}
function expandCompoundTypeFields(propName, propDef, options) {
  const typeDef = options.customTypes.get(propDef.type);
  if (!typeDef || !typeDef.compound || !typeDef.expand) {
    return [];
  }
  const snakeName = toSnakeCase(propName);
  const prop = propDef;
  const isNullable2 = prop.nullable === true;
  const fields = [];
  for (const field of typeDef.expand) {
    const suffixSnake = toSnakeCase(field.suffix);
    const fieldName = `${snakeName}_${suffixSnake}`;
    const fieldOverride = prop.fields?.[field.suffix];
    const fieldDefNullable = field.sql?.nullable ?? false;
    const fieldNullable = fieldOverride?.nullable ?? fieldDefNullable ?? isNullable2;
    const rules = [];
    if (!fieldNullable) {
      rules.push("'required'");
    } else {
      rules.push("'nullable'");
    }
    const typeRules = getCompoundFieldRules(propDef.type, field.suffix, field, fieldOverride);
    rules.push(...typeRules);
    const needsRuleImport = rules.some((r) => r.includes("Rule::"));
    fields.push({ fieldName, rules, needsRuleImport });
  }
  return fields;
}
function generateStoreRequestBase(schema, schemas, options) {
  const className = toPascalCase(schema.name);
  const module2 = getModuleName(schema);
  const namespaceModule = module2 ? `\\${module2}` : "";
  const namespace = `${options.baseRequestNamespace}${namespaceModule}`;
  const properties = schema.properties ?? {};
  const rulesLines = [];
  const attributeLines = [];
  const fieldList = [];
  let needsRuleImport = false;
  for (const [propName, propDef] of Object.entries(properties)) {
    const snakeName = toSnakeCase(propName);
    if (SKIP_FIELDS.has(snakeName)) continue;
    if (propDef.type === "Association") {
      const assoc = propDef;
      if (assoc.relation !== "ManyToOne" && assoc.relation !== "OneToOne") {
        continue;
      }
      const fkName = `${snakeName}_id`;
      const rules2 = generateStoreRules(propName, propDef, schema, schemas, options);
      if (rules2.some((r) => r.includes("Rule::"))) needsRuleImport = true;
      rulesLines.push(`            '${fkName}' => [${rules2.join(", ")}],`);
      fieldList.push(fkName);
      const displayName2 = getDisplayName(propDef.displayName, options.locale, propName);
      attributeLines.push(`            '${fkName}' => '${escapePhpString2(displayName2)}',`);
      continue;
    }
    const expandedFields = expandCompoundTypeFields(propName, propDef, options);
    if (expandedFields.length > 0) {
      for (const field of expandedFields) {
        if (field.needsRuleImport) needsRuleImport = true;
        rulesLines.push(`            '${field.fieldName}' => [${field.rules.join(", ")}],`);
        fieldList.push(field.fieldName);
        attributeLines.push(`            '${field.fieldName}' => '${escapePhpString2(field.fieldName)}',`);
      }
      continue;
    }
    const rules = generateStoreRules(propName, propDef, schema, schemas, options);
    if (rules.some((r) => r.includes("Rule::"))) needsRuleImport = true;
    rulesLines.push(`            '${snakeName}' => [${rules.join(", ")}],`);
    fieldList.push(snakeName);
    const displayName = getDisplayName(propDef.displayName, options.locale, propName);
    attributeLines.push(`            '${snakeName}' => '${escapePhpString2(displayName)}',`);
  }
  const ruleImport = needsRuleImport ? "\nuse Illuminate\\Validation\\Rule;" : "";
  const content = `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify from schema: ${schema.name}
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 *
 * @generated by @famgia/omnify-laravel
 */

namespace ${namespace};

use Illuminate\\Foundation\\Http\\FormRequest;${ruleImport}

abstract class ${className}StoreRequestBase extends FormRequest
{
    /**
     * Validation rules generated from Omnify schema.
     *
     * Generated fields: ${fieldList.join(", ")}
     *
     * @return array<string, array<int, mixed>>
     */
    protected function schemaRules(): array
    {
        return [
${rulesLines.join("\n")}
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    protected function schemaAttributes(): array
    {
        return [
${attributeLines.join("\n")}
        ];
    }
}
`;
  const modulePath = module2 ? `/${module2}` : "";
  return {
    path: `${options.baseRequestPath}${modulePath}/${className}StoreRequestBase.php`,
    content,
    type: "store-base",
    overwrite: true,
    schemaName: schema.name,
    module: module2
  };
}
function generateUpdateRequestBase(schema, schemas, options) {
  const className = toPascalCase(schema.name);
  const module2 = getModuleName(schema);
  const namespaceModule = module2 ? `\\${module2}` : "";
  const namespace = `${options.baseRequestNamespace}${namespaceModule}`;
  const properties = schema.properties ?? {};
  const rulesLines = [];
  const attributeLines = [];
  let needsRuleImport = false;
  for (const [propName, propDef] of Object.entries(properties)) {
    const snakeName = toSnakeCase(propName);
    if (SKIP_FIELDS.has(snakeName)) continue;
    if (propDef.type === "Association") {
      const assoc = propDef;
      if (assoc.relation !== "ManyToOne" && assoc.relation !== "OneToOne") {
        continue;
      }
      const fkName = `${snakeName}_id`;
      const rules2 = generateUpdateRules(propName, propDef, schema, schemas, options);
      if (rules2.some((r) => r.includes("Rule::") || r.includes("Rule::"))) needsRuleImport = true;
      rulesLines.push(`            '${fkName}' => [${rules2.join(", ")}],`);
      const displayName2 = getDisplayName(propDef.displayName, options.locale, propName);
      attributeLines.push(`            '${fkName}' => '${escapePhpString2(displayName2)}',`);
      continue;
    }
    const expandedFields = expandCompoundTypeFields(propName, propDef, options);
    if (expandedFields.length > 0) {
      for (const field of expandedFields) {
        if (field.needsRuleImport) needsRuleImport = true;
        const updateRules = field.rules.map((r) => r === "'required'" ? "'sometimes'" : r);
        rulesLines.push(`            '${field.fieldName}' => [${updateRules.join(", ")}],`);
        attributeLines.push(`            '${field.fieldName}' => '${escapePhpString2(field.fieldName)}',`);
      }
      continue;
    }
    const rules = generateUpdateRules(propName, propDef, schema, schemas, options);
    if (rules.some((r) => r.includes("Rule::"))) needsRuleImport = true;
    rulesLines.push(`            '${snakeName}' => [${rules.join(", ")}],`);
    const displayName = getDisplayName(propDef.displayName, options.locale, propName);
    attributeLines.push(`            '${snakeName}' => '${escapePhpString2(displayName)}',`);
  }
  const ruleImport = needsRuleImport ? "\nuse Illuminate\\Validation\\Rule;" : "";
  const content = `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify from schema: ${schema.name}
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 *
 * @generated by @famgia/omnify-laravel
 */

namespace ${namespace};

use Illuminate\\Foundation\\Http\\FormRequest;${ruleImport}

abstract class ${className}UpdateRequestBase extends FormRequest
{
    /**
     * Validation rules generated from Omnify schema.
     * All fields use 'sometimes' for partial updates.
     *
     * @return array<string, array<int, mixed>>
     */
    protected function schemaRules(): array
    {
        return [
${rulesLines.join("\n")}
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    protected function schemaAttributes(): array
    {
        return [
${attributeLines.join("\n")}
        ];
    }
}
`;
  const modulePath = module2 ? `/${module2}` : "";
  return {
    path: `${options.baseRequestPath}${modulePath}/${className}UpdateRequestBase.php`,
    content,
    type: "update-base",
    overwrite: true,
    schemaName: schema.name,
    module: module2
  };
}
function generateRequestOpenApiProperties(schema, schemas, options, isStore) {
  const properties = [];
  const requiredFields = [];
  const schemaProps = schema.properties ?? {};
  for (const [propName, propDef] of Object.entries(schemaProps)) {
    const snakeName = toSnakeCase(propName);
    if (SKIP_FIELDS.has(snakeName)) continue;
    if (propDef.type === "Association") {
      const assoc = propDef;
      if (assoc.relation !== "ManyToOne" && assoc.relation !== "OneToOne") {
        continue;
      }
      const fkName = `${snakeName}_id`;
      const rules2 = isStore ? generateStoreRules(propName, propDef, schema, schemas, options) : generateUpdateRules(propName, propDef, schema, schemas, options);
      const openApiType2 = mapValidationToOpenApiType(rules2, fkName);
      const constraints2 = extractConstraints(rules2);
      const example2 = getExampleValue(fkName, openApiType2.type);
      const prop2 = {
        property: fkName,
        ...openApiType2,
        ...constraints2
      };
      if (example2 !== void 0) prop2.example = example2;
      properties.push(prop2);
      if (isStore && !propDef.nullable) {
        requiredFields.push(fkName);
      }
      continue;
    }
    const expandedFields = expandCompoundTypeFields(propName, propDef, options);
    if (expandedFields.length > 0) {
      for (const field of expandedFields) {
        const openApiType2 = mapValidationToOpenApiType(field.rules, field.fieldName);
        const constraints2 = extractConstraints(field.rules);
        const example2 = getExampleValue(field.fieldName, openApiType2.type);
        const prop2 = {
          property: field.fieldName,
          ...openApiType2,
          ...constraints2
        };
        if (example2 !== void 0) prop2.example = example2;
        properties.push(prop2);
        if (isStore && field.rules.includes("'required'")) {
          requiredFields.push(field.fieldName);
        }
      }
      continue;
    }
    const rules = isStore ? generateStoreRules(propName, propDef, schema, schemas, options) : generateUpdateRules(propName, propDef, schema, schemas, options);
    const openApiType = mapValidationToOpenApiType(rules, snakeName);
    const constraints = extractConstraints(rules);
    const example = getExampleValue(snakeName, openApiType.type);
    const prop = {
      property: snakeName,
      ...openApiType,
      ...constraints
    };
    if (example !== void 0) prop.example = example;
    properties.push(prop);
    if (isStore && rules.includes("'required'")) {
      requiredFields.push(snakeName);
    }
  }
  return { properties, requiredFields };
}
function generateStoreRequest(schema, schemas, options) {
  const className = toPascalCase(schema.name);
  const module2 = getModuleName(schema);
  const namespaceModule = module2 ? `\\${module2}` : "";
  const namespace = `${options.requestNamespace}${namespaceModule}`;
  const baseNamespace = `${options.baseRequestNamespace}${namespaceModule}`;
  const { properties, requiredFields } = generateRequestOpenApiProperties(schema, schemas, options, true);
  const propsIndent = "        ";
  const openApiPropsFormatted = properties.map((prop) => formatRequestOpenApiProperty(prop, propsIndent)).join(",\n");
  const requiredArray = requiredFields.length > 0 ? `
    required: [${requiredFields.map((f) => `'${f}'`).join(", ")}],` : "";
  const content = `<?php

/**
 * ${className} Store Request
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace ${namespace};

use OpenApi\\Attributes as OA;
use ${baseNamespace}\\${className}StoreRequestBase;

#[OA\\Schema(
    schema: '${schema.name}StoreRequest',${requiredArray}
    properties: [
${openApiPropsFormatted},
    ]
)]
class ${className}StoreRequest extends ${className}StoreRequestBase
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return array_merge($this->schemaRules(), [
            // Custom/override rules here
        ]);
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return array_merge($this->schemaAttributes(), [
            // Custom attributes here
        ]);
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Custom messages here
        ];
    }
}
`;
  const modulePath = module2 ? `/${module2}` : "";
  return {
    path: `${options.requestPath}${modulePath}/${className}StoreRequest.php`,
    content,
    type: "store",
    overwrite: false,
    schemaName: schema.name,
    module: module2
  };
}
function generateUpdateRequest(schema, schemas, options) {
  const className = toPascalCase(schema.name);
  const module2 = getModuleName(schema);
  const namespaceModule = module2 ? `\\${module2}` : "";
  const namespace = `${options.requestNamespace}${namespaceModule}`;
  const baseNamespace = `${options.baseRequestNamespace}${namespaceModule}`;
  const { properties } = generateRequestOpenApiProperties(schema, schemas, options, false);
  const propsIndent = "        ";
  const openApiPropsFormatted = properties.map((prop) => formatRequestOpenApiProperty(prop, propsIndent)).join(",\n");
  const content = `<?php

/**
 * ${className} Update Request
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace ${namespace};

use OpenApi\\Attributes as OA;
use ${baseNamespace}\\${className}UpdateRequestBase;

#[OA\\Schema(
    schema: '${schema.name}UpdateRequest',
    properties: [
${openApiPropsFormatted},
    ]
)]
class ${className}UpdateRequest extends ${className}UpdateRequestBase
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return array_merge($this->schemaRules(), [
            // Custom/override rules here
        ]);
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return array_merge($this->schemaAttributes(), [
            // Custom attributes here
        ]);
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Custom messages here
        ];
    }
}
`;
  const modulePath = module2 ? `/${module2}` : "";
  return {
    path: `${options.requestPath}${modulePath}/${className}UpdateRequest.php`,
    content,
    type: "update",
    overwrite: false,
    schemaName: schema.name,
    module: module2
  };
}
function generateRequests(schemas, options) {
  const resolved = resolveOptions3(options);
  const requests = [];
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") continue;
    if (schema.options?.hidden === true) continue;
    requests.push(generateStoreRequestBase(schema, schemas, resolved));
    requests.push(generateUpdateRequestBase(schema, schemas, resolved));
    requests.push(generateStoreRequest(schema, schemas, resolved));
    requests.push(generateUpdateRequest(schema, schemas, resolved));
  }
  return requests;
}
function getRequestPath(request) {
  return request.path;
}

// src/resource/generator.ts
var import_omnify_types4 = require("@famgia/omnify-types");
var DEFAULT_OPTIONS3 = {
  baseResourceNamespace: "App\\Http\\Resources\\OmnifyBase",
  resourceNamespace: "App\\Http\\Resources",
  baseResourcePath: "app/Http/Resources/OmnifyBase",
  resourcePath: "app/Http/Resources",
  customTypes: /* @__PURE__ */ new Map(),
  locale: "en"
};
var SKIP_FIELDS2 = /* @__PURE__ */ new Set([
  "password",
  "remember_token"
]);
function mapTsTypeToOpenApi(tsType, fieldName) {
  if (fieldName.includes("email")) {
    return { type: "string", format: "email" };
  }
  switch (tsType) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    default:
      return { type: "string" };
  }
}
function getOpenApiType(propDef, fieldName) {
  switch (propDef.type) {
    case "Date":
      return { type: "string", format: "date" };
    case "DateTime":
    case "Timestamp":
      return { type: "string", format: "date-time" };
  }
  if (fieldName.includes("email") && !fieldName.endsWith("_at")) {
    return { type: "string", format: "email" };
  }
  if (fieldName.includes("password")) {
    return { type: "string", format: "password" };
  }
  switch (propDef.type) {
    case "String":
    case "Text":
    case "LongText":
      return { type: "string" };
    case "Int":
    case "BigInt":
      return { type: "integer" };
    case "Float":
    case "Decimal":
      return { type: "number" };
    case "Boolean":
      return { type: "boolean" };
    case "Email":
      return { type: "string", format: "email" };
    case "UUID":
      return { type: "string", format: "uuid" };
    case "JSON":
      return { type: "object" };
    default:
      return { type: "string" };
  }
}
function generateOpenApiProperties(schema, options) {
  const properties = [];
  const schemaProps = schema.properties ?? {};
  if (schema.options?.id !== false) {
    properties.push({
      property: "id",
      type: "integer",
      example: 1
    });
  }
  for (const [propName, propDef] of Object.entries(schemaProps)) {
    const snakeName = toSnakeCase(propName);
    if (SKIP_FIELDS2.has(snakeName)) continue;
    if (propDef.hidden === true) continue;
    if (propDef.type === "Association") continue;
    const typeDef = options.customTypes.get(propDef.type);
    if (typeDef?.compound && typeDef.expand) {
      for (const field of typeDef.expand) {
        const suffixSnake = toSnakeCase(field.suffix);
        const fieldName = `${snakeName}_${suffixSnake}`;
        const tsType = field.typescript?.type ?? "string";
        const openApiType2 = mapTsTypeToOpenApi(tsType, fieldName);
        const prop2 = {
          property: fieldName,
          ...openApiType2
        };
        const sqlDef = field.sql;
        if (sqlDef?.length) {
          prop2.maxLength = sqlDef.length;
        }
        properties.push(prop2);
      }
      if (typeDef.accessors) {
        for (const accessor of typeDef.accessors) {
          const accessorName = `${snakeName}_${toSnakeCase(accessor.name)}`;
          properties.push({
            property: accessorName,
            type: "string"
          });
        }
      }
      continue;
    }
    const openApiType = getOpenApiType(propDef, snakeName);
    const prop = {
      property: snakeName,
      ...openApiType
    };
    const length = propDef.length;
    if (length) {
      prop.maxLength = length;
    }
    if (propDef.nullable) {
      prop.nullable = true;
    }
    properties.push(prop);
  }
  if (schema.options?.timestamps !== false) {
    properties.push({
      property: "created_at",
      type: "string",
      format: "date-time"
    });
    properties.push({
      property: "updated_at",
      type: "string",
      format: "date-time"
    });
  }
  if (schema.options?.softDelete) {
    properties.push({
      property: "deleted_at",
      type: "string",
      format: "date-time",
      nullable: true
    });
  }
  return properties;
}
function formatOpenApiProperty(prop, indent) {
  const parts = [`property: '${prop.property}'`, `type: '${prop.type}'`];
  if (prop.format) {
    parts.push(`format: '${prop.format}'`);
  }
  if (prop.maxLength) {
    parts.push(`maxLength: ${prop.maxLength}`);
  }
  if (prop.nullable) {
    parts.push(`nullable: true`);
  }
  if (prop.example !== void 0) {
    if (typeof prop.example === "string") {
      parts.push(`example: '${prop.example}'`);
    } else {
      parts.push(`example: ${prop.example}`);
    }
  }
  return `${indent}new OA\\Property(${parts.join(", ")})`;
}
function resolveOptions4(options) {
  return {
    baseResourceNamespace: options?.baseResourceNamespace ?? DEFAULT_OPTIONS3.baseResourceNamespace,
    resourceNamespace: options?.resourceNamespace ?? DEFAULT_OPTIONS3.resourceNamespace,
    baseResourcePath: options?.baseResourcePath ?? DEFAULT_OPTIONS3.baseResourcePath,
    resourcePath: options?.resourcePath ?? DEFAULT_OPTIONS3.resourcePath,
    customTypes: options?.customTypes ?? /* @__PURE__ */ new Map(),
    locale: options?.locale ?? DEFAULT_OPTIONS3.locale
  };
}
function escapePhpString3(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function getModuleName2(schema) {
  if (schema.module) {
    return schema.module;
  }
  return "";
}
function getFieldExpression(fieldName, propDef) {
  switch (propDef.type) {
    case "Date":
      return `$this->${fieldName}?->toDateString()`;
    case "DateTime":
    case "Timestamp":
      return `$this->${fieldName}?->toISOString()`;
    default:
      return `$this->${fieldName}`;
  }
}
function getPropertyOutput(propName, propDef, schemas, options) {
  const snakeName = toSnakeCase(propName);
  const lines = [];
  if (SKIP_FIELDS2.has(snakeName)) {
    return lines;
  }
  if (propDef.type === "Association") {
    const assoc = propDef;
    const targetClass = assoc.target ? toPascalCase(assoc.target) : "";
    switch (assoc.relation) {
      case "ManyToOne":
      case "OneToOne":
        lines.push(`            '${snakeName}_id' => $this->${snakeName}_id,`);
        lines.push(`            '${snakeName}' => $this->whenLoaded('${toCamelCase(propName)}', fn() => new ${targetClass}Resource($this->${toCamelCase(propName)})),`);
        break;
      case "OneToMany":
      case "ManyToMany":
        lines.push(`            '${snakeName}' => $this->whenLoaded('${toCamelCase(propName)}', fn() => ${targetClass}Resource::collection($this->${toCamelCase(propName)})),`);
        break;
      case "MorphTo":
        lines.push(`            '${snakeName}_type' => $this->${snakeName}_type,`);
        lines.push(`            '${snakeName}_id' => $this->${snakeName}_id,`);
        lines.push(`            '${snakeName}' => $this->whenLoaded('${toCamelCase(propName)}'),`);
        break;
      case "MorphOne":
      case "MorphMany":
        lines.push(`            '${snakeName}' => $this->whenLoaded('${toCamelCase(propName)}', fn() => ${targetClass}Resource::collection($this->${toCamelCase(propName)})),`);
        break;
    }
    return lines;
  }
  const typeDef = options.customTypes.get(propDef.type);
  if (typeDef?.compound && typeDef.expand) {
    for (const field of typeDef.expand) {
      const suffixSnake = toSnakeCase(field.suffix);
      const fieldName = `${snakeName}_${suffixSnake}`;
      lines.push(`            '${fieldName}' => $this->${fieldName},`);
    }
    if (typeDef.accessors) {
      for (const accessor of typeDef.accessors) {
        const accessorName = `${snakeName}_${toSnakeCase(accessor.name)}`;
        lines.push(`            '${accessorName}' => $this->${accessorName},`);
      }
    }
    return lines;
  }
  const expression = getFieldExpression(snakeName, propDef);
  lines.push(`            '${snakeName}' => ${expression},`);
  return lines;
}
function generateResourceBase(schema, schemas, options) {
  const className = toPascalCase(schema.name);
  const module2 = getModuleName2(schema);
  const namespaceModule = module2 ? `\\${module2}` : "";
  const namespace = `${options.baseResourceNamespace}${namespaceModule}`;
  const properties = schema.properties ?? {};
  const outputLines = [];
  const imports = /* @__PURE__ */ new Set();
  if (schema.options?.id !== false) {
    outputLines.push(`            'id' => $this->id,`);
  }
  for (const [propName, propDef] of Object.entries(properties)) {
    const lines = getPropertyOutput(propName, propDef, schemas, options);
    outputLines.push(...lines);
    if (propDef.type === "Association") {
      const assoc = propDef;
      if (assoc.target) {
        const targetModule = getModuleName2(schemas[assoc.target] ?? schema);
        const targetModuleNs = targetModule ? `\\${targetModule}` : "";
        imports.add(`use ${options.resourceNamespace}${targetModuleNs}\\${toPascalCase(assoc.target)}Resource;`);
      }
    }
  }
  if (schema.options?.timestamps !== false) {
    outputLines.push(`            'created_at' => $this->created_at?->toISOString(),`);
    outputLines.push(`            'updated_at' => $this->updated_at?->toISOString(),`);
  }
  if (schema.options?.softDelete) {
    outputLines.push(`            'deleted_at' => $this->deleted_at?->toISOString(),`);
  }
  const importLines = Array.from(imports).sort().join("\n");
  const importBlock = importLines ? `
${importLines}` : "";
  const content = `<?php

/**
 * \u26A0\uFE0F DO NOT EDIT THIS FILE! \u26A0\uFE0F
 * \u3053\u306E\u30D5\u30A1\u30A4\u30EB\u3092\u7DE8\u96C6\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF01
 * KH\xD4NG \u0110\u01AF\u1EE2C S\u1EECA FILE N\xC0Y!
 *
 * This file is AUTO-GENERATED by Omnify from schema: ${schema.name}
 * Any manual changes will be OVERWRITTEN on next generation.
 *
 * To modify: Edit the schema YAML file and run: npx omnify generate
 *
 * @generated by @famgia/omnify-laravel
 */

namespace ${namespace};

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;${importBlock}

class ${className}ResourceBase extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    protected function schemaArray(Request $request): array
    {
        return [
${outputLines.join("\n")}
        ];
    }
}
`;
  const modulePath = module2 ? `/${module2}` : "";
  return {
    path: `${options.baseResourcePath}${modulePath}/${className}ResourceBase.php`,
    content,
    type: "base",
    overwrite: true,
    schemaName: schema.name,
    module: module2
  };
}
function generateResource(schema, options) {
  const className = toPascalCase(schema.name);
  const module2 = getModuleName2(schema);
  const namespaceModule = module2 ? `\\${module2}` : "";
  const namespace = `${options.resourceNamespace}${namespaceModule}`;
  const baseNamespace = `${options.baseResourceNamespace}${namespaceModule}`;
  const openApiProps = generateOpenApiProperties(schema, options);
  const propsIndent = "        ";
  const openApiPropsFormatted = openApiProps.map((prop) => formatOpenApiProperty(prop, propsIndent)).join(",\n");
  const description = schema.displayName ? typeof schema.displayName === "string" ? schema.displayName : schema.displayName["en"] ?? schema.name : `${schema.name} resource`;
  const content = `<?php

/**
 * ${className} Resource
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace ${namespace};

use Illuminate\\Http\\Request;
use OpenApi\\Attributes as OA;
use ${baseNamespace}\\${className}ResourceBase;

#[OA\\Schema(
    schema: '${schema.name}',
    description: '${escapePhpString3(description)}',
    properties: [
${openApiPropsFormatted},
    ]
)]
class ${className}Resource extends ${className}ResourceBase
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge($this->schemaArray($request), [
            // Custom fields here
        ]);
    }

    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            // Additional metadata here
        ];
    }
}
`;
  const modulePath = module2 ? `/${module2}` : "";
  return {
    path: `${options.resourcePath}${modulePath}/${className}Resource.php`,
    content,
    type: "user",
    overwrite: false,
    schemaName: schema.name,
    module: module2
  };
}
function generateResources(schemas, options) {
  const resolved = resolveOptions4(options);
  const resources = [];
  for (const schema of Object.values(schemas)) {
    if (schema.kind === "enum") continue;
    if (schema.options?.hidden === true) continue;
    resources.push(generateResourceBase(schema, schemas, resolved));
    resources.push(generateResource(schema, resolved));
  }
  return resources;
}
function getResourcePath(resource) {
  return resource.path;
}

// src/ai-guides/generator.ts
var import_node_fs = require("fs");
var import_node_path = require("path");
var import_omnify_core = require("@famgia/omnify-core");
function extractLaravelBasePath(modelsPath) {
  if (!modelsPath) return "app";
  const normalized = modelsPath.replace(/\\/g, "/");
  const match = normalized.match(/^(.+?)\/Models(?:\/.*)?$/);
  if (match && match[1]) {
    return match[1];
  }
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length > 1) {
    return parts.slice(0, -1).join("/");
  }
  return "app";
}
function extractLaravelRoot(basePath) {
  const normalized = basePath.replace(/\\/g, "/");
  const match = normalized.match(/^(.+?)\/app$/);
  if (match && match[1]) {
    return match[1];
  }
  return "";
}
function expandPackageGlobs(cursorRulesDir, basePath, packagePaths) {
  if (!packagePaths.length || !(0, import_node_fs.existsSync)(cursorRulesDir)) {
    return;
  }
  const files = (0, import_node_fs.readdirSync)(cursorRulesDir).filter((f) => f.endsWith(".mdc"));
  for (const file of files) {
    const filePath = (0, import_node_path.join)(cursorRulesDir, file);
    let content = (0, import_node_fs.readFileSync)(filePath, "utf-8");
    if (!content.startsWith("---")) continue;
    const endIndex = content.indexOf("---", 3);
    if (endIndex === -1) continue;
    const frontmatter = content.substring(0, endIndex + 3);
    const body = content.substring(endIndex + 3);
    const globsMatch = frontmatter.match(/globs:\s*\[([^\]]*)\]/);
    if (!globsMatch) continue;
    const originalGlobs = globsMatch[1].split(",").map((g) => g.trim().replace(/["']/g, "")).filter(Boolean);
    const specificPatterns = [
      { pattern: `${basePath}/Models/OmnifyBase/`, suffix: "Models/OmnifyBase/" },
      { pattern: `${basePath}/Models/`, suffix: "Models/" }
    ];
    const generalAppPattern = `${basePath}/**/*.php`;
    const newGlobs = [];
    for (const glob of originalGlobs) {
      newGlobs.push(glob);
      if (glob === generalAppPattern) {
        for (const pkg of packagePaths) {
          const pkgBase = pkg.base.replace(/^\.\//, "");
          const pkgGlob = `${pkgBase}/src/**/*.php`;
          if (!newGlobs.includes(pkgGlob)) {
            newGlobs.push(pkgGlob);
          }
        }
        continue;
      }
      for (const { pattern, suffix } of specificPatterns) {
        if (glob.includes(pattern)) {
          for (const pkg of packagePaths) {
            const pkgBase = pkg.base.replace(/^\.\//, "");
            const pkgModelsPath = pkg.modelsPath ?? "src/Models";
            const afterModels = glob.split(pattern)[1] || "";
            const modelsSuffix = suffix.replace("Models/", "");
            const pkgGlob = `${pkgBase}/${pkgModelsPath}/${modelsSuffix}${afterModels}`;
            if (!newGlobs.includes(pkgGlob)) {
              newGlobs.push(pkgGlob);
            }
          }
          break;
        }
      }
    }
    if (newGlobs.length > originalGlobs.length) {
      const newGlobsStr = newGlobs.map((g) => `"${g}"`).join(", ");
      const newFrontmatter = frontmatter.replace(
        /globs:\s*\[[^\]]*\]/,
        `globs: [${newGlobsStr}]`
      );
      (0, import_node_fs.writeFileSync)(filePath, newFrontmatter + body);
    }
  }
}
function generateAIGuides(rootDir, options = {}) {
  const basePath = options.laravelBasePath || extractLaravelBasePath(options.modelsPath);
  const laravelRoot = extractLaravelRoot(basePath);
  const tsPath = options.typescriptBasePath || "resources/ts";
  const coreResult = (0, import_omnify_core.generateAIGuides)(rootDir, {
    placeholders: {
      LARAVEL_BASE: basePath,
      LARAVEL_ROOT: laravelRoot ? laravelRoot + "/" : "",
      TYPESCRIPT_BASE: tsPath
    }
  });
  if (options.packagePaths?.length) {
    const cursorRulesDir = (0, import_node_path.resolve)(rootDir, ".cursor/rules/omnify");
    expandPackageGlobs(cursorRulesDir, basePath, options.packagePaths);
  }
  const result = {
    claudeGuides: 0,
    claudeRules: 0,
    claudeChecklists: 0,
    claudeWorkflows: 0,
    claudeAgents: 0,
    claudeOmnify: 0,
    cursorRules: 0,
    antigravityRules: 0,
    files: coreResult.files
  };
  const claudeCount = coreResult.counts["claude"] || 0;
  const cursorCount = coreResult.counts["cursor"] || 0;
  const antigravityCount = coreResult.counts["antigravity"] || 0;
  result.claudeGuides = Math.floor(claudeCount * 0.4);
  result.claudeRules = Math.floor(claudeCount * 0.2);
  result.claudeChecklists = Math.floor(claudeCount * 0.1);
  result.claudeWorkflows = Math.floor(claudeCount * 0.1);
  result.claudeAgents = Math.floor(claudeCount * 0.1);
  result.claudeOmnify = claudeCount - result.claudeGuides - result.claudeRules - result.claudeChecklists - result.claudeWorkflows - result.claudeAgents;
  result.cursorRules = cursorCount;
  result.antigravityRules = antigravityCount;
  return result;
}
function shouldGenerateAIGuides(rootDir) {
  const claudeDir = (0, import_node_path.resolve)(rootDir, ".claude/omnify/guides/laravel");
  const cursorDir = (0, import_node_path.resolve)(rootDir, ".cursor/rules/omnify");
  if (!(0, import_node_fs.existsSync)(claudeDir) || !(0, import_node_fs.existsSync)(cursorDir)) {
    return true;
  }
  try {
    const claudeFiles = (0, import_node_fs.readdirSync)(claudeDir);
    const cursorFiles = (0, import_node_fs.readdirSync)(cursorDir);
    const hasLaravelRules = cursorFiles.some((f) => f.startsWith("laravel"));
    return claudeFiles.length === 0 || !hasLaravelRules;
  } catch {
    return true;
  }
}

// src/plugin.ts
function extractPackagePaths(schemas) {
  const packageMap = /* @__PURE__ */ new Map();
  for (const schema of Object.values(schemas)) {
    const pkg = schema.packageOutput?.laravel;
    if (pkg?.base && !packageMap.has(pkg.base)) {
      packageMap.set(pkg.base, {
        base: pkg.base,
        modelsPath: pkg.modelsPath ?? "src/Models",
        migrationsPath: pkg.migrationsPath ?? "database/migrations"
      });
    }
  }
  return Array.from(packageMap.values());
}
function getMigrationPathForSchema(migration, schemas, defaultPath) {
  if (migration.schemaName) {
    const schema = schemas[migration.schemaName];
    if (schema?.packageOutput?.laravel) {
      const pkg = schema.packageOutput.laravel;
      const migrationsPath = `${pkg.base}/${pkg.migrationsPath ?? "database/migrations"}`;
      return `${migrationsPath}/${migration.fileName}`;
    }
  }
  return getMigrationPath(migration, defaultPath);
}
function inferLaravelRoot(providersPath) {
  const normalized = providersPath.replace(/\\/g, "/");
  const match = normalized.match(/^(.*)\/app\/Providers\/?$/i);
  if (match && match[1]) {
    return match[1];
  }
  const baseMatch = normalized.match(/^(.*)\/app\/Providers\/OmnifyBase\/?$/i);
  if (baseMatch && baseMatch[1]) {
    return baseMatch[1];
  }
  return "";
}
function getExistingMigrationTables(migrationsDir) {
  const existingTables = /* @__PURE__ */ new Set();
  if (!(0, import_node_fs2.existsSync)(migrationsDir)) {
    return existingTables;
  }
  try {
    const files = (0, import_node_fs2.readdirSync)(migrationsDir);
    const createMigrationPattern = /^\d{4}_\d{2}_\d{2}_\d{6}_create_(.+)_table\.php$/;
    for (const file of files) {
      const match = file.match(createMigrationPattern);
      if (match) {
        existingTables.add(match[1]);
      }
    }
  } catch {
  }
  return existingTables;
}
function getMigrationsDirForSchema(schema, cwd, defaultMigrationsPath) {
  if (schema?.packageOutput?.laravel) {
    const pkg = schema.packageOutput.laravel;
    const migrationsPath = pkg.migrationsPath ?? "database/migrations";
    return (0, import_node_path2.join)(cwd, pkg.base, migrationsPath);
  }
  return (0, import_node_path2.join)(cwd, defaultMigrationsPath);
}
function buildExistingTablesMap(schemas, cwd, defaultMigrationsPath) {
  const tablesMap = /* @__PURE__ */ new Map();
  const checkedDirs = /* @__PURE__ */ new Set();
  const defaultDir = (0, import_node_path2.join)(cwd, defaultMigrationsPath);
  tablesMap.set(defaultDir, getExistingMigrationTables(defaultDir));
  checkedDirs.add(defaultDir);
  for (const schema of Object.values(schemas)) {
    if (schema.packageOutput?.laravel) {
      const pkg = schema.packageOutput.laravel;
      const migrationsPath = pkg.migrationsPath ?? "database/migrations";
      const pkgDir = (0, import_node_path2.join)(cwd, pkg.base, migrationsPath);
      if (!checkedDirs.has(pkgDir)) {
        tablesMap.set(pkgDir, getExistingMigrationTables(pkgDir));
        checkedDirs.add(pkgDir);
      }
    }
  }
  return tablesMap;
}
function tableHasMigration(tableName, schemaName, schemas, existingTablesMap, cwd, defaultMigrationsPath) {
  const schema = schemaName ? schemas[schemaName] : void 0;
  const migrationsDir = getMigrationsDirForSchema(schema, cwd, defaultMigrationsPath);
  const existingTables = existingTablesMap.get(migrationsDir);
  return existingTables?.has(tableName) ?? false;
}
var LARAVEL_CONFIG_SCHEMA = {
  fields: [
    {
      key: "base",
      type: "path",
      label: "Laravel Base Path",
      description: 'Base directory for Laravel project (e.g., "./backend/" for monorepo). All other paths are relative to this.',
      default: "",
      group: "output"
    },
    {
      key: "migrationsPath",
      type: "path",
      label: "Migrations Path",
      description: "Directory for Laravel migration files (relative to base)",
      default: "database/migrations/omnify",
      group: "output"
    },
    {
      key: "modelsPath",
      type: "path",
      label: "Models Path",
      description: "Directory for user-editable model files (relative to base)",
      default: "app/Models",
      group: "output"
    },
    {
      key: "baseModelsPath",
      type: "path",
      label: "Base Models Path",
      description: "Directory for auto-generated base model files",
      default: "app/Models/OmnifyBase",
      group: "output"
    },
    {
      key: "providersPath",
      type: "path",
      label: "Providers Path",
      description: "Directory for Laravel service provider files",
      default: "app/Providers",
      group: "output"
    },
    {
      key: "generateModels",
      type: "boolean",
      label: "Generate Models",
      description: "Generate Eloquent model classes",
      default: true,
      group: "options"
    },
    {
      key: "factoriesPath",
      type: "path",
      label: "Factories Path",
      description: "Directory for Laravel factory files",
      default: "database/factories",
      group: "output"
    },
    {
      key: "generateFactories",
      type: "boolean",
      label: "Generate Factories",
      description: "Generate Laravel factory classes for testing",
      default: true,
      group: "options"
    },
    {
      key: "connection",
      type: "string",
      label: "Database Connection",
      description: "Laravel database connection name (optional)",
      placeholder: "mysql",
      group: "options"
    },
    {
      key: "requestsPath",
      type: "path",
      label: "Requests Path",
      description: "Directory for user-editable FormRequest files",
      default: "app/Http/Requests",
      group: "output"
    },
    {
      key: "baseRequestsPath",
      type: "path",
      label: "Base Requests Path",
      description: "Directory for auto-generated base FormRequest files",
      default: "app/Http/Requests/OmnifyBase",
      group: "output"
    },
    {
      key: "generateRequests",
      type: "boolean",
      label: "Generate Requests",
      description: "Generate Laravel FormRequest classes for validation",
      default: false,
      group: "options"
    },
    {
      key: "resourcesPath",
      type: "path",
      label: "Resources Path",
      description: "Directory for user-editable API Resource files",
      default: "app/Http/Resources",
      group: "output"
    },
    {
      key: "baseResourcesPath",
      type: "path",
      label: "Base Resources Path",
      description: "Directory for auto-generated base API Resource files",
      default: "app/Http/Resources/OmnifyBase",
      group: "output"
    },
    {
      key: "generateResources",
      type: "boolean",
      label: "Generate Resources",
      description: "Generate Laravel API Resource classes",
      default: false,
      group: "options"
    }
  ]
};
function joinPath(base, relativePath) {
  if (!base) return relativePath;
  const normalizedBase = base.replace(/\/+$/, "");
  return `${normalizedBase}/${relativePath}`;
}
function resolveOptions5(options) {
  const base = options?.base ?? "";
  return {
    migrationsPath: options?.migrationsPath ?? joinPath(base, "database/migrations/omnify"),
    modelsPath: options?.modelsPath ?? joinPath(base, "app/Models"),
    baseModelsPath: options?.baseModelsPath ?? joinPath(base, "app/Models/OmnifyBase"),
    providersPath: options?.providersPath ?? joinPath(base, "app/Providers"),
    modelNamespace: options?.modelNamespace ?? "App\\Models",
    baseModelNamespace: options?.baseModelNamespace ?? "App\\Models\\OmnifyBase",
    generateModels: options?.generateModels ?? true,
    factoriesPath: options?.factoriesPath ?? joinPath(base, "database/factories"),
    generateFactories: options?.generateFactories ?? true,
    fakerLocale: options?.fakerLocale ?? "en_US",
    connection: options?.connection,
    timestamp: options?.timestamp,
    requestsPath: options?.requestsPath ?? joinPath(base, "app/Http/Requests"),
    baseRequestsPath: options?.baseRequestsPath ?? joinPath(base, "app/Http/Requests/OmnifyBase"),
    requestNamespace: options?.requestNamespace ?? "App\\Http\\Requests",
    baseRequestNamespace: options?.baseRequestNamespace ?? "App\\Http\\Requests\\OmnifyBase",
    generateRequests: options?.generateRequests ?? true,
    resourcesPath: options?.resourcesPath ?? joinPath(base, "app/Http/Resources"),
    baseResourcesPath: options?.baseResourcesPath ?? joinPath(base, "app/Http/Resources/OmnifyBase"),
    resourceNamespace: options?.resourceNamespace ?? "App\\Http\\Resources",
    baseResourceNamespace: options?.baseResourceNamespace ?? "App\\Http\\Resources\\OmnifyBase",
    generateResources: options?.generateResources ?? true
  };
}
function laravelPlugin(options) {
  const resolved = resolveOptions5(options);
  const migrationGenerator = {
    name: "laravel-migrations",
    description: "Generate Laravel migration files",
    generate: async (ctx) => {
      const migrationOptions = {
        connection: resolved.connection,
        timestamp: resolved.timestamp,
        customTypes: ctx.customTypes,
        pluginEnums: ctx.pluginEnums
      };
      const outputs = [];
      const existingTablesMap = buildExistingTablesMap(
        ctx.schemas,
        ctx.cwd,
        resolved.migrationsPath
      );
      const hasMigration = (tableName, schemaName) => tableHasMigration(
        tableName,
        schemaName,
        ctx.schemas,
        existingTablesMap,
        ctx.cwd,
        resolved.migrationsPath
      );
      if (ctx.changes !== void 0) {
        if (ctx.changes.length === 0) {
          return outputs;
        }
        const addedSchemaNames = new Set(
          ctx.changes.filter((c) => c.changeType === "added").map((c) => c.schemaName)
        );
        if (addedSchemaNames.size > 0) {
          const addedSchemas = Object.fromEntries(
            Object.entries(ctx.schemas).filter(([name]) => addedSchemaNames.has(name))
          );
          const createMigrations = generateMigrations(addedSchemas, migrationOptions);
          for (const migration of createMigrations) {
            const tableName = migration.tables[0];
            if (hasMigration(tableName, migration.schemaName)) {
              ctx.logger.debug(`Skipping CREATE for ${tableName} (already exists)`);
              continue;
            }
            outputs.push({
              path: getMigrationPathForSchema(migration, ctx.schemas, resolved.migrationsPath),
              content: migration.content,
              type: "migration",
              metadata: {
                tableName,
                migrationType: "create"
              }
            });
          }
        }
        const alterChanges = ctx.changes.filter(
          (c) => c.changeType === "modified" || c.changeType === "removed"
        );
        if (alterChanges.length > 0) {
          const alterMigrations = generateMigrationsFromChanges(
            alterChanges,
            migrationOptions
          );
          for (const migration of alterMigrations) {
            outputs.push({
              path: getMigrationPathForSchema(migration, ctx.schemas, resolved.migrationsPath),
              content: migration.content,
              type: "migration",
              metadata: {
                tableName: migration.tables[0],
                migrationType: migration.type
              }
            });
          }
        }
      } else {
        const migrations = generateMigrations(ctx.schemas, migrationOptions);
        for (const migration of migrations) {
          const tableName = migration.tables[0];
          if (migration.type === "create" && hasMigration(tableName, migration.schemaName)) {
            ctx.logger.debug(`Skipping migration for ${tableName} (already exists)`);
            continue;
          }
          outputs.push({
            path: getMigrationPathForSchema(migration, ctx.schemas, resolved.migrationsPath),
            content: migration.content,
            type: "migration",
            metadata: {
              tableName,
              migrationType: migration.type
            }
          });
        }
      }
      return outputs;
    }
  };
  const modelGenerator = {
    name: "laravel-models",
    description: "Generate Eloquent model classes",
    generate: async (ctx) => {
      const modelOptions = {
        modelNamespace: resolved.modelNamespace,
        baseModelNamespace: resolved.baseModelNamespace,
        modelPath: resolved.modelsPath,
        baseModelPath: resolved.baseModelsPath,
        providersPath: resolved.providersPath,
        customTypes: ctx.customTypes
      };
      const models = generateModels(ctx.schemas, modelOptions);
      const outputs = models.map((model) => ({
        path: getModelPath(model),
        content: model.content,
        type: "model",
        // Skip writing user models if they already exist
        skipIfExists: !model.overwrite,
        metadata: {
          modelType: model.type,
          schemaName: model.schemaName
        }
      }));
      const laravelRoot = inferLaravelRoot(resolved.providersPath);
      const bootstrapProvidersRelPath = laravelRoot ? `${laravelRoot}/bootstrap/providers.php` : "bootstrap/providers.php";
      const configAppRelPath = laravelRoot ? `${laravelRoot}/config/app.php` : "config/app.php";
      const bootstrapProvidersPath = (0, import_node_path2.join)(ctx.cwd, bootstrapProvidersRelPath);
      const configAppPath = (0, import_node_path2.join)(ctx.cwd, configAppRelPath);
      let existingContent = null;
      let laravelVersion;
      if ((0, import_node_fs2.existsSync)(bootstrapProvidersPath)) {
        laravelVersion = "laravel11+";
        try {
          existingContent = (0, import_node_fs2.readFileSync)(bootstrapProvidersPath, "utf-8");
        } catch {
          existingContent = null;
        }
      } else if ((0, import_node_fs2.existsSync)(configAppPath)) {
        try {
          const configContent = (0, import_node_fs2.readFileSync)(configAppPath, "utf-8");
          if (/'providers'\s*=>\s*\[/.test(configContent)) {
            laravelVersion = "laravel10-";
            existingContent = configContent;
          } else {
            laravelVersion = "laravel11+";
            existingContent = null;
          }
        } catch {
          laravelVersion = "laravel11+";
          existingContent = null;
        }
      } else {
        laravelVersion = "laravel11+";
        existingContent = null;
      }
      const registration = generateProviderRegistration(existingContent, laravelVersion, laravelRoot);
      if (registration && !registration.alreadyRegistered) {
        outputs.push({
          path: registration.path,
          content: registration.content,
          type: "other",
          skipIfExists: false,
          // We want to modify the file
          metadata: {
            registrationType: "provider-registration",
            laravelVersion: registration.laravelVersion
          }
        });
        ctx.logger.info(`OmnifyServiceProvider will be registered in ${registration.path}`);
      } else if (registration?.alreadyRegistered) {
        ctx.logger.info("OmnifyServiceProvider is already registered");
      }
      return outputs;
    }
  };
  const factoryGenerator = {
    name: "laravel-factories",
    description: "Generate Laravel factory classes for testing",
    generate: async (ctx) => {
      const factoryOptions = {
        modelNamespace: resolved.modelNamespace,
        factoryPath: resolved.factoriesPath,
        fakerLocale: resolved.fakerLocale,
        customTypes: ctx.customTypes,
        pluginEnums: ctx.pluginEnums
      };
      const factories = generateFactories(ctx.schemas, factoryOptions);
      return factories.map((factory) => ({
        path: getFactoryPath(factory),
        content: factory.content,
        type: "factory",
        // Skip writing factories if they already exist (allow customization)
        skipIfExists: !factory.overwrite,
        metadata: {
          factoryName: factory.name,
          schemaName: factory.schemaName
        }
      }));
    }
  };
  const requestGenerator = {
    name: "laravel-requests",
    description: "Generate Laravel FormRequest classes for validation",
    generate: async (ctx) => {
      const requestOptions = {
        requestNamespace: resolved.requestNamespace,
        baseRequestNamespace: resolved.baseRequestNamespace,
        requestPath: resolved.requestsPath,
        baseRequestPath: resolved.baseRequestsPath,
        modelNamespace: resolved.modelNamespace,
        customTypes: ctx.customTypes
      };
      const requests = generateRequests(ctx.schemas, requestOptions);
      return requests.map((request) => ({
        path: getRequestPath(request),
        content: request.content,
        type: "other",
        // Skip writing user requests if they already exist
        skipIfExists: !request.overwrite,
        metadata: {
          requestType: request.type,
          schemaName: request.schemaName,
          module: request.module
        }
      }));
    }
  };
  const resourceGenerator = {
    name: "laravel-resources",
    description: "Generate Laravel API Resource classes",
    generate: async (ctx) => {
      const resourceOptions = {
        resourceNamespace: resolved.resourceNamespace,
        baseResourceNamespace: resolved.baseResourceNamespace,
        resourcePath: resolved.resourcesPath,
        baseResourcePath: resolved.baseResourcesPath,
        customTypes: ctx.customTypes
      };
      const resources = generateResources(ctx.schemas, resourceOptions);
      return resources.map((resource) => ({
        path: getResourcePath(resource),
        content: resource.content,
        type: "other",
        // Skip writing user resources if they already exist
        skipIfExists: !resource.overwrite,
        metadata: {
          resourceType: resource.type,
          schemaName: resource.schemaName,
          module: resource.module
        }
      }));
    }
  };
  const aiGuidesGenerator = {
    name: "laravel-ai-guides",
    description: "Generate AI assistant guides (Claude, Cursor) for Laravel development",
    generate: async (ctx) => {
      const packagePaths = extractPackagePaths(ctx.schemas);
      const result = generateAIGuides(ctx.cwd, {
        modelsPath: resolved.modelsPath,
        migrationsPath: resolved.migrationsPath,
        laravelBasePath: "app",
        packagePaths
      });
      const claudeTotal = result.claudeGuides + result.claudeRules + result.claudeChecklists + result.claudeWorkflows + result.claudeAgents + result.claudeOmnify;
      const antigravityTotal = result.antigravityRules || 0;
      const antigravityInfo = antigravityTotal > 0 ? `, ${antigravityTotal} Antigravity rules` : "";
      ctx.logger.info(`Generated ${claudeTotal} Claude files, ${result.cursorRules} Cursor rules${antigravityInfo}`);
      return [];
    }
  };
  const generators = [migrationGenerator];
  if (resolved.generateModels) {
    generators.push(modelGenerator);
  }
  if (resolved.generateFactories) {
    generators.push(factoryGenerator);
  }
  if (resolved.generateRequests) {
    generators.push(requestGenerator);
  }
  if (resolved.generateResources) {
    generators.push(resourceGenerator);
  }
  generators.push(aiGuidesGenerator);
  return {
    name: "@famgia/omnify-laravel",
    version: "0.0.14",
    configSchema: LARAVEL_CONFIG_SCHEMA,
    generators
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  extractManyToManyRelations,
  extractMorphToManyRelations,
  formatColumnMethod,
  formatForeignKey,
  formatIndex,
  formatMigrationFile,
  generateAIGuides,
  generateAlterMigration,
  generateDropMigrationForTable,
  generateDropTableMigration,
  generateFactories,
  generateForeignKey,
  generateMigrationFromSchema,
  generateMigrations,
  generateMigrationsFromChanges,
  generateModels,
  generateMorphToManyPivotBlueprint,
  generatePivotTableBlueprint,
  generatePivotTableName,
  generatePrimaryKeyColumn,
  generateProviderRegistration,
  generateSoftDeleteColumn,
  generateTimestampColumns,
  getFactoryPath,
  getMigrationPath,
  getModelPath,
  laravelPlugin,
  propertyToColumnMethod,
  schemaToBlueprint,
  shouldGenerateAIGuides,
  toColumnName,
  toTableName
});
//# sourceMappingURL=index.cjs.map