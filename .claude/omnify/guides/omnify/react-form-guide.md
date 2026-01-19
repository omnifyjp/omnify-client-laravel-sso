# Omnify React Form Guide

This guide explains how to build forms using Omnify generated schemas with **Ant Design** and **TanStack Query**.

## Setup

Install the runtime package:

```bash
npm install @famgia/omnify-react
```

```typescript
// omnify.config.ts
import typescriptPlugin from '@famgia/omnify-typescript/plugin';

export default defineConfig({
  plugins: [
    typescriptPlugin({
      modelsPath: 'node_modules/.omnify/schemas',
    }),
  ],
});
```

## Quick Start

```tsx
import { Form, Button } from 'antd';
import {
  useFormMutation,
  JapaneseNameField,
  setZodLocale,
  zodRule,
} from '@famgia/omnify-react';
import { customerSchemas, customerI18n, type CustomerCreate } from './.omnify/schemas';
import { api } from '@/lib/api';

function CreateCustomerPage() {
  const [form] = Form.useForm<CustomerCreate>();
  setZodLocale('ja');

  const mutation = useFormMutation<CustomerCreate>({
    form,
    mutationFn: (data) => api.post('/customers', data),
    invalidateKeys: [['customers']],
    successMessage: 'Customer created successfully',
    onSuccess: () => form.resetFields(),
  });

  return (
    <Form form={form} onFinish={mutation.mutate}>
      <JapaneseNameField
        schemas={customerSchemas}
        i18n={customerI18n}
        prefix="name"
        showKana
      />
      <Button loading={mutation.isPending}>Save</Button>
    </Form>
  );
}
```

## useFormMutation Hook

```tsx
import { useFormMutation } from '@famgia/omnify-react';

const mutation = useFormMutation<CustomerCreate>({
  form,
  mutationFn: (data) => api.post('/customers', data),
  invalidateKeys: [['customers']],
  successMessage: 'Saved successfully',
  onSuccess: () => form.resetFields(),
});
```

### Options

| Option           | Type                   | Description                         |
| ---------------- | ---------------------- | ----------------------------------- |
| `form`           | `FormInstance<T>`      | Ant Design form instance (required) |
| `mutationFn`     | `(data: T) => Promise` | API call function (required)        |
| `invalidateKeys` | `string[][]`           | Query keys to invalidate on success |
| `successMessage` | `string`               | Toast message on success            |
| `onSuccess`      | `(data) => void`       | Callback after success              |
| `onError`        | `(error) => void`      | Callback after error                |

### Laravel Error Handling

The hook automatically handles Laravel validation errors (422):

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

## Japanese Form Components

### JapaneseNameField

```tsx
import { JapaneseNameField } from '@famgia/omnify-react';

<JapaneseNameField
  schemas={customerSchemas}
  i18n={customerI18n}
  prefix="name"        // name_lastname, name_firstname, etc.
  required             // Show required asterisk
  showKana={true}      // Show kana fields (default)
/>
```

**Fields:** `{prefix}_lastname`, `{prefix}_firstname`, `{prefix}_kana_lastname`, `{prefix}_kana_firstname`

### JapaneseAddressField

```tsx
import { JapaneseAddressField } from '@famgia/omnify-react';

<JapaneseAddressField
  form={form}
  schemas={customerSchemas}
  i18n={customerI18n}
  prefix="address"
  prefectureOptions={prefectureOptions} // Required for Select
  enablePostalLookup={true}  // Postal code → address lookup
/>
```

**Fields:** `{prefix}_postal_code`, `{prefix}_prefecture`, `{prefix}_address1`, `{prefix}_address2`, `{prefix}_address3`

**Options:**
- `prefectureOptions` - Select options for prefecture dropdown
- `enablePostalLookup` - Enable postal code search
- `autoSearch` - Auto-search when 7 digits entered
- `usePrefectureId` - Use numeric ID instead of string enum

### JapaneseBankField

```tsx
import { JapaneseBankField } from '@famgia/omnify-react';

<JapaneseBankField
  schemas={customerSchemas}
  i18n={customerI18n}
  prefix="bank"
  accountTypeOptions={accountTypeOptions} // Required for Select
/>
```

**Fields:** `{prefix}_bank_code`, `{prefix}_branch_code`, `{prefix}_account_type`, `{prefix}_account_number`, `{prefix}_account_holder`

## Zod Validation with i18n

```tsx
import { zodRule, setZodLocale } from '@famgia/omnify-react';

// Set locale once at component level
setZodLocale('ja');

// Use zodRule for field validation
<Form.Item
  name="email"
  label="メールアドレス"
  rules={[zodRule(customerSchemas.email, 'メールアドレス')]}
>
  <Input />
</Form.Item>
```

## Kana Validation Rules

```tsx
import { kanaString, KATAKANA_PATTERN } from '@famgia/omnify-react';

// Full-width katakana (default)
const kanaSchema = kanaString();

// Custom options
const kanaSchema = kanaString({
  fullWidthKatakana: true,
  hiragana: true,
  allowNumbers: true,
});
```

### Kana Presets

| Preset                  | Description            |
| ----------------------- | ---------------------- |
| `KATAKANA_FULL_WIDTH`   | 全角カタカナ (default) |
| `KATAKANA_HALF_WIDTH`   | 半角カタカナ           |
| `HIRAGANA`              | ひらがな               |
| `KANA_ANY`              | All kana types         |
| `KATAKANA_WITH_NUMBERS` | カタカナ + numbers     |

## File Structure

```
node_modules/
├── @famgia/omnify-react/    # Runtime package (npm)
│   ├── components/          # JapaneseNameField, etc.
│   ├── hooks/               # useFormMutation
│   └── lib/                 # zodRule, kanaString, etc.
└── .omnify/                 # Generated (regeneratable)
    ├── schemas/
    │   ├── Customer.ts
    │   └── Post.ts
    └── enum/
        └── PostStatus.ts
```

## Tips

1. **Use type generics** - `useFormMutation<CustomerCreate>` for type safety
2. **Use `setZodLocale`** - Call once for localized validation messages
3. **Use Japanese components** - Built-in i18n, validation, postal lookup
4. **Set `invalidateKeys`** - Auto-refresh lists after mutations
5. **Provide options for Select** - Components need `prefectureOptions` or `accountTypeOptions`
