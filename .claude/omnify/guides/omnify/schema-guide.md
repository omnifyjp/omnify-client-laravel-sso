# Omnify Schema Format Guide

## Schema Location

All schemas are stored in `schemas/` directory with `.yaml` extension.

## Loading Schemas from Packages

Packages can provide their own schemas which are loaded via `additionalSchemaPaths` in `omnify.config.ts`.

### Configuration in omnify.config.ts

```typescript
const config: OmnifyConfig = {
  schemasDir: './schemas',

  // Additional schema paths from packages
  additionalSchemaPaths: [
    {
      path: './packages/sso-client/database/schemas',
      namespace: 'Sso',
    },
    {
      path: './packages/billing/schemas',
      namespace: 'Billing',
    },
  ],

  // ... other config
};
```

### Package Schema Structure

```
packages/sso-client/
├── database/
│   └── schemas/
│       ├── Role.yaml
│       ├── Permission.yaml
│       └── UserSsoPartial.yaml  # Partial to extend main User
└── composer.json
```

### Using Package Schemas

Once configured, package schemas can be:

1. **Referenced in relations**: `type: Role` works automatically
2. **Extended via Partial**: Create partial schemas to add properties to main schemas
3. **Overridden**: Main `schemas/` takes priority over package schemas

### Connecting to Unloaded Package Schemas

If a package's schema is not loaded but you need to reference it:

```yaml
# Create a Partial schema stub
# schemas/stubs/User.yaml
name: User
kind: partial
target: User

# Minimal properties for relation connectivity
properties:
  id:
    type: BigInt
```

Now other schemas can reference `User` in relationships.

## Multi-language Support (i18n)

Omnify supports multi-language labels and placeholders for internationalized applications.

### Supported Locales

| Code    | Language                       |
| ------- | ------------------------------ |
| `ja`    | Japanese (日本語)              |
| `en`    | English                        |
| `vi`    | Vietnamese (Tiếng Việt)        |
| `ko`    | Korean (한국어)                |
| `zh-CN` | Simplified Chinese (简体中文)  |
| `zh-TW` | Traditional Chinese (繁體中文) |
| `th`    | Thai (ภาษาไทย)                 |
| `es`    | Spanish (Español)              |

### Usage in Schema

```yaml
# Model-level i18n
displayName:
  ja: 顧客
  en: Customer
  vi: Khách hàng

description:
  ja: 顧客情報を管理するモデル
  en: Model for managing customer information
  vi: Model quản lý thông tin khách hàng

properties:
  email:
    type: Email
    # Property-level i18n
    displayName:
      ja: メールアドレス
      en: Email Address
      vi: Địa chỉ email
    placeholder:
      ja: "例：customer@example.com"
      en: "e.g. customer@example.com"
      vi: "VD: customer@example.com"
    description:
      ja: 連絡先メールアドレス
      en: Contact email address
      vi: Địa chỉ email liên hệ

  notes:
    type: Text
    nullable: true
    displayName:
      ja: 備考
      en: Notes
      vi: Ghi chú
    placeholder:
      ja: 顧客に関するメモを入力してください
      en: Enter notes about this customer
      vi: Nhập ghi chú về khách hàng này
```

### Enum i18n

```yaml
name: PostStatus
kind: enum
displayName:
  ja: 投稿ステータス
  en: Post Status
  vi: Trạng thái bài viết
values:
  draft:
    ja: 下書き
    en: Draft
    vi: Bản nháp
  published:
    ja: 公開済み
    en: Published
    vi: Đã xuất bản
  archived:
    ja: アーカイブ
    en: Archived
    vi: Đã lưu trữ
```

## Object Schema Structure

```yaml
# yaml-language-server: $schema=./node_modules/.omnify/combined-schema.json
name: ModelName          # Required: PascalCase
kind: object             # Optional: 'object' (default) or 'enum'
displayName:             # Optional: i18n display name
  ja: 日本語名
  en: English Name
description:             # Optional: i18n description
  ja: 説明文
  en: Description
group: group-name        # Optional: for organizing schemas
titleIndex: name         # Optional: property to use as record title/label
options:
  # See Schema Options below
properties:
  # Property definitions here
```

