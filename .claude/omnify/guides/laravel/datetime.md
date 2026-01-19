# DateTime Handling Guide

> **Related:** [README](./README.md) | [Resource Guide](./resource-guide.md)

## Golden Rule: "Store UTC, Respond UTC, Accept UTC"

```
Database (UTC) ← Carbon (UTC) → API Response (ISO 8601 UTC)
                     ↑
              API Request (UTC)
```

---

## Configuration

### 1. Set Application Timezone to UTC

**`config/app.php`:**

```php
'timezone' => 'UTC',
```

> ⚠️ NEVER change this to local timezone. Always use UTC.

### 2. Database Timezone

**MySQL** - Ensure UTC:

```sql
SET GLOBAL time_zone = '+00:00';
SET time_zone = '+00:00';
```

Or in `my.cnf`:
```ini
[mysqld]
default-time-zone = '+00:00'
```

---

## Carbon Usage Rules

### Always Use Carbon (Never raw DateTime)

```php
use Illuminate\Support\Carbon;

// ✅ Correct
$now = Carbon::now();           // Current UTC time
$date = Carbon::parse($input);  // Parse with UTC

// ❌ Wrong
$now = new \DateTime();         // Don't use raw DateTime
$now = date('Y-m-d H:i:s');     // Don't use date()
```

### API Response Format

**Always return ISO 8601 with Z suffix:**

```php
// In Model - cast dates properly
protected $casts = [
    'email_verified_at' => 'datetime',
    'scheduled_at' => 'datetime',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];

// In Resource - format as ISO 8601 UTC
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'scheduled_at' => $this->scheduled_at?->toISOString(),  // "2024-01-15T10:30:00.000000Z"
        'created_at' => $this->created_at?->toISOString(),
        'updated_at' => $this->updated_at?->toISOString(),
    ];
}
```

### Accepting Date Input

```php
// In FormRequest
public function rules(): array
{
    return [
        'scheduled_at' => ['required', 'date'],  // Accepts ISO 8601
    ];
}

// In Controller - Carbon auto-parses UTC
public function store(StoreEventRequest $request): JsonResponse
{
    $event = Event::create([
        'title' => $request->title,
        'scheduled_at' => Carbon::parse($request->scheduled_at),  // Already UTC
    ]);

    return new EventResource($event);
}
```

---

## Common Patterns

### Compare Dates

```php
use Illuminate\Support\Carbon;

// Current UTC time
$now = Carbon::now();

// Check if past
if ($event->scheduled_at->isPast()) {
    // Event has passed
}

// Check if within range
$start = Carbon::parse($request->start_date);
$end = Carbon::parse($request->end_date);

Event::whereBetween('scheduled_at', [$start, $end])->get();
```

### Query by Date Range

```php
// Frontend sends UTC strings
// "2024-01-01T00:00:00Z" to "2024-01-31T23:59:59Z"

public function index(Request $request)
{
    $query = Event::query();

    if ($request->filled('start_date')) {
        $query->where('scheduled_at', '>=', Carbon::parse($request->start_date));
    }

    if ($request->filled('end_date')) {
        $query->where('scheduled_at', '<=', Carbon::parse($request->end_date));
    }

    return EventResource::collection($query->paginate());
}
```

### Display for Specific Timezone (if needed)

```php
// Only when generating reports for specific timezone
$userTimezone = 'Asia/Tokyo';

$localTime = $event->scheduled_at->setTimezone($userTimezone);
// Keep original as UTC, create copy for display
```

---

## Model Setup

### Recommended Model Structure

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Event extends Model
{
    protected $fillable = [
        'title',
        'scheduled_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    // Accessor for formatted date (if needed internally)
    public function getScheduledAtFormattedAttribute(): string
    {
        return $this->scheduled_at?->toISOString() ?? '';
    }

    // Scope for upcoming events
    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>', Carbon::now());
    }

    // Scope for past events
    public function scopePast($query)
    {
        return $query->where('scheduled_at', '<', Carbon::now());
    }
}
```

### Resource Format

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'is_past' => $this->scheduled_at?->isPast() ?? false,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
```

---

## Migration Example

```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->timestamp('scheduled_at');  // Use timestamp, not datetime
    $table->timestamps();               // created_at, updated_at
});
```

> **Note:** `timestamp` columns in MySQL are stored as UTC internally.

---

## Anti-Patterns ❌

```php
// ❌ DON'T: Set local timezone in config
'timezone' => 'Asia/Tokyo',  // Wrong!

// ❌ DON'T: Use raw PHP date functions
$date = date('Y-m-d H:i:s');
$date = new \DateTime();

// ❌ DON'T: Return formatted local time in API
return ['created_at' => $this->created_at->format('Y/m/d H:i')];

// ❌ DON'T: Store timezone offset in database
$event->scheduled_at = '2024-01-15 19:30:00+09:00';

// ❌ DON'T: Convert to local timezone before storing
$event->scheduled_at = Carbon::parse($input)->setTimezone('Asia/Tokyo');
```

## Correct Patterns ✅

```php
// ✅ DO: Keep UTC timezone
'timezone' => 'UTC',

// ✅ DO: Use Carbon everywhere
$now = Carbon::now();
$date = Carbon::parse($input);

// ✅ DO: Return ISO 8601 UTC in API
return ['created_at' => $this->created_at?->toISOString()];

// ✅ DO: Store as UTC
$event->scheduled_at = Carbon::parse($input);  // Input should be UTC from frontend
```

---

## API Contract with Frontend

| Direction      | Format        | Example                         |
| -------------- | ------------- | ------------------------------- |
| API → Frontend | ISO 8601 UTC  | `"2024-01-15T10:30:00.000000Z"` |
| Frontend → API | ISO 8601 UTC  | `"2024-01-15T10:30:00.000Z"`    |
| Database       | UTC Timestamp | `2024-01-15 10:30:00`           |

---

## Testing with Dates

```php
use Illuminate\Support\Carbon;

public function test_creates_event_with_correct_date(): void
{
    Carbon::setTestNow('2024-01-15 10:00:00');  // Freeze time in UTC

    $response = $this->postJson('/api/events', [
        'title' => 'Test Event',
        'scheduled_at' => '2024-01-20T15:00:00.000Z',
    ]);

    $response->assertCreated();
    
    $this->assertDatabaseHas('events', [
        'title' => 'Test Event',
        'scheduled_at' => '2024-01-20 15:00:00',  // Stored as UTC
    ]);
}
```

---

## Checklist

- [ ] `config/app.php` timezone is `UTC`
- [ ] MySQL timezone is UTC
- [ ] All models use `datetime` cast for date fields
- [ ] All Resources return `->toISOString()` for dates
- [ ] Never use raw `date()` or `DateTime` - always Carbon
- [ ] Never convert to local timezone before storing
- [ ] API documentation specifies UTC format
