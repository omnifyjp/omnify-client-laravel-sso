# DateTime Handling Guide (Frontend)

> **Related:** [README](./README.md) | [Service Pattern](./service-pattern.md) | [Laravel Integration](./laravel-integration.md)

## Golden Rule: "Store UTC, Display Local"

```
API Response (UTC) → Day.js → Display (Local Timezone)
User Input (Local) → Day.js → API Request (UTC)
```

---

## Setup

Day.js is already configured in this project. Import from `@/lib/dayjs`:

```typescript
import dayjs, { formatDateTime, toUTCString } from "@/lib/dayjs";
```

> **Rule:** Always import from `@/lib/dayjs`, never from `dayjs` directly.

---

## Usage Patterns

### Display UTC from API

```typescript
import dayjs, { formatDateTime, formatRelative } from "@/lib/dayjs";

// API returns: "2024-01-15T10:30:00Z" (UTC)
const createdAt = "2024-01-15T10:30:00Z";

// Using helper functions (recommended)
formatDateTime(createdAt);        // "2024/01/15 19:30"
formatRelative(createdAt);        // "3日前"

// Using dayjs directly
dayjs(createdAt).format("LL");    // "2024年1月15日" (localized)
```

### Send Local Input as UTC

```typescript
import dayjs, { toUTCString } from "@/lib/dayjs";

// User selects: 2024/01/15 19:30 (local time)
const localDate = dayjs("2024-01-15 19:30");

// Convert to UTC for API
const utcString = toUTCString(localDate);
// "2024-01-15T10:30:00.000Z"
```

### With Ant Design DatePicker

```typescript
import { DatePicker, Form } from "antd";
import dayjs, { toUTCString, fromUTCString } from "@/lib/dayjs";
import type { Dayjs } from "@/lib/dayjs";

function MyForm() {
  const handleSubmit = (values: { date: Dayjs }) => {
    api.post("/events", { date: toUTCString(values.date) });
  };

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item name="date">
        <DatePicker showTime />
      </Form.Item>
    </Form>
  );
}

// Display API date in DatePicker
<DatePicker defaultValue={fromUTCString(event.scheduled_at)} />
```

---

## Available Functions

| Function                       | Description           | Example Output               |
| ------------------------------ | --------------------- | ---------------------------- |
| `formatDate(utc)`              | Date only             | `"2024/01/15"`               |
| `formatDateTime(utc)`          | Date + time           | `"2024/01/15 19:30"`         |
| `formatDateLocalized(utc)`     | Localized date        | `"2024年1月15日"`            |
| `formatDateTimeLocalized(utc)` | Localized date + time | `"2024年1月15日 19:30"`      |
| `formatRelative(utc)`          | Relative time         | `"3日前"`                    |
| `toUTCString(dayjs)`           | Convert to UTC ISO    | `"2024-01-15T10:30:00.000Z"` |
| `fromUTCString(utc)`           | Parse to Dayjs        | `Dayjs object`               |
| `nowUTC()`                     | Current UTC time      | `Dayjs object`               |
| `isPast(utc)`                  | Check if past         | `true/false`                 |
| `isFuture(utc)`                | Check if future       | `true/false`                 |

---

## Anti-Patterns ❌

```typescript
// ❌ Import dayjs directly
import dayjs from "dayjs";

// ❌ Use native Date
new Date("2024-01-15");

// ❌ Send local date string to API
api.post({ date: "2024/01/15 19:30" });

// ❌ Use moment.js
import moment from "moment";
```

## Correct Patterns ✅

```typescript
// ✅ Import from lib
import dayjs, { formatDateTime, toUTCString } from "@/lib/dayjs";

// ✅ Use helper functions
formatDateTime(user.created_at);

// ✅ Send UTC to API
api.post({ date: toUTCString(localDate) });
```

---

## Checklist

- [ ] Import from `@/lib/dayjs`, not `dayjs`
- [ ] Use helper functions for display
- [ ] Use `toUTCString()` when sending to API
- [ ] Use `fromUTCString()` for form default values