## Partial Schema (Extension Schema)

Partial schemas allow you to extend existing schemas or connect to external package schemas.

### Use Cases

1. **Extend package schema**: Add properties to a schema from external package
2. **Connect to external schema**: Create relation target for schemas not in your project
3. **Override properties**: Customize package schema with project-specific fields

### Basic Partial Schema

```yaml
# schemas/extensions/User.yaml
name: User
kind: partial
target: User             # Target schema to extend (can be same as name)

displayName:
  ja: ユーザー拡張
  en: User Extension

properties:
  # Add new properties to the target schema
  profile_image_url:
    type: String
    nullable: true
    displayName:
      ja: プロフィール画像
      en: Profile Image

  department:
    type: Department
    relation: belongsTo
    nullable: true
```

### Self-Referencing Partial (Connect to External Package)

When connecting to a schema from an external package that isn't loaded in your project:

```yaml
# schemas/package/User.yaml
# Create a stub for external package's User schema
name: User
kind: partial
target: User             # Same as name = standalone schema

displayName:
  ja: ユーザー
  en: User

# Minimal properties for relationship connections
properties:
  email:
    type: Email
    displayName:
      ja: メール
      en: Email
```

This creates a valid `User` schema that can be referenced by other schemas:

```yaml
# schemas/blog/Post.yaml
name: Post
kind: object

properties:
  author:
    type: User           # ✅ Now works! User exists as partial schema
    relation: belongsTo
```

### Partial Schema Rules

| Rule | Description |
|------|-------------|
| `kind: partial` | Required to mark as partial schema |
| `target` | Schema to extend (required) |
| Same name = standalone | If `name === target`, treated as independent schema |
| Properties merge | Partial properties merged with target (target takes priority) |
| No duplicates | Cannot have multiple partials with same name |

### Schema Options Reference

| Option                         | Type    | Default    | Description                                        |
| ------------------------------ | ------- | ---------- | -------------------------------------------------- |
| `id`                           | boolean | `true`     | Auto-generate `id` primary key column              |
| `idType`                       | string  | `BigInt`   | ID type: `BigInt`, `Int`, `Uuid`, `String`         |
| `timestamps`                   | boolean | `false`    | Add `created_at`, `updated_at` columns             |
| `softDelete`                   | boolean | `false`    | Add `deleted_at` column for soft deletes           |
| `tableName`                    | string  | -          | Custom table name (default: pluralized snake_case) |
| `hidden`                       | boolean | `false`    | Skip model generation (migrations only)            |
| `translations`                 | boolean | `false`    | Enable translations support                        |
| `unique`                       | array   | -          | Unique constraints (see below)                     |
| `indexes`                      | array   | -          | Database indexes (see below)                       |
| `authenticatable`              | boolean | `false`    | Enable auth trait (User-like schemas)              |
| `authenticatableLoginIdField`  | string  | `email`    | Login ID field for auth                            |
| `authenticatablePasswordField` | string  | `password` | Password field for auth                            |
| `authenticatableGuardName`     | string  | -          | Guard name for auth                                |

### Schema Options Example

```yaml
options:
  id: true
  idType: BigInt
  timestamps: true
  softDelete: true
  tableName: custom_table_name
  hidden: false
  
  # Unique constraints
  unique:
    - email                      # Single column unique
    - [tenant_id, slug]          # Composite unique
  
  # Database indexes
  indexes:
    - columns: [status]          # Simple index
    - columns: [published_at]
      name: idx_published        # Custom index name
    - columns: [status, published_at]
      unique: true               # Unique index
    - columns: [title]
      type: fulltext             # Fulltext index (MySQL)
```

### Authenticatable Schema (User)

Use `authenticatable: true` when the model needs to work with Laravel's authentication system (login, sessions, guards).

```yaml
name: User
displayName:
  ja: ユーザー
  en: User
options:
  timestamps: true
  softDelete: true
  authenticatable: true
  authenticatableLoginIdField: email
  authenticatablePasswordField: password
  authenticatableGuardName: web

properties:
  email:
    type: Email
    unique: true
  password:
    type: Password
  name:
    type: String
```

