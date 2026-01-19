# Security Rules

> **Non-negotiable rules** for Laravel security. Violations = vulnerabilities.

## 🔴 Mass Assignment Vulnerability

**ALWAYS define `$fillable` in Models.**

```php
// ❌ CRITICAL ERROR: No $fillable = mass assignment vulnerability
class User extends Model
{
    // Missing $fillable!
}

// ❌ DANGEROUS: Using $request->all()
User::create($request->all());  // Attacker can set is_admin=true

// ✅ CORRECT: Define $fillable explicitly
class User extends Model
{
    protected $fillable = [
        'name_lastname',
        'name_firstname',
        'email',
        'password',
    ];
    
    // $guarded is alternative but $fillable is preferred (explicit)
}

// ✅ CORRECT: Use validated data only
User::create($request->validated());
```

| Rule                                          | Description                                            |
| --------------------------------------------- | ------------------------------------------------------ |
| **Always define `$fillable`**                 | Explicitly list assignable fields                      |
| **Never use `$request->all()`**               | Use `$request->validated()` or `$request->only([...])` |
| **Prefer `$fillable` over `$guarded`**        | Whitelist is safer than blacklist                      |
| **Never put sensitive fields in `$fillable`** | `is_admin`, `role`, `balance` must NOT be fillable     |

---

## 🔴 SQL Injection Prevention

**NEVER use raw user input in queries.**

```php
// ❌ CRITICAL ERROR: SQL Injection vulnerability
$email = $request->input('email');
DB::select("SELECT * FROM users WHERE email = '$email'");  // DANGEROUS!

// ❌ DANGEROUS: String interpolation in whereRaw
User::whereRaw("email = '$email'")->get();  // DANGEROUS!

// ✅ CORRECT: Use parameter binding
DB::select("SELECT * FROM users WHERE email = ?", [$email]);

// ✅ CORRECT: Use Query Builder (auto-escapes)
User::where('email', $email)->get();

// ✅ CORRECT: Parameter binding in whereRaw
User::whereRaw('email = ?', [$email])->get();
```

| Rule                             | Description                        |
| -------------------------------- | ---------------------------------- |
| **Use Query Builder**            | Eloquent auto-escapes values       |
| **Use parameter binding**        | `?` placeholders with array values |
| **Never concatenate user input** | No string interpolation in SQL     |
| **Validate sort fields**         | Whitelist allowed sort columns     |

```php
// ✅ CORRECT: Whitelist sort fields to prevent SQL injection
$allowedSorts = ['id', 'name', 'email', 'created_at'];
$sortBy = in_array($request->sort_by, $allowedSorts) 
    ? $request->sort_by 
    : 'id';
```

---

## 🔴 XSS Prevention

**Always escape output in Blade templates.**

```php
// ❌ DANGEROUS: Raw HTML output
{!! $user->bio !!}  // XSS if bio contains <script>

// ✅ CORRECT: Escaped output (default)
{{ $user->bio }}  // Auto-escapes HTML entities

// ✅ CORRECT: Only use {!! !!} for trusted HTML
{!! $trustedHtml !!}  // Only for admin-generated content
```

---

## 🔴 CSRF Protection

**Never disable CSRF for web routes.**

```php
// ❌ DANGEROUS: Disabling CSRF
// In VerifyCsrfToken middleware
protected $except = ['*'];  // NEVER do this!

// ✅ CORRECT: CSRF is enabled by default for web routes
// API routes use Sanctum tokens instead
```

---

## 🔴 Sensitive Data Exposure

**Hide sensitive fields from JSON responses.**

```php
// ❌ ERROR: Password exposed in API response
return response()->json($user);  // Includes password!

// ✅ CORRECT: Use $hidden in Model
class User extends Model
{
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];
}

// ✅ CORRECT: Use Resource to control output
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // password NOT included
        ];
    }
}
```

---

## Quick Reference

| ❌ Never Do              | ✅ Always Do                       |
| ----------------------- | --------------------------------- |
| `$request->all()`       | `$request->validated()`           |
| Raw SQL with user input | Query Builder / parameter binding |
| Missing `$fillable`     | Define `$fillable` explicitly     |
| Missing `$hidden`       | Hide sensitive fields             |
| Disable CSRF            | Keep CSRF enabled                 |
| `{!! $userInput !!}`    | `{{ $userInput }}`                |