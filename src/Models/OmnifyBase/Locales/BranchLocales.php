<?php

namespace Omnify\SsoClient\Models\OmnifyBase\Locales;

class BranchLocales
{
    public const DISPLAY_NAMES = [
        'ja' => '支店',
        'en' => 'Branch',
    ];

    public const PROPERTY_DISPLAY_NAMES = [
        'console_branch_id' => ['ja' => 'Console Branch ID', 'en' => 'Console Branch ID'],
        'console_org_id' => ['ja' => 'Console Org ID', 'en' => 'Console Org ID'],
        'code' => ['ja' => 'コード', 'en' => 'Code'],
        'name' => ['ja' => '名称', 'en' => 'Name'],
        'is_headquarters' => ['ja' => '本社', 'en' => 'Headquarters'],
        'is_active' => ['ja' => '有効', 'en' => 'Active'],
    ];
}