## Authenticatable Option - Detailed Guide

### When to Use `authenticatable: true`

| Scenario                                  | Use authenticatable? |
| ----------------------------------------- | -------------------- |
| User can login to the application         | ✅ Yes                |
| Admin users with separate login           | ✅ Yes                |
| API token-based auth users                | ✅ Yes                |
| Customer/Member entities that login       | ✅ Yes                |
| Regular data models (Post, Product, etc.) | ❌ No                 |
| Related user data (Profile, Settings)     | ❌ No                 |

### Authentication Options Reference

| Option                         | Type    | Default    | Description                          |
| ------------------------------ | ------- | ---------- | ------------------------------------ |
| `authenticatable`              | boolean | `false`    | Enable authentication support        |
| `authenticatableLoginIdField`  | string  | `email`    | Field used for login identification  |
| `authenticatablePasswordField` | string  | `password` | Field containing the hashed password |
| `authenticatableGuardName`     | string  | (none)     | Guard name in `config/auth.php`      |

### Complete Examples

#### 1. Basic User (Email/Password Login)

```yaml
name: User
displayName:
  ja: ユーザー
  en: User
options:
  timestamps: true
  softDelete: true
  authenticatable: true
  authenticatableLoginIdField: email
  authenticatablePasswordField: password

properties:
  email:
    type: Email
    unique: true
    displayName:
      ja: メールアドレス
      en: Email
  password:
    type: Password
    displayName:
      ja: パスワード
      en: Password
  name:
    type: String
    displayName:
      ja: 氏名
      en: Name
```

**Generated Laravel Model:**

```php
// app/Models/Base/UserBaseModel.php
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class UserBaseModel extends Authenticatable
{
    use Notifiable;
    // ...
}
```

#### 2. Admin User (Separate Guard)

```yaml
name: Admin
displayName:
  ja: 管理者
  en: Admin
options:
  timestamps: true
  authenticatable: true
  authenticatableLoginIdField: email
  authenticatablePasswordField: password
  authenticatableGuardName: admin

properties:
  email:
    type: Email
    unique: true
  password:
    type: Password
  name:
    type: String
  role:
    type: EnumRef
    enum: AdminRole
```

**Required `config/auth.php` Configuration:**

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'admin' => [  // Match authenticatableGuardName
        'driver' => 'session',
        'provider' => 'admins',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],
    'admins' => [  // Provider for admin guard
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
],
```

#### 3. Username-based Login (Not Email)

```yaml
name: Member
displayName:
  ja: メンバー
  en: Member
options:
  timestamps: true
  authenticatable: true
  authenticatableLoginIdField: username   # ← Use username instead of email
  authenticatablePasswordField: password

properties:
  username:
    type: String
    unique: true
    length: 50
    displayName:
      ja: ユーザー名
      en: Username
  password:
    type: Password
  display_name:
    type: String
```

#### 4. API Token Authentication (Laravel Sanctum)

```yaml
name: ApiUser
displayName:
  ja: APIユーザー
  en: API User
options:
  timestamps: true
  authenticatable: true
  authenticatableLoginIdField: api_key
  authenticatablePasswordField: api_secret

properties:
  api_key:
    type: String
    unique: true
    length: 64
  api_secret:
    type: Password
  name:
    type: String
  rate_limit:
    type: Int
    default: 1000
