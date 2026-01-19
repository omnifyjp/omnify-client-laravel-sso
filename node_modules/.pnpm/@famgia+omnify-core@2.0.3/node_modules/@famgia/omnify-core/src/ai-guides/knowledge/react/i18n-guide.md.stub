# Internationalization (i18n) Guide

> **Related:** [README](./README.md) | [Ant Design](./antd-guide.md)

This project uses `next-intl` for internationalization.

## Current Locales

| Code | Language   | Default |
| ---- | ---------- | ------- |
| ja   | 日本語     | ✅       |
| en   | English    |         |
| vi   | Tiếng Việt |         |

---

## Usage

### Basic Translation

```typescript
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations();
  
  return (
    <Button>{t("common.save")}</Button>
  );
}
```

### With Namespace

```typescript
const t = useTranslations("messages");
t("created")  // "作成しました" (ja) | "Created successfully" (en)
```

### With Parameters

```typescript
t("validation.minLength", { field: "Password", min: 8 })
// "Password must be at least 8 characters"
```

### LocaleSwitcher Component

```typescript
import LocaleSwitcher from "@/components/LocaleSwitcher";

<LocaleSwitcher />  // Dropdown to switch language
```

### Get Current Locale

```typescript
import { useLocale } from "@/hooks/useLocale";

function MyComponent() {
  const { locale, setLocale, localeNames } = useLocale();
  // locale: "ja" | "en" | "vi"
  // setLocale: (locale) => void
  // localeNames: { ja: "日本語", en: "English", vi: "Tiếng Việt" }
}
```

---

## Adding New Language

### Step 1: Create Message File

Create `src/i18n/messages/{locale}.json`:

```json
{
  "common": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "편집",
    "create": "만들기",
    "search": "검색",
    "loading": "로딩 중...",
    "noData": "데이터 없음",
    "confirm": "확인",
    "back": "뒤로",
    "next": "다음",
    "previous": "이전",
    "submit": "제출",
    "reset": "초기화",
    "close": "닫기",
    "yes": "예",
    "no": "아니오"
  },
  "messages": {
    "created": "생성되었습니다",
    "updated": "업데이트되었습니다",
    "deleted": "삭제되었습니다",
    "saved": "저장되었습니다",
    "error": "오류가 발생했습니다",
    "confirmDelete": "정말 삭제하시겠습니까?",
    "networkError": "네트워크 오류",
    "serverError": "서버 오류",
    "unauthorized": "로그인해 주세요",
    "forbidden": "접근 권한이 없습니다",
    "notFound": "찾을 수 없습니다",
    "sessionExpired": "세션이 만료되었습니다. 페이지를 새로고침해 주세요",
    "tooManyRequests": "요청이 너무 많습니다. 잠시 기다려 주세요"
  },
  "auth": {
    "login": "로그인",
    "logout": "로그아웃",
    "register": "회원가입",
    "email": "이메일",
    "password": "비밀번호",
    "passwordConfirm": "비밀번호 확인",
    "rememberMe": "로그인 상태 유지",
    "forgotPassword": "비밀번호를 잊으셨나요?",
    "resetPassword": "비밀번호 재설정",
    "loginSuccess": "로그인되었습니다",
    "logoutSuccess": "로그아웃되었습니다",
    "registerSuccess": "가입이 완료되었습니다"
  },
  "validation": {
    "required": "{field}은(는) 필수입니다",
    "email": "유효한 이메일 주소를 입력해 주세요",
    "minLength": "{field}은(는) {min}자 이상이어야 합니다",
    "maxLength": "{field}은(는) {max}자 이하여야 합니다",
    "passwordMatch": "비밀번호가 일치하지 않습니다"
  },
  "nav": {
    "home": "홈",
    "dashboard": "대시보드",
    "users": "사용자",
    "settings": "설정",
    "profile": "프로필"
  }
}
```

### Step 2: Update Config

Edit `src/i18n/config.ts`:

```typescript
export const locales = ["ja", "en", "vi", "ko"] as const;  // Add new locale

export const localeNames: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  vi: "Tiếng Việt",
  ko: "한국어",  // Add display name
};
```

### Step 3: Add Ant Design Locale

Edit `src/components/AntdThemeProvider.tsx`:

```typescript
import jaJP from "antd/locale/ja_JP";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import koKR from "antd/locale/ko_KR";  // Add import

const antdLocales = {
  ja: jaJP,
  en: enUS,
  vi: viVN,
  ko: koKR,  // Add mapping
};
```

---

## File Structure

```
src/i18n/
├── config.ts               # Locales configuration
├── request.ts              # Server-side locale detection
├── index.ts                # Exports
└── messages/
    ├── ja.json             # Japanese translations
    ├── en.json             # English translations
    └── vi.json             # Vietnamese translations
```

---

## Best Practices

```typescript
// ✅ DO: Use translation keys
<Button>{t("common.save")}</Button>

// ❌ DON'T: Hardcode strings
<Button>保存</Button>

// ✅ DO: Use namespaces for context
const tAuth = useTranslations("auth");
const tMessages = useTranslations("messages");

// ✅ DO: Use parameters for dynamic content
t("validation.minLength", { field: t("auth.password"), min: 8 })

// ❌ DON'T: Concatenate strings
`${t("auth.password")} must be at least 8 characters`
```
