<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Omnify\SsoClient\Exceptions\ConsoleAccessDeniedException;
use Omnify\SsoClient\Exceptions\ConsoleApiException;
use Omnify\SsoClient\Exceptions\ConsoleAuthException;
use Omnify\SsoClient\Exceptions\ConsoleNotFoundException;
use Omnify\SsoClient\Exceptions\ConsoleServerException;

class ConsoleApiService
{
    public function __construct(
        private readonly string $consoleUrl,
        private readonly string $serviceSlug,
        private readonly int $timeout = 10,
        private readonly int $retry = 2
    ) {}

    /**
     * Exchange SSO code for tokens.
     *
     * @return array{access_token: string, refresh_token: string, expires_in: int}|null
     */
    public function exchangeCode(string $code): ?array
    {
        $response = $this->request()
            ->post("{$this->consoleUrl}/api/sso/token", [
                'code' => $code,
                'service_slug' => $this->serviceSlug,
            ]);

        if (! $response->successful()) {
            $this->handleError($response->status(), $response->json());

            return null;
        }

        return $response->json();
    }

    /**
     * Refresh access token.
     *
     * @return array{access_token: string, refresh_token: string, expires_in: int}|null
     */
    public function refreshToken(string $refreshToken): ?array
    {
        $response = $this->request()
            ->post("{$this->consoleUrl}/api/sso/refresh", [
                'refresh_token' => $refreshToken,
                'service_slug' => $this->serviceSlug,
            ]);

        if (! $response->successful()) {
            $this->handleError($response->status(), $response->json());

            return null;
        }

        return $response->json();
    }

    /**
     * Revoke refresh token.
     */
    public function revokeToken(string $refreshToken): bool
    {
        $response = $this->request()
            ->post("{$this->consoleUrl}/api/sso/revoke", [
                'refresh_token' => $refreshToken,
            ]);

        return $response->successful();
    }

    /**
     * Get user authorization for organization.
     *
     * @return array{organization_id: string, organization_slug: string, org_role: string, service_role: string|null, service_role_level: int}|null
     */
    public function getAccess(string $accessToken, string $orgSlug): ?array
    {
        $response = $this->request()
            ->withToken($accessToken)
            ->get("{$this->consoleUrl}/api/sso/access", [
                'organization_slug' => $orgSlug,
            ]);

        if (! $response->successful()) {
            if ($response->status() === 403) {
                return null;
            }
            $this->handleError($response->status(), $response->json());

            return null;
        }

        return $response->json();
    }

    /**
     * Get organizations user has access to.
     *
     * @return array<array{organization_id: string, organization_slug: string, organization_name: string, org_role: string, service_role: string|null}>
     */
    public function getOrganizations(string $accessToken): array
    {
        $response = $this->request()
            ->withToken($accessToken)
            ->get("{$this->consoleUrl}/api/sso/organizations");

        if (! $response->successful()) {
            $this->handleError($response->status(), $response->json());

            return [];
        }

        return $response->json() ?? [];
    }

    /**
     * Get user's teams in organization.
     *
     * @return array<array{id: int, name: string, path: string|null, parent_id: int|null, is_leader: bool}>
     */
    public function getUserTeams(string $accessToken, string $orgSlug): array
    {
        $response = $this->request()
            ->withToken($accessToken)
            ->get("{$this->consoleUrl}/api/sso/teams", [
                'organization_slug' => $orgSlug,
            ]);

        if (! $response->successful()) {
            if ($response->status() === 403 || $response->status() === 404) {
                return [];
            }
            $this->handleError($response->status(), $response->json());

            return [];
        }

        return $response->json('teams') ?? [];
    }

    /**
     * Get JWKS for JWT verification.
     *
     * @return array<string, mixed>
     */
    public function getJwks(): array
    {
        $response = $this->request()
            ->get("{$this->consoleUrl}/.well-known/jwks.json");

        if (! $response->successful()) {
            $this->handleError($response->status(), $response->json());

            return [];
        }

        return $response->json() ?? [];
    }

    /**
     * Get Console URL.
     */
    public function getConsoleUrl(): string
    {
        return $this->consoleUrl;
    }

    /**
     * Get service slug.
     */
    public function getServiceSlug(): string
    {
        return $this->serviceSlug;
    }

    /**
     * Create HTTP request with common configuration.
     */
    private function request(): PendingRequest
    {
        $request = Http::timeout($this->timeout)
            ->retry($this->retry, 100)
            ->acceptJson();

        // Add Accept-Language header if enabled
        if (config('sso-client.locale.enabled', true)) {
            $request->withHeaders([
                config('sso-client.locale.header', 'Accept-Language') => app()->getLocale(),
            ]);
        }

        return $request;
    }

    /**
     * Handle API error responses.
     *
     * @param array<string, mixed>|null $body
     *
     * @throws ConsoleApiException
     */
    private function handleError(int $status, ?array $body): void
    {
        $error = $body['error'] ?? 'UNKNOWN_ERROR';
        $message = $body['message'] ?? 'An error occurred';

        match ($status) {
            400 => throw new ConsoleApiException($message, $status, $error),
            401 => throw new ConsoleAuthException($message),
            403 => throw new ConsoleAccessDeniedException($message),
            404 => throw new ConsoleNotFoundException($message),
            default => $status >= 500
                ? throw new ConsoleServerException($message, $status)
                : throw new ConsoleApiException($message, $status, $error),
        };
    }
}