```

### What Gets Generated

When `authenticatable: true` is set, Omnify generates:

```
app/Models/
├── Base/
│   └── UserBaseModel.php    ← Extends Authenticatable (auto-generated)
└── User.php                 ← Your customizable model (extends UserBaseModel)
```

**UserBaseModel.php** (DO NOT EDIT - auto-generated):

```php
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class UserBaseModel extends Authenticatable
{
    use Notifiable;
    use HasLocalizedDisplayName;

    protected $table = 'users';
    protected $fillable = ['email', 'password', 'name'];
    protected $hidden = ['password', 'remember_token'];
    // ...
}
```

**User.php** (Your customization):

```php
class User extends UserBaseModel
{
    // Add custom methods, relationships, scopes here
    
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

### Difference from Non-Auth Models

| Feature          | `authenticatable: false` | `authenticatable: true` |
| ---------------- | ------------------------ | ----------------------- |
| Base class       | `Model`                  | `Authenticatable`       |
| Notifiable trait | ❌ Not included           | ✅ Included              |
| Remember token   | ❌ Not supported          | ✅ Supported             |
| Password hiding  | Manual                   | ✅ Auto-hidden           |
| Guard support    | ❌ No                     | ✅ Yes                   |
| Session auth     | ❌ No                     | ✅ Yes                   |

### Migration Schema Requirements

For authenticatable models, ensure your schema includes:

```yaml
properties:
  # Required: Login ID field (must match authenticatableLoginIdField)
  email:
    type: Email
    unique: true
  
  # Required: Password field (must match authenticatablePasswordField)
  password:
    type: Password
  
  # Optional but recommended: Remember token for "Remember Me" feature
  # This is auto-handled by Laravel, no need to define in schema
```

### Common Use Cases

#### Multi-tenant Authentication

```yaml
name: TenantUser
options:
  timestamps: true
  authenticatable: true
  authenticatableLoginIdField: email
  unique:
    - [tenant_id, email]  # Unique email per tenant

properties:
  tenant_id:
    type: BigInt
  email:
    type: Email
  password:
    type: Password
```

#### Social Login Integration

```yaml
name: User
options:
  timestamps: true
  authenticatable: true
  authenticatableLoginIdField: email

properties:
  email:
    type: Email
    unique: true
  password:
    type: Password
    nullable: true          # ← Nullable for social-only users
  google_id:
    type: String
    nullable: true
    unique: true
  github_id:
    type: String
    nullable: true
    unique: true
```

### Future Improvement: Trait-based Authentication

> **Note:** In future versions, Omnify may support a trait-based approach instead of 
> extending `Authenticatable`. This would allow:
>
> ```php
> use Illuminate\Database\Eloquent\Model;
> use Illuminate\Auth\Authenticatable;
> use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
>
> class UserBaseModel extends Model implements AuthenticatableContract
> {
>     use Authenticatable;  // Trait provides implementation
>     // ...
> }
> ```
>
> Benefits:
> - More flexibility in model inheritance
> - Consistent base class across all models
> - Easier to add custom base model features
>
> This is tracked for future implementation.

## Property Types

### String Types
| Type         | Description          | Options                |
| ------------ | -------------------- | ---------------------- |
| `String`     | Short text (varchar) | `length`, `default`    |
| `Email`      | Email address        | `length`, `default`    |
| `Password`   | Hashed password      | `length` (auto-hidden) |
| `Text`       | Text (~65KB)         | `default`              |
| `MediumText` | Medium text (~16MB)  | `default`              |
| `LongText`   | Long text (~4GB)     | `default`              |

### Numeric Types
| Type      | Description              | Options                         |
| --------- | ------------------------ | ------------------------------- |
| `TinyInt` | 8-bit integer (-128~127) | `default`, `unsigned`           |
| `Int`     | 32-bit integer           | `default`, `unsigned`           |
| `BigInt`  | 64-bit integer           | `default`, `unsigned`           |
| `Float`   | Floating point           | `default`                       |
| `Decimal` | Precise decimal          | `precision`, `scale`, `default` |

### Date/Time Types
| Type        | Description   | Options                            |
| ----------- | ------------- | ---------------------------------- |
| `Date`      | Date only     | `default`                          |
| `Time`      | Time only     | `default`                          |
| `DateTime`  | Date and time | `default`                          |
| `Timestamp` | Timestamp     | `useCurrent`, `useCurrentOnUpdate` |

### Other Types
| Type          | Description                   | Options                                     |
| ------------- | ----------------------------- | ------------------------------------------- |
| `Boolean`     | True/false                    | `default`                                   |
| `Json`        | JSON object                   | `default`                                   |
| `EnumRef`     | Reference to shared enum      | `enum` (required), `default`                |
| `Enum`        | Inline enum values            | `enum` (array of values), `default`         |
| `File`        | File attachment (polymorphic) | `multiple`, `maxFiles`, `accept`, `maxSize` |
| `Point`       | Spatial POINT (lat/lng)       | -                                           |
| `Coordinates` | Two DECIMALs (lat, lng)       | - (more portable than Point)                |

### File Type Example

```yaml
avatar:
  type: File
  displayName:
    ja: プロフィール画像
    en: Profile Image
  accept: [jpg, png, webp]    # Allowed extensions
  maxSize: 2048               # Max file size in KB

attachments:
  type: File
  multiple: true              # Allow multiple files
  maxFiles: 5                 # Maximum number of files
  accept: [pdf, doc, docx]
  maxSize: 10240
```

### Inline Enum Example

```yaml
priority:
  type: Enum
  enum: [low, medium, high]   # Inline values
  default: medium
  displayName:
    ja: 優先度
    en: Priority
```

### Japan Types (Plugin: @famgia/omnify-japan)

Requires `@famgia/omnify-japan` plugin in `omnify.config.ts`.

#### Simple Types
| Type                 | Description                        | SQL Output    |
| -------------------- | ---------------------------------- | ------------- |
| `JapanesePhone`      | Phone number (e.g., 090-1234-5678) | `VARCHAR(15)` |
| `JapanesePostalCode` | Postal code (e.g., 123-4567)       | `VARCHAR(8)`  |

```yaml
phone:
  type: JapanesePhone
  displayName:
    ja: 電話番号
    en: Phone Number
  placeholder:
    ja: "例：090-1234-5678"
    en: "e.g. 090-1234-5678"

postal_code:
  type: JapanesePostalCode
  displayName:
    ja: 郵便番号
    en: Postal Code
```

#### Compound Types (Auto-expand to multiple columns)

| Type                  | Expanded Columns                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JapaneseName`        | `{prefix}_lastname`, `{prefix}_firstname`, `{prefix}_kana_lastname`, `{prefix}_kana_firstname`                                                                            |
| `JapaneseAddress`     | `{prefix}_postal_code`, `{prefix}_prefecture`, `{prefix}_address1`, `{prefix}_address2`, `{prefix}_address3`                                                              |
| `JapaneseBankAccount` | `{prefix}_bank_code`, `{prefix}_bank_name`, `{prefix}_branch_code`, `{prefix}_branch_name`, `{prefix}_account_type`, `{prefix}_account_number`, `{prefix}_account_holder` |

##### JapaneseName Example

```yaml
name:
  type: JapaneseName
  displayName:
    ja: 氏名
    en: Full Name
  # Override individual fields
  fields:
    Lastname:
      length: 100              # Override VARCHAR length (default: 50)
      displayName:
        ja: 顧客姓
        en: Customer Last Name
      placeholder:
        ja: "例：山田"
        en: "e.g. Yamada"
    Firstname:
      length: 100
      placeholder:
        ja: "例：太郎"
        en: "e.g. Taro"
    KanaLastname:
      length: 200
      nullable: true           # Make optional (default: required)
      hidden: true             # Hide from forms
      placeholder:
        ja: "例：ヤマダ"
        en: "e.g. Yamada (Kana)"
    KanaFirstname:
      length: 200
      nullable: true
      hidden: true
```

##### JapaneseAddress Example

```yaml
address:
  type: JapaneseAddress
  displayName:
    ja: 住所
    en: Address
  fields:
    # PostalCode: uses plugin default (例：123-4567)
    # Prefecture: uses Prefecture enum from plugin (47 prefectures)
    Address1:
      displayName:
        ja: 市区町村
        en: City/Ward
    Address2:
      displayName:
        ja: 番地
        en: Street Address
    Address3:
      nullable: true
      placeholder:
        ja: "マンション名・部屋番号（任意）"
        en: "Apartment/Room (optional)"
```

##### JapaneseBankAccount Example

```yaml
bank:
  type: JapaneseBankAccount
  nullable: true
  displayName:
    ja: 銀行口座
    en: Bank Account
  fields:
    BankCode:
      nullable: true
      # Format: 4-digit code (e.g., 0001)
    BankName:
      nullable: true
    BranchCode:
      nullable: true
      # Format: 3-digit code (e.g., 001)
    BranchName:
      nullable: true
    AccountType:
      nullable: true
      # Uses BankAccountType enum: 1(普通), 2(当座), 4(貯蓄)
    AccountNumber:
      nullable: true
      # Format: 7-digit number
    AccountHolder:
      nullable: true
      # Katakana only (e.g., ヤマダ タロウ)
```

#### Plugin Enums

| Enum              | Description             | Values                                          |
| ----------------- | ----------------------- | ----------------------------------------------- |
| `Prefecture`      | 47 Japanese prefectures | `hokkaido`, `tokyo`, `osaka`, ... (string keys) |
| `PrefectureCode`  | Prefecture JIS codes    | `1`-`47` (numeric)                              |
| `BankAccountType` | Bank account types      | `1`=普通, `2`=当座, `4`=貯蓄                    |

### Association Type
| Type          | Description | Options                                      |
| ------------- | ----------- | -------------------------------------------- |
| `Association` | Relation    | `relation`, `target`, `onDelete`, `mappedBy` |

## Property Options

### All Property Options Reference

| Option        | Type            | Default | Description                                  |
| ------------- | --------------- | ------- | -------------------------------------------- |
| `type`        | string          | -       | **Required.** Property type                  |
| `displayName` | LocalizedString | -       | Human-readable label (i18n)                  |
| `description` | LocalizedString | -       | Field description/help text (i18n)           |
| `placeholder` | LocalizedString | -       | Form input placeholder (i18n)                |
| `nullable`    | boolean         | `false` | Allow NULL in database                       |
| `unique`      | boolean         | `false` | Unique constraint                            |
| `default`     | any             | -       | Default value                                |
| `primary`     | boolean         | `false` | Primary key (use with `options.id: false`)   |
| `hidden`      | boolean         | `false` | Hide from API responses (Laravel: `$hidden`) |
| `fillable`    | boolean         | `true`  | Mass assignable (Laravel: `$fillable`)       |
| `renamedFrom` | string          | -       | Previous column name (for rename migrations) |
| `length`      | number          | `255`   | VARCHAR length (String/Email/Password only)  |
| `unsigned`    | boolean         | `false` | Unsigned number (numeric types only)         |
| `precision`   | number          | `8`     | Total digits (Decimal only)                  |
| `scale`       | number          | `2`     | Decimal places (Decimal only)                |
| `rules`       | object          | -       | Validation rules (app-level, NOT database)   |
| `fields`      | object          | -       | Per-field overrides (compound types only)    |

### Example with All Options

```yaml
properties:
  name:
    type: String
    length: 100              # VARCHAR(100)
    displayName:
      ja: 名前
      en: Name
    description:
      ja: ユーザーの表示名
      en: Display name for the user
    placeholder:
      ja: 名前を入力
      en: Enter name
    nullable: false          # NOT NULL
    unique: true             # UNIQUE constraint
    default: Guest           # Default value (no quotes needed!)
    rules:
      required: true         # App-level validation
      minLength: 2
      maxLength: 100

