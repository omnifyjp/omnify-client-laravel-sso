# Omnify + Ant Design Integration Guide

This guide shows how to use Omnify-generated validation rules with Ant Design Forms.

## Generated Files

Omnify generates validation rules in `rules/` directory:
- `rules/{Model}.rules.ts` - Validation rules for each model

## File Structure

```typescript
// rules/User.rules.ts

// Display name for model (multi-locale)
export const UserDisplayName: LocaleMap = {
  ja: 'ユーザー',
  en: 'User',
};

// Display names for properties (multi-locale)
export const UserPropertyDisplayNames: Record<string, LocaleMap> = {
  name: { ja: '名前', en: 'Name' },
  email: { ja: 'メールアドレス', en: 'Email' },
};

// Validation rules with multi-locale messages
export const UserRules: Record<string, ValidationRule[]> = {
  name: [
    { required: true, message: { ja: '名前は必須です', en: 'Name is required' } },
    { max: 100, message: { ja: '名前は100文字以内で入力してください', en: 'Name must be at most 100 characters' } },
  ],
  email: [
    { required: true, message: { ja: 'メールアドレスは必須です', en: 'Email is required' } },
    { type: 'email', message: { ja: 'メールアドレスの形式が正しくありません', en: 'Email is not a valid email address' } },
  ],
};

// Helper functions
export function userSchemas(locale: string): Record<string, Rule[]>;
export function getUserLabel(locale: string): string;
export function getUserFieldLabel(property: string, locale: string): string;
```

## Basic Usage

```tsx
import { Form, Input, Button } from 'antd';
import {
  userSchemas,
  getUserLabel,
  getUserFieldLabel
} from '@omnify/schemas/User';

interface UserFormProps {
  locale?: string;
  onSubmit: (values: User) => void;
}

export function UserForm({ locale = 'ja', onSubmit }: UserFormProps) {
  const [form] = Form.useForm();
  const rules = userSchemas(locale);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
    >
      <Form.Item
        name="name"
        label={getUserFieldLabel('name', locale)}
        rules={rules.name}
      >
        <Input placeholder={getUserFieldLabel('name', locale)} />
      </Form.Item>

      <Form.Item
        name="email"
        label={getUserFieldLabel('email', locale)}
        rules={rules.email}
      >
        <Input type="email" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          {locale === 'ja' ? '送信' : 'Submit'}
        </Button>
      </Form.Item>
    </Form>
  );
}
```

## With Edit Mode (Initial Values)

```tsx
import { Form, Input, Button, Spin } from 'antd';
import { userSchemas, getUserFieldLabel } from '@omnify/schemas/User';
import { User } from '@omnify/schemas';

interface UserEditFormProps {
  user: User;
  locale?: string;
  onSubmit: (values: Partial<User>) => void;
  loading?: boolean;
}

export function UserEditForm({ user, locale = 'ja', onSubmit, loading }: UserEditFormProps) {
  const [form] = Form.useForm();
  const rules = userSchemas(locale);

  // Set initial values when user data changes
  React.useEffect(() => {
    form.setFieldsValue(user);
  }, [user, form]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={user}
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label={getUserFieldLabel('name', locale)}
          rules={rules.name}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={getUserFieldLabel('email', locale)}
          rules={rules.email}
        >
          <Input type="email" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {locale === 'ja' ? '更新' : 'Update'}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
```

## Dynamic Locale Switching

```tsx
import { Form, Input, Select } from 'antd';
import { useState, useMemo } from 'react';
import { userSchemas, getUserFieldLabel, getUserLabel } from '@omnify/schemas/User';

export function UserFormWithLocale() {
  const [locale, setLocale] = useState('ja');
  const [form] = Form.useForm();

  // Memoize rules to avoid recalculation
  const rules = useMemo(() => userSchemas(locale), [locale]);

  return (
    <>
      <Select value={locale} onChange={setLocale} style={{ marginBottom: 16 }}>
        <Select.Option value="ja">日本語</Select.Option>
        <Select.Option value="en">English</Select.Option>
        <Select.Option value="vi">Tiếng Việt</Select.Option>
      </Select>

      <h2>{getUserLabel(locale)}</h2>

      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={getUserFieldLabel('name', locale)}
          rules={rules.name}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={getUserFieldLabel('email', locale)}
          rules={rules.email}
        >
          <Input type="email" />
        </Form.Item>
      </Form>
    </>
  );
}
```

