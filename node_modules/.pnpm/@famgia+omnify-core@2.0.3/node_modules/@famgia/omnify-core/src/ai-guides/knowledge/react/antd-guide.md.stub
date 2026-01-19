# Ant Design Guide

> **Related:** [README](./README.md) | [i18n](./i18n-guide.md)

## ⚠️ IMPORTANT: Use Ant Design First

**ALWAYS check if Ant Design has a component before creating your own.**

Ant Design provides 60+ components: https://ant.design/components/overview

```typescript
// ✅ DO: Use Ant Design components
import { Table, Form, Input, Button, Modal, Card, Descriptions } from "antd";

// ❌ DON'T: Create custom components that Ant Design already has
// DON'T create: CustomTable, CustomModal, CustomForm, CustomButton
// DON'T create: DataGrid, Popup, FormInput

// ✅ DO: Extend Ant Design if needed
function UserTable(props: { users: User[] }) {
  return <Table dataSource={props.users} columns={...} />; // Wraps AntD Table
}

// ❌ DON'T: Build from scratch
function UserTable(props: { users: User[] }) {
  return <table><tbody>{users.map(...)}</tbody></table>; // WRONG!
}
```

---

## ⚠️ No New Libraries Without Permission

**DO NOT install new npm packages without explicit user approval.**

```bash
# ❌ DON'T: Install without asking
npm install lodash
npm install moment
npm install react-table

# ✅ DO: Ask first
"Do you want to install library X for Y?"
```

**Already installed libraries (use these):**
- UI: `antd`, `@ant-design/icons`
- HTTP: `axios`
- State: `@tanstack/react-query`
- Styling: `tailwindcss`
- i18n: `next-intl`

---

## When to Create a Component

| Create Component                | Don't Create                  |
| ------------------------------- | ----------------------------- |
| Used in 2+ places               | Used only once                |
| Has own state/logic (>50 lines) | Simple markup (<30 lines)     |
| Needs unit testing              | Trivial display               |
| Complex props interface         | Few inline props              |
| **Ant Design doesn't have it**  | **Ant Design already has it** |

---

## Container vs Presentational

```typescript
// ============================================================================
// CONTAINER COMPONENT (Smart) - pages or complex components
// - Fetches data
// - Handles mutations
// - Contains business logic
// ============================================================================

// app/(dashboard)/users/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userService, UserListParams } from "@/services/users";
import { queryKeys } from "@/lib/queryKeys";
import { UserTable } from "@/components/tables/UserTable";

export default function UsersPage() {
  const [filters, setFilters] = useState<UserListParams>({ page: 1 });
  
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userService.list(filters),
  });

  return (
    <UserTable 
      users={data?.data ?? []}
      loading={isLoading}
      pagination={data?.meta}
      onPageChange={(page) => setFilters({ ...filters, page })}
    />
  );
}

// ============================================================================
// PRESENTATIONAL COMPONENT (Dumb) - reusable UI
// - Receives data via props
// - No data fetching
// - No business logic
// ============================================================================

// components/tables/UserTable.tsx
import { Table } from "antd";
import type { User } from "@omnify/schemas";
import type { PaginatedResponse } from "@/lib/api";

interface UserTableProps {
  users: User[];
  loading: boolean;
  pagination?: PaginatedResponse<User>["meta"];
  onPageChange: (page: number) => void;
}

export function UserTable({ users, loading, pagination, onPageChange }: UserTableProps) {
  return (
    <Table
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination?.current_page,
        total: pagination?.total,
        onChange: onPageChange,
      }}
      columns={[
        { title: "ID", dataIndex: "id" },
        { title: "Name", dataIndex: "name" },
        { title: "Email", dataIndex: "email" },
      ]}
    />
  );
}
```

---

## Form Pattern with Laravel Validation

```typescript
"use client";

import { Form, Input, Button, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getFormErrors } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/users";

export default function UserForm() {
  const t = useTranslations();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      message.success(t("messages.created"));
      form.resetFields();
    },
    onError: (error) => {
      // This maps Laravel's 422 { errors: { email: ["Already exists"] } }
      // to Ant Design's form.setFields format
      form.setFields(getFormErrors(error));
    },
  });

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => mutation.mutate(values)}
    >
      <Form.Item
        name="name"
        label={t("common.name")}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label={t("auth.email")}
        rules={[{ required: true }, { type: "email" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={mutation.isPending}
        >
          {t("common.save")}
        </Button>
      </Form.Item>
    </Form>
  );
}
```

---

## ⚠️ Ant Design Breaking Changes & Deprecated Props

> **IMPORTANT**: Check your `package.json` to determine which Ant Design version you're using:
> - **Ant Design 5.x**: Use `visible`, `valueStyle`, `bodyStyle`, `headStyle` (deprecated but still work)
> - **Ant Design 6.x**: Use `open`, `styles={{ ... }}` (semantic DOM API)

### Deprecated Props Reference Table