  password:
    type: Password
    hidden: true             # Auto-hidden for Password, but explicit is clearer
    fillable: true           # Allow mass assignment

  old_email:
    type: Email
    renamedFrom: email_address  # Rename migration from old column name

  price:
    type: Decimal
    precision: 10            # Total 10 digits
    scale: 2                 # 2 decimal places (e.g., 99999999.99)
    unsigned: true           # Positive only
```

### Validation Rules (App-level)

```yaml
rules:
  required: true          # Field is required (form validation)
  minLength: 2            # Minimum string length
  maxLength: 255          # Maximum string length
```

**Note:** `rules` are for application/form validation only. They do NOT affect database structure. Use `nullable: false` for database-level NOT NULL constraint.

## Placeholder for Compound Types

For compound types (like JapaneseName, JapaneseAddress), you can customize placeholders per field:

```yaml
properties:
  name:
    type: JapaneseName
    displayName:
      ja: 氏名
      en: Full Name
    fields:                  # Per-field overrides for compound types
      Lastname:
        placeholder:         # Override default placeholder
          ja: 姓を入力
          en: Enter last name
      Firstname:
        placeholder:
          ja: 名を入力
          en: Enter first name
      KanaLastname:
        nullable: true
        placeholder:
          ja: セイ（カナ）
          en: Last name (Kana)
      KanaFirstname:
        nullable: true
        placeholder:
          ja: メイ（カナ）
          en: First name (Kana)
```

**Note**: Compound types from plugins (like `@famgia/omnify-japan`) come with default placeholders for common locales (en, ja, vi). You can override them in your schema as shown above.

## Association Relations

### ManyToOne (N:1)
```yaml
author:
  type: Association
  relation: ManyToOne
  target: User
  onDelete: CASCADE        # CASCADE, SET_NULL, RESTRICT
```

### OneToMany (1:N)
```yaml
posts:
  type: Association
  relation: OneToMany
  target: Post
  mappedBy: author         # Property name in Post that references this
```

### ManyToMany (N:M)
```yaml
tags:
  type: Association
  relation: ManyToMany
  target: Tag
  joinTable: post_tags     # Optional: custom pivot table name
  owning: true             # Optional: marks this as the owning side
  pivotFields:             # Optional: extra pivot fields
    order:
      type: Int
      default: 0
    assigned_at:
      type: Timestamp
      nullable: true
```

**Pivot Fields** - Additional columns on the pivot table:
```yaml
# Organization.yaml - Owning side with pivotFields
users:
  type: Association
  relation: ManyToMany
  target: User
  joinTable: organization_user
  owning: true
  pivotFields:
    org_role:
      type: String
      length: 50
      default: member        # ✅ Just the value, NO quotes wrapper!
    is_default:
      type: Boolean
      default: false
    joined_at:
      type: Timestamp
      nullable: true
    invited_by:
      type: BigInt
      nullable: true
      unsigned: true

# User.yaml - Inverse side with mappedBy
organizations:
  type: Association
  relation: ManyToMany
  target: Organization
  joinTable: organization_user
  mappedBy: users          # References the owning side property
```

> ⚠️ **CRITICAL: String Default Values**
> ```yaml
> # ❌ WRONG - Produces curly quotes (smart quotes) → ''cloud''
> default: "'cloud'"
> default: "'member'"
> 
> # ✅ CORRECT - Produces straight quotes → 'cloud'
> default: cloud
> default: member
> ```
> Just write the value directly without wrapping in quotes!

> ⚠️ **CRITICAL: Database Function Keywords NOT Allowed in Default**
>
> Database-specific function keywords are NOT allowed in the `default` field.
> Use the appropriate schema options instead:
>
> ```yaml
> # ❌ WRONG - DB functions are not allowed
> failed_at:
>   type: Timestamp
>   default: CURRENT_TIMESTAMP    # ERROR!
>
> created_at:
>   type: DateTime
>   default: NOW()                # ERROR!
>
> external_id:
>   type: Uuid
>   default: UUID()               # ERROR!
>
> sort_order:
>   type: Int
>   default: AUTO_INCREMENT       # ERROR!
>
> # ✅ CORRECT - Use proper schema options
> failed_at:
>   type: Timestamp
>   useCurrent: true              # Equivalent to CURRENT_TIMESTAMP
>
> updated_at:
>   type: Timestamp
>   useCurrent: true
>   useCurrentOnUpdate: true      # ON UPDATE CURRENT_TIMESTAMP
>
> external_id:
>   type: Uuid
>   nullable: true                # Let application generate UUID
>
> sort_order:
>   type: Int
>   default: 0                    # Use static value
> ```
>
> **Valid Default Values by Type:**
> | Type | Valid Default | Invalid (DB Keywords) |
> |------|---------------|----------------------|
> | String, Text | Any static string | - |
> | Int, BigInt | Static integer (0, 100, -1) | AUTO_INCREMENT, RAND(), SERIAL |
> | Float, Decimal | Static number (0.0, 99.99) | RAND(), PI() |
> | Boolean | true, false, 1, 0 | - |
> | Date | YYYY-MM-DD (2024-01-01) | CURRENT_DATE, CURDATE() |
> | Time | HH:MM:SS (14:30:00) | CURRENT_TIME, CURTIME() |
> | DateTime | YYYY-MM-DD HH:MM:SS | CURRENT_TIMESTAMP, NOW() |
> | Timestamp | YYYY-MM-DD HH:MM:SS or use `useCurrent` | CURRENT_TIMESTAMP, NOW() |
> | Uuid | Static UUID string | UUID(), GEN_RANDOM_UUID() |
> | Enum | One of the enum values | - |

**Generated Migration:**
```php
Schema::create('organization_user', function (Blueprint $table) {
    $table->unsignedBigInteger('organization_id');
    $table->unsignedBigInteger('user_id');
    $table->string('org_role', 50)->default('member');
    $table->boolean('is_default')->default(false);
    $table->timestamp('joined_at')->nullable();
    $table->bigInteger('invited_by')->nullable()->unsigned();
    $table->timestamp('created_at')->nullable();
    $table->timestamp('updated_at')->nullable();
    // ... foreign keys and indexes
});
```

**Generated Model:**
```php
// Both sides get withPivot() automatically
public function users(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'organization_user')
        ->withPivot('org_role', 'is_default', 'joined_at', 'invited_by')
        ->withTimestamps();
}
```

### OneToOne (1:1)
```yaml
profile:
  type: Association
  relation: OneToOne
  target: Profile
  onDelete: CASCADE
