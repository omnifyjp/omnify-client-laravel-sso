---
id: model-editable
description: "User-editable Eloquent models. MUST read corresponding BaseModel before editing to avoid duplicating auto-generated code."
priority: medium
globs:
  - "app/Models/*.php"
tags:
  - laravel
  - model
---

# Model Editing Rules

These are **user-editable** model files that extend auto-generated BaseModels.

## ⚠️ BEFORE EDITING - MANDATORY STEPS

### 1. Read the BaseModel First

Before editing `Post.php`, you **MUST** read `OmnifyBase/PostBaseModel.php` to understand:
- What relations already exist
- What `$fillable`, `$hidden`, `$casts` are defined
- What traits are already used

### 2. Check for Existing Features

| Feature | Check in BaseModel | If exists, DO NOT duplicate |
|---------|-------------------|----------------------------|
| Relations | `author()`, `category()` | ❌ Already defined |
| Fillable | `$fillable` array | ❌ Already defined |
| Casts | `casts()` method | ❌ Already defined |
| Traits | `use SoftDeletes` | ❌ Already used |

## ❌ NEVER DUPLICATE

```php
// These are ALREADY in PostBaseModel - NEVER recreate!
public function author() { ... }      // ❌ Duplicate
public function category() { ... }    // ❌ Duplicate
public function tags() { ... }        // ❌ Duplicate
protected $fillable = [...]           // ❌ Duplicate
protected function casts(): array     // ❌ Duplicate
```

## ✅ ONLY ADD Custom Logic

```php
class Post extends PostBaseModel
{
    // ✅ Custom query scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured($query)
    {
        return $query->whereNotNull('featured_image');
    }

    // ✅ Custom accessors (computed properties)
    public function getReadTimeAttribute(): int
    {
        return (int) ceil(str_word_count($this->content) / 200);
    }

    public function getIsPublishedAttribute(): bool
    {
        return $this->status === 'published';
    }

    // ✅ Business logic methods
    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    // ✅ Custom relations NOT in schema
    public function relatedPosts()
    {
        return $this->hasMany(Post::class, 'category_id', 'category_id')
            ->where('id', '!=', $this->id);
    }

    // ✅ Event hooks
    protected static function booted(): void
    {
        static::creating(function ($post) {
            $post->slug = Str::slug($post->title);
        });
    }
}
```

## Built-in Features from BaseModel

### Localization (via HasLocalizedDisplayName trait)

```php
// Available on ALL models - use these instead of creating your own!
Post::displayName('ja')                     // "投稿"
Post::propertyDisplayName('title', 'ja')    // "タイトル"
Post::allPropertyDisplayNamesForLocale('ja')
```

## Need to Add New Fields?

**DO NOT** add to `$fillable` here. Instead:

1. Edit schema YAML in `schemas/`
2. Run `npx omnify generate`
3. Run `php artisan migrate`

The BaseModel will be updated automatically.

## Quick Checklist Before Saving

- [ ] Read `OmnifyBase/{Model}BaseModel.php` first
- [ ] Not duplicating any relation from BaseModel
- [ ] Not duplicating `$fillable`, `$hidden`, `$casts`
- [ ] Only adding custom scopes, accessors, or business logic
- [ ] Using `parent::booted()` if overriding `booted()`