## With Table Columns

```tsx
import { Table, TableColumnsType } from 'antd';
import { getUserFieldLabel } from '@omnify/schemas/User';
import { User } from '@omnify/schemas';

interface UserTableProps {
  users: User[];
  locale?: string;
  loading?: boolean;
}

export function UserTable({ users, locale = 'ja', loading }: UserTableProps) {
  const columns: TableColumnsType<User> = [
    {
      title: getUserFieldLabel('name', locale),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: getUserFieldLabel('email', locale),
      dataIndex: 'email',
      key: 'email',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey="id"
      loading={loading}
    />
  );
}
```

## Custom Form Hook

```tsx
import { Form, FormInstance } from 'antd';
import { useMemo } from 'react';

// Generic hook for any model's rules
export function useModelForm<T>(
  getRules: (locale: string) => Record<string, any[]>,
  locale: string = 'ja'
): {
  form: FormInstance<T>;
  rules: Record<string, any[]>;
} {
  const [form] = Form.useForm<T>();
  const rules = useMemo(() => getRules(locale), [getRules, locale]);

  return { form, rules };
}

// Usage
import { userSchemas } from '@omnify/schemas/User';

function MyComponent() {
  const { form, rules } = useModelForm(userSchemas, 'ja');

  return (
    <Form form={form}>
      <Form.Item name="name" rules={rules.name}>
        <Input />
      </Form.Item>
    </Form>
  );
}
```

## Modal Form

```tsx
import { Modal, Form, Input, message } from 'antd';
import { userSchemas, getUserLabel, getUserFieldLabel } from '@omnify/schemas/User';
import { User } from '@omnify/schemas';

interface UserModalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<User>) => Promise<void>;
  initialValues?: Partial<User>;
  locale?: string;
}

export function UserModalForm({
  open,
  onClose,
  onSubmit,
  initialValues,
  locale = 'ja'
}: UserModalFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const rules = userSchemas(locale);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      message.success(locale === 'ja' ? '保存しました' : 'Saved successfully');
      form.resetFields();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={getUserLabel(locale)}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={locale === 'ja' ? '保存' : 'Save'}
      cancelText={locale === 'ja' ? 'キャンセル' : 'Cancel'}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          name="name"
          label={getUserFieldLabel('name', locale)}
          rules={rules.name}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={getUserFieldLabel('email', locale)}
          rules={rules.email}
        >
          <Input type="email" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

## Validation Rule Types

Omnify generates these rule types based on schema:

| Schema | Generated Rule |
|--------|---------------|
| `required: true` | `{ required: true, message: {...} }` |
| `type: Email` | `{ type: 'email', message: {...} }` |
| `maxLength: N` | `{ max: N, message: {...} }` |
| `minLength: N` | `{ min: N, message: {...} }` |
| `max: N` (numeric) | `{ max: N, type: 'number', message: {...} }` |
| `min: N` (numeric) | `{ min: N, type: 'number', message: {...} }` |
| `pattern: regex` | `{ pattern: /regex/, message: {...} }` |

## Built-in Validation Messages

Omnify includes templates for 5 languages:
- Japanese (ja)
- English (en)
- Vietnamese (vi)
- Korean (ko)
- Chinese (zh)

Custom templates can be configured in `omnify.config.ts`:

```typescript
export default defineConfig({
  output: {
    typescript: {
      validationTemplates: {
        required: {
          ja: '${displayName}を入力してください',
          en: '${displayName} is required',
          vi: '${displayName} là bắt buộc',
        },
        maxLength: {
          ja: '${displayName}は${max}文字以内です',
          en: '${displayName} must be at most ${max} characters',
        },
      },
    },
  },
});
```

Available placeholders:
- `${displayName}` - Property display name
- `${min}` - Minimum value/length
- `${max}` - Maximum value/length