```

### MorphTo (Polymorphic)
```yaml
# Comment can belong to Post or Video
commentable:
  type: Association
  relation: MorphTo
  targets: [Post, Video]
  nullable: true           # Default: true (columns are nullable)
```

Generates `commentable_type` (enum) and `commentable_id` columns.

### MorphMany (Inverse Polymorphic)
```yaml
# Post has many comments
comments:
  type: Association
  relation: MorphMany
  target: Comment
  morphName: commentable   # Matches MorphTo property name
```

## Hidden Schemas

For system tables that only need migrations (no models), use `hidden: true`:

```yaml
# Cache table - migrations only, no Laravel/TypeScript models
name: Cache
options:
  id: false
  timestamps: false
  hidden: true           # Skip model generation
properties:
  key:
    type: String
    primary: true
  value:
    type: Text
  expiration:
    type: Int
```

Use cases for `hidden: true`:
- Laravel cache tables (`cache`, `cache_locks`)
- Job queues (`jobs`, `failed_jobs`)
- Session tables
- System tables that don't need application models

## Custom Primary Keys

For tables without auto-generated id (like cache, sessions, pivot tables):

```yaml
# Cache table with string primary key
name: Cache
options:
  id: false              # Disable auto-generated id
  timestamps: false
properties:
  key:
    type: String
    primary: true        # This becomes the primary key
  value:
    type: Text
  expiration:
    type: Int
