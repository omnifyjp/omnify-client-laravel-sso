<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Omnify\SsoClient\Models\OrganizationCache;

/**
 * Event dispatched when an organization is cached for the first time.
 *
 * This event is fired when a new organization is added to the local cache,
 * typically during SSO login or when accessing organization data.
 *
 * Use this event to:
 * - Create default org-specific roles
 * - Initialize org-specific settings
 * - Set up default permissions for the organization
 *
 * @example
 * // In EventServiceProvider
 * protected $listen = [
 *     OrganizationCacheCreated::class => [
 *         SetupOrganizationDefaults::class,
 *     ],
 * ];
 */
class OrganizationCacheCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public OrganizationCache $organization,
        public bool $wasRecentlyCreated = true
    ) {}
}