| Component               | ❌ Deprecated (v6+)         | ✅ Use Instead (v6+)        | Notes                                  |
| ----------------------- | -------------------------- | -------------------------- | -------------------------------------- |
| **Statistic**           | `valueStyle`               | `styles={{ content: {} }}` | ⚠️ v6.0.0+ only! Use `valueStyle` in v5 |
| **Card**                | `bodyStyle`                | `styles={{ body: {} }}`    | ⚠️ v6.0.0+ only! Use `bodyStyle` in v5  |
| **Card**                | `headStyle`                | `styles={{ header: {} }}`  | ⚠️ v6.0.0+ only! Use `headStyle` in v5  |
| **Divider**             | `orientation`              | `titlePlacement`           | `orientation` is for direction only    |
| Modal                   | `visible`                  | `open`                     | v5.0.0+                                |
| Drawer                  | `visible`                  | `open`                     | v5.0.0+                                |
| Dropdown                | `visible`                  | `open`                     | v5.0.0+                                |
| Tooltip                 | `visible`                  | `open`                     | v5.0.0+                                |
| Popover                 | `visible`                  | `open`                     | v5.0.0+                                |
| Popconfirm              | `visible`                  | `open`                     | v5.0.0+                                |
| Select                  | `dropdownMatchSelectWidth` | `popupMatchSelectWidth`    | v5.0.0+                                |
| TreeSelect              | `dropdownMatchSelectWidth` | `popupMatchSelectWidth`    | v5.0.0+                                |
| Cascader                | `dropdownMatchSelectWidth` | `popupMatchSelectWidth`    | v5.0.0+                                |
| AutoComplete            | `dropdownMatchSelectWidth` | `popupMatchSelectWidth`    | v5.0.0+                                |
| Table                   | `filterDropdownVisible`    | `filterDropdownOpen`       | v5.0.0+                                |
| DatePicker              | `dropdownClassName`        | `popupClassName`           | v5.0.0+                                |
| TimePicker              | `dropdownClassName`        | `popupClassName`           | v5.0.0+                                |
| Mentions                | `dropdownClassName`        | `popupClassName`           | v5.0.0+                                |
| Tag                     | `closable`                 | `closeIcon={false}`        | Use `closeIcon={false}` to hide        |
| **List**                | (component)                | Use `Table` or custom      | DEPRECATED in v6.0.0                   |
| **Statistic.Countdown** | (component)                | `Statistic.Timer`          | Use `Statistic.Timer` (v5.25.0+)       |

```typescript
// ❌ DON'T: Use deprecated props (causes console warnings)
<Statistic value={100} valueStyle={{ color: 'green' }} />
<Card bodyStyle={{ padding: 0 }} headStyle={{ background: '#f5f5f5' }}>
<Divider orientation="left">Title</Divider>
<Modal visible={isOpen}>

// ✅ DO: Use new props (Ant Design 6+)
<Statistic value={100} styles={{ content: { color: 'green' } }} />
<Card styles={{ body: { padding: 0 }, header: { background: '#f5f5f5' } }}>
<Divider titlePlacement="left">Title</Divider>
<Modal open={isOpen}>
```

---

## 🎨 Ant Design 6.0 Semantic DOM API (NEW!)

**Version 6.0.0** introduced a new **Semantic DOM** pattern for styling. Instead of single style props, use `styles` and `classNames` objects:

### Statistic - Semantic Structure

```typescript
// Semantic keys: root, header, title, prefix, content, suffix

// ❌ OLD (deprecated in v6)
<Statistic
  value={112893}
  valueStyle={{ color: token.colorSuccess }}
  prefix={<ArrowUpOutlined />}
/>

// ✅ NEW (v6.0.0+)
<Statistic
  value={112893}
  styles={{ 
    content: { color: token.colorSuccess },
    prefix: { marginRight: 8 },
  }}
  classNames={{
    root: 'my-statistic',
    content: 'my-statistic-value',
  }}
  prefix={<ArrowUpOutlined />}
/>
```

### Card - Semantic Structure

```typescript
// Semantic keys: root, header, title, extra, body, actions, cover

// ❌ OLD (deprecated)
<Card bodyStyle={{ padding: 0 }} headStyle={{ background: '#fafafa' }}>

// ✅ NEW (v6.0.0+)
<Card styles={{ body: { padding: 0 }, header: { background: '#fafafa' } }}>
```

### Common Components with Semantic DOM (v6.0.0+)

| Component    | Semantic Keys                                                 |
| ------------ | ------------------------------------------------------------- |
| Statistic    | `root`, `header`, `title`, `prefix`, `content`, `suffix`      |
| Card         | `root`, `header`, `title`, `extra`, `body`, `actions`         |
| Modal        | `root`, `header`, `title`, `body`, `footer`, `mask`           |
| Drawer       | `root`, `header`, `title`, `body`, `footer`, `mask`           |
| Table        | `root`, `header`, `body`, `footer`, `cell`                    |
| Form         | `root`, `item`, `label`, `input`, `feedback`                  |
| Descriptions | `root`, `header`, `title`, `body`, `item`, `label`, `content` |

```typescript
// General pattern for semantic styling
<Component
  styles={{ [semanticKey]: { /* CSSProperties */ } }}
  classNames={{ [semanticKey]: 'my-class' }}
/>
```

