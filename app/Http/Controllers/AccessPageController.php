<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for Access Management (IAM) pages.
 *
 * Renders Inertia pages for user, role, team, and permission management.
 * Page paths are configurable via 'sso-client.routes.access_pages_path'.
 */
class AccessPageController extends Controller
{
    /**
     * Get the base path for IAM pages.
     */
    protected function getPagePath(string $page): string
    {
        $basePath = config('sso-client.routes.access_pages_path', 'admin/iam');

        return "{$basePath}/{$page}";
    }

    /**
     * Users list page.
     */
    public function users(): Response
    {
        return Inertia::render($this->getPagePath('users'));
    }

    /**
     * User detail page.
     */
    public function userShow(string $userId): Response
    {
        return Inertia::render($this->getPagePath('user-detail'), ['userId' => $userId]);
    }

    /**
     * Roles list page.
     */
    public function roles(): Response
    {
        return Inertia::render($this->getPagePath('roles'));
    }

    /**
     * Role detail page.
     */
    public function roleShow(string $roleId): Response
    {
        return Inertia::render($this->getPagePath('role-detail'), ['roleId' => $roleId]);
    }

    /**
     * Teams list page.
     */
    public function teams(): Response
    {
        return Inertia::render($this->getPagePath('teams'));
    }

    /**
     * Permissions list page.
     */
    public function permissions(): Response
    {
        return Inertia::render($this->getPagePath('permissions'));
    }
}
