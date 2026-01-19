---
id: antd-deprecations
description: "Ant Design deprecated props - check version before applying! v5.x and v6.x have different APIs"
priority: high
globs:
  - "resources/ts/**/*.tsx"
  - "resources/ts/**/*.ts"
tags:
  - react
  - antd
  - deprecations
---

# Ant Design Deprecations

## ⚠️ Check Your Version First!

```bash
# Check package.json for antd version
grep '"antd"' package.json
```

- **Ant Design 5.x**: Use `valueStyle`, `bodyStyle`, `headStyle`, `visible`
- **Ant Design 6.x**: Use `styles={{ ... }}`, `open` (semantic DOM API)

## Ant Design 5.x (Still Valid)

```typescript
// ✅ CORRECT for Ant Design 5.x
<Statistic value={100} valueStyle={{ color: 'green' }} />
<Card bodyStyle={{ padding: 0 }} headStyle={{ background: '#f5f5f5' }}>
<Modal visible={isOpen}>
```

## Ant Design 6.x (Semantic DOM API)

```typescript
// ✅ CORRECT for Ant Design 6.x ONLY
<Statistic value={100} styles={{ content: { color: 'green' } }} />
<Card styles={{ body: { padding: 0 }, header: { background: '#f5f5f5' } }}>
<Modal open={isOpen}>
```

## Deprecated in Both Versions

| Component    | ❌ Deprecated               | ✅ Use Instead           |
| ------------ | -------------------------- | ----------------------- |
| Divider      | `orientation`              | `titlePlacement`        |
| Modal/Drawer | `visible`                  | `open` (v5.0.0+)        |
| Select       | `dropdownMatchSelectWidth` | `popupMatchSelectWidth` |
| DatePicker   | `dropdownClassName`        | `popupClassName`        |

### Semantic Keys by Component

| Component | Keys                                                     |
| --------- | -------------------------------------------------------- |
| Statistic | `root`, `header`, `title`, `prefix`, `content`, `suffix` |
| Card      | `root`, `header`, `title`, `extra`, `body`, `actions`    |
| Modal     | `root`, `header`, `title`, `body`, `footer`, `mask`      |
| Drawer    | `root`, `header`, `title`, `body`, `footer`, `mask`      |

### Pattern

```typescript
<Component
  styles={{ [semanticKey]: { /* CSSProperties */ } }}
  classNames={{ [semanticKey]: 'my-class' }}
/>
```