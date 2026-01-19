<?php

namespace Omnify\SsoClient\Models\OmnifyBase;

use Omnify\SsoClient\Models\OmnifyBase\Traits\HasLocalizedDisplayName;
use Omnify\SsoClient\Models\OmnifyBase\Locales\BranchLocales;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * BranchBaseModel
 *
 * @property int $id
 * @property int $console_branch_id
 * @property int $console_org_id
 * @property string $code
 * @property string $name
 * @property bool $is_headquarters
 * @property bool $is_active
 */
class BranchBaseModel extends BaseModel
{
    use HasLocalizedDisplayName;
    use SoftDeletes;

    protected $table = 'branches';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected static array $localizedDisplayNames = BranchLocales::DISPLAY_NAMES;

    protected static array $localizedPropertyDisplayNames = BranchLocales::PROPERTY_DISPLAY_NAMES;

    protected $fillable = [
        'console_branch_id',
        'console_org_id',
        'code',
        'name',
        'is_headquarters',
        'is_active',
    ];

    protected $hidden = [];

    protected $appends = [];

    protected function casts(): array
    {
        return [
            'console_branch_id' => 'integer',
            'console_org_id' => 'integer',
            'is_headquarters' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
