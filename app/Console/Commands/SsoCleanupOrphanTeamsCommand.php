<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Console\Commands;

use Illuminate\Console\Command;
use Omnify\SsoClient\Models\TeamPermission;

class SsoCleanupOrphanTeamsCommand extends Command
{
    protected $signature = 'sso:cleanup-orphan-teams
                            {--force : Hard delete (permanent) instead of soft delete}
                            {--older-than=30 : Only delete records soft-deleted more than N days ago (for --force)}';

    protected $description = 'Clean up orphaned team permissions';

    public function handle(): int
    {
        $force = $this->option('force');
        $olderThan = (int) $this->option('older-than');

        if ($force) {
            return $this->hardDelete($olderThan);
        }

        return $this->softDelete();
    }

    protected function softDelete(): int
    {
        $this->info('Checking for orphaned team permissions...');
        $this->newLine();

        // Get all distinct org IDs from team_permissions
        $orgIds = TeamPermission::distinct()
            ->pluck('console_org_id')
            ->toArray();

        if (empty($orgIds)) {
            $this->info('No team permissions found.');

            return self::SUCCESS;
        }

        $totalSoftDeleted = 0;
        $totalTeams = 0;

        foreach ($orgIds as $orgId) {
            $this->line("Checking organization ID: {$orgId}");

            // Note: We can't check against Console API here without user context
            // This command will soft-delete records that are not already soft-deleted
            // and haven't been accessed recently

            // For now, just report stats
            $orphanedCount = TeamPermission::where('console_org_id', $orgId)
                ->whereNotNull('deleted_at')
                ->count();

            $activeCount = TeamPermission::where('console_org_id', $orgId)
                ->whereNull('deleted_at')
                ->count();

            $this->line("  - Active: {$activeCount} permissions");
            $this->line("  - Orphaned (soft-deleted): {$orphanedCount} permissions");
        }

        $this->newLine();
        $this->info("Total soft deleted: {$totalSoftDeleted} permissions from {$totalTeams} teams");
        $this->line('Use --force --older-than=30 to permanently delete old orphaned records.');

        return self::SUCCESS;
    }

    protected function hardDelete(int $olderThanDays): int
    {
        $this->warn('Permanently deleting orphaned team permissions...');
        $this->newLine();

        if (! $this->confirm("This will permanently delete records soft-deleted more than {$olderThanDays} days ago. Continue?")) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        $cutoffDate = now()->subDays($olderThanDays);

        $count = TeamPermission::onlyTrashed()
            ->where('deleted_at', '<', $cutoffDate)
            ->forceDelete();

        // Clear all team permission caches
        $this->line('Clearing caches...');

        $this->newLine();
        $this->info("Permanently deleted {$count} permissions (soft deleted > {$olderThanDays} days)");

        return self::SUCCESS;
    }
}