---

## 🚨 Common Ant Design 6+ Mistakes

### 1. Divider - `orientation` vs `titlePlacement`

```typescript
// ❌ WRONG: This will show a deprecation warning!
<Divider orientation="left">Section Title</Divider>
// Warning: [antd: Divider] `orientation` is used for direction, please use `titlePlacement` replace this

// ✅ CORRECT: Use titlePlacement for title position
<Divider titlePlacement="left">Section Title</Divider>
<Divider titlePlacement="center">Section Title</Divider>
<Divider titlePlacement="right">Section Title</Divider>

// For horizontal/vertical dividers, use `type`:
<Divider type="horizontal" />  // default
<Divider type="vertical" />
```

### 2. Modal/Drawer - `visible` vs `open`

```typescript
// ❌ WRONG
const [visible, setVisible] = useState(false);
<Modal visible={visible} onCancel={() => setVisible(false)}>

// ✅ CORRECT
const [open, setOpen] = useState(false);
<Modal open={open} onCancel={() => setOpen(false)}>
```

### 3. Form.Item - `dependencies` must be array

```typescript
// ❌ WRONG: dependencies as string
<Form.Item dependencies="password">

// ✅ CORRECT: dependencies as array
<Form.Item dependencies={['password']}>
```

### 4. Table - Column `render` function signature

```typescript
// ❌ WRONG: Using wrong parameter order
columns={[{
  render: (record, text) => <span>{text}</span>  // WRONG ORDER!
}]}

// ✅ CORRECT: (text, record, index)
columns={[{
  render: (text, record, index) => <span>{text}</span>
}]}
```

### 5. Select/TreeSelect - Option rendering

```typescript
// ❌ WRONG: Using children in v6+
<Select>
  <Select.Option value="1">Option 1</Select.Option>
</Select>

// ✅ PREFERRED: Use options prop (better performance)
<Select options={[
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
]} />
```

### 6. DatePicker - Dayjs instead of Moment

```typescript
// ❌ WRONG: Ant Design 6+ uses dayjs, not moment
import moment from 'moment';
<DatePicker value={moment(date)} />

// ✅ CORRECT: Use dayjs
import dayjs from 'dayjs';
<DatePicker value={dayjs(date)} />
```

### 7. ConfigProvider - Theme customization

```typescript
// ❌ WRONG: Old less variable approach
@primary-color: #1890ff;

// ✅ CORRECT: Use ConfigProvider theme token
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
  }}
>
  <App />
</ConfigProvider>
```

### 8. App Component - message/notification/modal

```typescript
// ❌ WRONG: Direct import (won't respect ConfigProvider)
import { message } from 'antd';
message.success('Done!');

// ✅ CORRECT: Use App.useApp() hook
import { App } from 'antd';

function MyComponent() {
  const { message, notification, modal } = App.useApp();
  
  const handleClick = () => {
    message.success('Done!');  // Respects ConfigProvider theme
  };
}

// Wrap your app with App component
<ConfigProvider theme={...}>
  <App>
    <YourApp />
  </App>
</ConfigProvider>
```

### 9. Icons - Named imports required

```typescript
// ❌ WRONG: Default import
import Icon from '@ant-design/icons';
<Icon type="user" />

// ✅ CORRECT: Named imports
import { UserOutlined, EditOutlined } from '@ant-design/icons';
<UserOutlined />
<EditOutlined />
```

### 10. Grid - `xs`, `sm`, etc. as objects

```typescript
// ❌ CAREFUL: Mixing number and object syntax
<Col xs={24} sm={{ span: 12, offset: 6 }}>

// ✅ PREFERRED: Be consistent
<Col xs={{ span: 24 }} sm={{ span: 12, offset: 6 }}>
// OR
<Col xs={24} sm={12}>
```

---

## Anti-Patterns

```typescript
// ❌ Creating components that Ant Design already has
function CustomButton({ children }) { ... }  // Use <Button> from antd
function CustomModal({ visible }) { ... }    // Use <Modal> from antd
function CustomTable({ data }) { ... }       // Use <Table> from antd
function DataGrid({ rows }) { ... }          // Use <Table> from antd

// ❌ Installing libraries without permission
npm install lodash          // Ask first!
npm install react-icons     // Use @ant-design/icons
npm install styled-components // Use Tailwind CSS

// ❌ API call in component (bypass service layer)
function UserList() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get("/api/users"), // WRONG: Use service
  });
}

// ❌ Business logic in component
function UserList() {
  const users = data?.filter(u => u.active).sort((a, b) => a.name > b.name);
  // Move to service or utility function
}

// ❌ Hardcoded strings - use i18n
<Button>Save</Button>         // WRONG
<Button>{t("common.save")}</Button>  // CORRECT

// ❌ Multiple sources of truth
const [users, setUsers] = useState([]); // Local state
const { data } = useQuery({ ... });     // Server state
// Pick one: TanStack Query for server data

// ❌ Prop drilling
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data} /> // Use Context or pass minimal props
  </Child>
</Parent>

// ❌ Giant components (>200 lines)
// Split into smaller components or extract hooks
```
