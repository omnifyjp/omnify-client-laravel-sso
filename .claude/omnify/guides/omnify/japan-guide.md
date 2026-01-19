# Japan Plugin Types Guide

This project uses `@famgia/omnify-japan` plugin which provides Japan-specific types.

## Available Types

### Simple Types

#### JapanesePhone
Japanese phone number format (e.g., `090-1234-5678`, `03-1234-5678`)
- SQL: `VARCHAR(15)`
- Accepts with or without hyphens

```yaml
phone:
  type: JapanesePhone
```

#### JapanesePostalCode
Japanese postal code format (e.g., `123-4567`)
- SQL: `VARCHAR(8)`
- Accepts with or without hyphen

```yaml
postal_code:
  type: JapanesePostalCode
  nullable: true
```

### Compound Types

Compound types expand into multiple database columns automatically.

#### JapaneseName
Japanese name with kanji and kana variants.

**Expands to 4 columns:**
- `{property}_lastname` - VARCHAR(50) - Family name (姓)
- `{property}_firstname` - VARCHAR(50) - Given name (名)
- `{property}_kana_lastname` - VARCHAR(100) - Family name in katakana
- `{property}_kana_firstname` - VARCHAR(100) - Given name in katakana

**Accessors generated:**
- `{property}_full_name` - "姓 名" (space-separated)
- `{property}_full_name_kana` - "セイ メイ" (space-separated)

```yaml
name:
  type: JapaneseName
  displayName:
    ja: 氏名
    en: Full Name
  # Per-field overrides
  fields:
    KanaLastname:
      nullable: true
      hidden: true
    KanaFirstname:
      nullable: true
      hidden: true
```

#### JapaneseAddress
Japanese address with postal code and prefecture ID.

**Expands to 5 columns:**
- `{property}_postal_code` - VARCHAR(8) - Postal code (郵便番号)
- `{property}_prefecture_id` - TINYINT UNSIGNED - Prefecture ID 1-47 (都道府県)
- `{property}_address1` - VARCHAR(255) - City/Ward (市区町村)
- `{property}_address2` - VARCHAR(255) - Street address (丁目番地号)
- `{property}_address3` - VARCHAR(255) NULLABLE - Building name (ビル・マンション名)

**Accessors generated:**
- `{property}_full_address` - Concatenation of address1 + address2 + address3

```yaml
address:
  type: JapaneseAddress
  displayName:
    ja: 住所
    en: Address
  fields:
    Address3:
      nullable: true
```

**Prefecture IDs (JIS X 0401):**
| ID | Prefecture | ID | Prefecture | ID | Prefecture |
|----|-----------|----|-----------|----|-----------|
| 1 | 北海道 | 17 | 石川県 | 33 | 岡山県 |
| 2 | 青森県 | 18 | 福井県 | 34 | 広島県 |
| 3 | 岩手県 | 19 | 山梨県 | 35 | 山口県 |
| 4 | 宮城県 | 20 | 長野県 | 36 | 徳島県 |
| 5 | 秋田県 | 21 | 岐阜県 | 37 | 香川県 |
| 6 | 山形県 | 22 | 静岡県 | 38 | 愛媛県 |
| 7 | 福島県 | 23 | 愛知県 | 39 | 高知県 |
| 8 | 茨城県 | 24 | 三重県 | 40 | 福岡県 |
| 9 | 栃木県 | 25 | 滋賀県 | 41 | 佐賀県 |
| 10 | 群馬県 | 26 | 京都府 | 42 | 長崎県 |
| 11 | 埼玉県 | 27 | 大阪府 | 43 | 熊本県 |
| 12 | 千葉県 | 28 | 兵庫県 | 44 | 大分県 |
| 13 | 東京都 | 29 | 奈良県 | 45 | 宮崎県 |
| 14 | 神奈川県 | 30 | 和歌山県 | 46 | 鹿児島県 |
| 15 | 新潟県 | 31 | 鳥取県 | 47 | 沖縄県 |
| 16 | 富山県 | 32 | 島根県 | | |

#### JapaneseBankAccount
Japanese bank account information.

**Expands to 5 columns:**
- `{property}_bank_code` - VARCHAR(4) - Bank code (銀行コード)
- `{property}_branch_code` - VARCHAR(3) - Branch code (支店コード)
- `{property}_account_type` - ENUM - Account type: 1=普通, 2=当座, 4=貯蓄
- `{property}_account_number` - VARCHAR(7) - Account number (口座番号)
- `{property}_account_holder` - VARCHAR(100) - Account holder name (口座名義)

```yaml
bank_account:
  type: JapaneseBankAccount
```

## Per-field Overrides

All compound types support per-field overrides:

```yaml
name:
  type: JapaneseName
  fields:
    Lastname:
      length: 100        # Override default VARCHAR length
    Firstname:
      length: 100
    KanaLastname:
      length: 200
      nullable: true
      hidden: true
    KanaFirstname:
      length: 200
      nullable: true
      hidden: true
```

**Available overrides:**
- `length` - VARCHAR length (override default)
- `nullable` - Whether the field can be NULL
- `hidden` - Exclude from JSON/array output
- `fillable` - Control mass assignment

## Factory Examples

```php
$faker = fake('ja_JP');

return [
    // JapaneseName
    'name_lastname' => $faker->lastName(),
    'name_firstname' => $faker->firstName(),
    'name_kana_lastname' => $faker->lastKanaName(),
    'name_kana_firstname' => $faker->firstKanaName(),

    // JapanesePhone
    'phone' => $faker->phoneNumber(),

    // JapanesePostalCode
    'postal_code' => $faker->postcode(),

    // JapaneseAddress
    'address_postal_code' => $faker->postcode(),
    'address_prefecture_id' => $faker->numberBetween(1, 47),
    'address_address1' => $faker->city(),
    'address_address2' => $faker->streetAddress(),
    'address_address3' => $faker->optional(0.5)->secondaryAddress(),
];
```

## Model Accessors

```php
// JapaneseName accessors
$customer->name_full_name;      // "田中 太郎"
$customer->name_full_name_kana; // "タナカ タロウ"

// JapaneseAddress accessor
$customer->address_full_address; // "千代田区丸の内1-1-1ビル5F"
```