```

Generates:
```php
Schema::create('caches', function (Blueprint $table) {
    $table->string('key')->primary();
    $table->text('value');
    $table->integer('expiration');
});
```

### Composite Primary Keys

```yaml
name: UserRole
options:
  id: false
  timestamps: false
properties:
  userId:
    type: BigInt
    primary: true
  roleId:
    type: BigInt
    primary: true
  assignedAt:
    type: DateTime
```

### Timestamp with useCurrent

```yaml
name: AuditLog
properties:
  action:
    type: String
  created_at:
    type: Timestamp
    useCurrent: true           # Default to CURRENT_TIMESTAMP
  updated_at:
    type: Timestamp
    useCurrent: true
    useCurrentOnUpdate: true   # Auto-update on row change
```

Generates:
```php
$table->timestamp('created_at')->useCurrent();
$table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
```

## Enum Schema

```yaml
name: PostStatus
kind: enum
displayName:
  ja: 投稿ステータス
  en: Post Status
values:
  draft: ドラフト          # value: displayName format
  published: 公開済み
  archived: アーカイブ
```

Use enum in object schema:
```yaml
status:
  type: EnumRef
  enum: PostStatus         # Reference enum name
  default: draft           # Default value from enum
```

## MCP Tools

If Omnify MCP is configured, these tools are available:
- `omnify_create_schema` - Generate schema YAML
- `omnify_validate_schema` - Validate YAML content
- `omnify_get_types` - Property types documentation
- `omnify_get_relationships` - Relationship guide
- `omnify_get_examples` - Example schemas
