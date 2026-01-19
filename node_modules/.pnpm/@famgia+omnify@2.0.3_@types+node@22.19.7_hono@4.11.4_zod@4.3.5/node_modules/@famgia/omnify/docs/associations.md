# Associations (Relationships)

Omnify supports full relational database associations with bidirectional mappings, cascading operations, and automatic foreign key generation.

## Table of Contents

- [Overview](#overview)
- [Relationship Types](#relationship-types)
  - [ManyToOne (BelongsTo)](#manytoone-belongsto)
  - [OneToMany (HasMany)](#onetomany-hasmany)
  - [OneToOne](#onetoone)
  - [ManyToMany (BelongsToMany)](#manytomany-belongstomany)
- [Association Properties](#association-properties)
- [Bidirectional Relationships](#bidirectional-relationships)
- [Cascading Operations](#cascading-operations)
- [Self-Referencing Associations](#self-referencing-associations)
- [Polymorphic Associations](#polymorphic-associations)
- [Pivot Tables](#pivot-tables)
- [Generated Output](#generated-output)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

---

## Overview

Associations are defined within the `properties` section using `type: Association`:

```yaml
properties:
  author:
    type: Association
    relation: ManyToOne
    target: User
```

This generates:
- **Laravel Migration**: Foreign key column (`author_id`) with constraint
- **TypeScript**: Type with foreign key field
- **Validation**: Checks that target schema exists

---

## Relationship Types

### ManyToOne (BelongsTo)

The most common relationship. Creates a foreign key column on this table.

```yaml
# schemas/Post.yaml
name: Post
properties:
  title:
    type: String

  # A post belongs to one author
  author:
    type: Association
    relation: ManyToOne
    target: User
```

**Generated Migration:**
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->unsignedBigInteger('author_id');

    $table->foreign('author_id')
          ->references('id')
          ->on('users');
});
```

**Generated TypeScript:**
```typescript
interface Post {
  id: number;
  title: string;
  author_id: number;
}
```

### OneToMany (HasMany)

Inverse side of ManyToOne. Does NOT create a column (the FK is on the other table).

```yaml
# schemas/User.yaml
name: User
properties:
  name:
    type: String

  # A user has many posts
  posts:
    type: Association
    relation: OneToMany
    target: Post
    inversedBy: author    # Links to Post.author
```

**Generated Migration:** No column added (FK is on `posts` table)

**Generated TypeScript:**
```typescript
interface User {
  id: number;
  name: string;
  // posts relationship accessed via ORM, not as direct field
}
```

### OneToOne

Creates a unique foreign key. Use `owningSide: true` on the table that should have the FK column.

```yaml
# schemas/User.yaml
name: User
properties:
  name:
    type: String

  profile:
    type: Association
    relation: OneToOne
    target: Profile
    owningSide: true      # User table has profile_id
```

```yaml
# schemas/Profile.yaml
name: Profile
properties:
  bio:
    type: Text

  user:
    type: Association
    relation: OneToOne
    target: User
    mappedBy: profile     # Inverse side
```

**Generated Migration (users table):**
```php
$table->unsignedBigInteger('profile_id')->unique();
$table->foreign('profile_id')->references('id')->on('profiles');
```

### ManyToMany (BelongsToMany)

Creates a pivot table. Define on both sides with `inversedBy`.

```yaml
# schemas/Post.yaml
name: Post
properties:
  title:
    type: String

  tags:
    type: Association
    relation: ManyToMany
    target: Tag
    inversedBy: posts
```

```yaml
# schemas/Tag.yaml
name: Tag
properties:
  name:
    type: String

  posts:
    type: Association
    relation: ManyToMany
    target: Post
    inversedBy: tags
```

**Generated Pivot Migration:**
```php
Schema::create('post_tag', function (Blueprint $table) {
    $table->unsignedBigInteger('post_id');
    $table->unsignedBigInteger('tag_id');

    $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
    $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');

    $table->primary(['post_id', 'tag_id']);
});
```

---

## Association Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `'Association'` | Yes | Must be `'Association'` |
| `relation` | `string` | Yes | `OneToOne`, `OneToMany`, `ManyToOne`, `ManyToMany` |
| `target` | `string` | Yes | Target schema name (PascalCase) |
| `inversedBy` | `string` | No | Property name on target that maps back (owner defines) |
| `mappedBy` | `string` | No | Property name on target that owns the relationship |
| `onDelete` | `string` | No | `CASCADE`, `SET NULL`, `RESTRICT`, `NO ACTION` |
| `onUpdate` | `string` | No | `CASCADE`, `SET NULL`, `RESTRICT`, `NO ACTION` |
| `owningSide` | `boolean` | No | For OneToOne, marks which side has the FK |
| `nullable` | `boolean` | No | Allow NULL for optional relationships |
| `joinTable` | `string` | No | Custom pivot table name for ManyToMany |

---

## Bidirectional Relationships

For bidirectional relationships, use `inversedBy` on the owning side and `mappedBy` on the inverse side:

```yaml
# Post (owning side - has the FK)
author:
  type: Association
  relation: ManyToOne
  target: User
  inversedBy: posts       # "User.posts points back to me"

# User (inverse side)
posts:
  type: Association
  relation: OneToMany
  target: Post
  mappedBy: author        # "Post.author is the owning side"
```

**Rules:**
- `ManyToOne` is always the owning side (has FK column)
- `OneToMany` is always the inverse side (no FK column)
- For `OneToOne`, specify `owningSide: true` on one side
- For `ManyToMany`, either side can have `inversedBy`

---

## Cascading Operations

Control what happens when referenced records are deleted or updated:

### onDelete Options

```yaml
author:
  type: Association
  relation: ManyToOne
  target: User
  onDelete: CASCADE       # Delete post when user is deleted
```

| Value | Behavior |
|-------|----------|
| `CASCADE` | Delete related records automatically |
| `SET NULL` | Set FK to NULL (requires `nullable: true`) |
| `RESTRICT` | Prevent deletion if references exist |
| `NO ACTION` | Database default (usually same as RESTRICT) |

### onUpdate Options

```yaml
author:
  type: Association
  relation: ManyToOne
  target: User
  onUpdate: CASCADE       # Update FK when user ID changes
```

### Common Patterns

```yaml
# Required relationship - prevent orphaned records
author:
  type: Association
  relation: ManyToOne
  target: User
  onDelete: RESTRICT

# Optional relationship - allow NULL
reviewer:
  type: Association
  relation: ManyToOne
  target: User
  nullable: true
  onDelete: SET NULL

# Cascade delete - clean up related data
comments:
  type: Association
  relation: OneToMany
  target: Comment
  inversedBy: post
  # Note: onDelete is set on the owning side (Comment.post)
```

---

## Self-Referencing Associations

Schemas can reference themselves for hierarchical data:

```yaml
# schemas/Category.yaml
name: Category
properties:
  name:
    type: String

  # Parent category (nullable for root categories)
  parent:
    type: Association
    relation: ManyToOne
    target: Category
    nullable: true
    onDelete: SET NULL

  # Child categories
  children:
    type: Association
    relation: OneToMany
    target: Category
    inversedBy: parent
```

**Generated Migration:**
```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->unsignedBigInteger('parent_id')->nullable();

    $table->foreign('parent_id')
          ->references('id')
          ->on('categories')
          ->onDelete('set null');
});
```

---

## Polymorphic Associations

For polymorphic relationships (one field pointing to multiple tables):

```yaml
# schemas/Comment.yaml
name: Comment
properties:
  body:
    type: Text

  # Can comment on Posts, Videos, or Photos
  commentable:
    type: Polymorphic
    targets:
      - Post
      - Video
      - Photo
```

**Generated Migration:**
```php
$table->string('commentable_type');
$table->unsignedBigInteger('commentable_id');
$table->index(['commentable_type', 'commentable_id']);
```

---

## Pivot Tables

### Auto-generated Pivot Tables

ManyToMany relationships automatically generate pivot tables:

```yaml
# Post has many Tags
tags:
  type: Association
  relation: ManyToMany
  target: Tag
```

Default pivot table name: `post_tag` (alphabetical order, snake_case)

### Custom Pivot Table Name

```yaml
tags:
  type: Association
  relation: ManyToMany
  target: Tag
  joinTable: article_tags    # Custom name
```

### Pivot Table with Extra Columns

Create a dedicated schema with `id: false`:

```yaml
# schemas/PostTag.yaml
name: PostTag
options:
  id: false                  # No auto-increment ID
  timestamps: true           # Add created_at, updated_at

properties:
  post:
    type: Association
    relation: ManyToOne
    target: Post
    onDelete: CASCADE

  tag:
    type: Association
    relation: ManyToOne
    target: Tag
    onDelete: CASCADE

  order:
    type: Int
    default: 0

  featured:
    type: Boolean
    default: false
```

**Generated Migration:**
```php
Schema::create('post_tags', function (Blueprint $table) {
    $table->unsignedBigInteger('post_id');
    $table->unsignedBigInteger('tag_id');
    $table->integer('order')->default(0);
    $table->boolean('featured')->default(false);
    $table->timestamps();

    $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
    $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');

    $table->primary(['post_id', 'tag_id']);
});
```

---

## Generated Output

### Laravel Migration Example

```yaml
# schemas/Comment.yaml
name: Comment
properties:
  body:
    type: Text

  post:
    type: Association
    relation: ManyToOne
    target: Post
    onDelete: CASCADE

  author:
    type: Association
    relation: ManyToOne
    target: User
    nullable: true
    onDelete: SET NULL

options:
  timestamps: true
```

**Generated:**
```php
Schema::create('comments', function (Blueprint $table) {
    $table->id();
    $table->text('body');
    $table->unsignedBigInteger('post_id');
    $table->unsignedBigInteger('author_id')->nullable();
    $table->timestamps();

    $table->foreign('post_id')
          ->references('id')
          ->on('posts')
          ->onDelete('cascade');

    $table->foreign('author_id')
          ->references('id')
          ->on('users')
          ->onDelete('set null');
});
```

### TypeScript Types Example

```typescript
interface Comment {
  id: number;
  body: string;
  post_id: number;
  author_id: number | null;
  created_at: string;
  updated_at: string;
}
```

---

## Best Practices

### 1. Always Define Both Sides

Define relationships on both schemas for clarity and tooling support:

```yaml
# Post.yaml
author:
  type: Association
  relation: ManyToOne
  target: User
  inversedBy: posts

# User.yaml
posts:
  type: Association
  relation: OneToMany
  target: Post
  mappedBy: author
```

### 2. Use Appropriate Cascade Actions

| Scenario | onDelete | Why |
|----------|----------|-----|
| Comments on a Post | `CASCADE` | Delete comments when post is deleted |
| Posts by a User | `RESTRICT` | Prevent user deletion if they have posts |
| Optional reviewer | `SET NULL` | Keep record, just remove the reference |

### 3. Name Associations Clearly

```yaml
# Good - clear intent
author:
  type: Association
  relation: ManyToOne
  target: User

createdBy:
  type: Association
  relation: ManyToOne
  target: User

assignedTo:
  type: Association
  relation: ManyToOne
  target: User
  nullable: true

# Bad - ambiguous
user1:
  type: Association
  relation: ManyToOne
  target: User
```

### 4. Consider Query Patterns

Place FK on the table you'll query most often:

```yaml
# If you often query "posts by user", this is correct:
# Post.author -> User (FK on posts table)

# If you often query "user's current session", consider:
# User.currentSession -> Session (FK on users table)
```

---

## Common Patterns

### Blog System

```yaml
# User.yaml
name: User
properties:
  name:
    type: String
  posts:
    type: Association
    relation: OneToMany
    target: Post
    inversedBy: author
  comments:
    type: Association
    relation: OneToMany
    target: Comment
    inversedBy: author

# Post.yaml
name: Post
properties:
  title:
    type: String
  content:
    type: Text
  author:
    type: Association
    relation: ManyToOne
    target: User
    mappedBy: posts
    onDelete: RESTRICT
  comments:
    type: Association
    relation: OneToMany
    target: Comment
    inversedBy: post
  tags:
    type: Association
    relation: ManyToMany
    target: Tag
    inversedBy: posts

# Comment.yaml
name: Comment
properties:
  body:
    type: Text
  post:
    type: Association
    relation: ManyToOne
    target: Post
    onDelete: CASCADE
  author:
    type: Association
    relation: ManyToOne
    target: User
    nullable: true
    onDelete: SET NULL

# Tag.yaml
name: Tag
properties:
  name:
    type: String
    unique: true
  posts:
    type: Association
    relation: ManyToMany
    target: Post
    inversedBy: tags
```

### E-commerce Order System

```yaml
# Order.yaml
name: Order
properties:
  orderNumber:
    type: String
    unique: true
  customer:
    type: Association
    relation: ManyToOne
    target: User
    onDelete: RESTRICT
  items:
    type: Association
    relation: OneToMany
    target: OrderItem
    inversedBy: order

# OrderItem.yaml
name: OrderItem
properties:
  quantity:
    type: Int
  price:
    type: Decimal
    precision: 10
    scale: 2
  order:
    type: Association
    relation: ManyToOne
    target: Order
    onDelete: CASCADE
  product:
    type: Association
    relation: ManyToOne
    target: Product
    onDelete: RESTRICT
```

### Multi-tenant System

```yaml
# Tenant.yaml
name: Tenant
properties:
  name:
    type: String
  users:
    type: Association
    relation: OneToMany
    target: User
    inversedBy: tenant
  projects:
    type: Association
    relation: OneToMany
    target: Project
    inversedBy: tenant

# User.yaml
name: User
properties:
  name:
    type: String
  tenant:
    type: Association
    relation: ManyToOne
    target: Tenant
    onDelete: CASCADE

# Project.yaml
name: Project
properties:
  name:
    type: String
  tenant:
    type: Association
    relation: ManyToOne
    target: Tenant
    onDelete: CASCADE
  members:
    type: Association
    relation: ManyToMany
    target: User
    inversedBy: projects
```

---

## See Also

- [Schema Format](./schema-format.md)
- [Property Types](./property-types.md)
- [Migration Generation](./migrations.md)
- [TypeScript Generation](./typescript.md)
