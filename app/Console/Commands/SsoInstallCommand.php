<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SsoInstallCommand extends Command
{
    protected $signature = 'sso:install
                            {--force : Overwrite existing files}';

    protected $description = 'Install SSO Client package';

    public function handle(): int
    {
        $this->info('Installing SSO Client...');

        // 1. Publish config (optional but recommended for customization)
        $this->publishConfig();

        // 2. Setup User model to extend SSO User
        $this->setupUserModel();

        // 3. Optionally publish migrations (they run automatically from package)
        if ($this->confirm('Publish migrations for customization? (Migrations run automatically from package)', false)) {
            $this->publishMigrations();
        }

        // 4. Check for Omnify and handle schemas
        $this->handleOmnifySchemas();

        // 5. Sync admin permissions
        $this->syncPermissions();

        // 6. Show next steps
        $this->showNextSteps();

        $this->newLine();
        $this->info('SSO Client installed successfully!');

        return self::SUCCESS;
    }

    /**
     * Setup the User model to extend SSO Client's User model.
     */
    protected function setupUserModel(): void
    {
        $this->newLine();
        $this->info('Setting up User model...');

        $userModelPath = app_path('Models/User.php');
        $force = $this->option('force');

        // Check if User.php exists
        if (File::exists($userModelPath)) {
            $content = File::get($userModelPath);

            // Check if already extends SSO User
            if (str_contains($content, 'extends \\Omnify\\SsoClient\\Models\\User') ||
                str_contains($content, 'extends SsoUser') ||
                str_contains($content, 'use Omnify\\SsoClient\\Models\\User as')) {
                $this->line('User model already extends SSO Client User. Skipping.');
                return;
            }

            // Ask to update existing User model
            if (! $force && ! $this->confirm('User model exists. Update it to extend SSO Client User?', true)) {
                $this->warn('Skipped. You need to manually update your User model.');
                $this->showManualUserSetup();
                return;
            }

            // Update existing User model
            $this->updateExistingUserModel($userModelPath, $content);
        } else {
            // Create new User model
            $this->createNewUserModel($userModelPath);
        }
    }

    /**
     * Create a new User model that extends SSO Client User.
     */
    protected function createNewUserModel(string $path): void
    {
        $stub = <<<'PHP'
<?php

namespace App\Models;

use Omnify\SsoClient\Models\User as SsoUser;

/**
 * User Model
 *
 * Extends SSO Client User model for authentication.
 * Add your custom methods and relationships here.
 */
class User extends SsoUser
{
    // Add your custom methods here
}
PHP;

        // Ensure directory exists
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $stub);

        $this->info('Created app/Models/User.php extending SSO Client User.');
    }

    /**
     * Update existing User model to extend SSO Client User.
     */
    protected function updateExistingUserModel(string $path, string $content): void
    {
        // Backup original file
        $backupPath = $path . '.backup.' . date('YmdHis');
        File::copy($path, $backupPath);
        $this->line("Backup created: {$backupPath}");

        // Try to intelligently update the file
        $updated = $content;

        // Add use statement if not present
        if (! str_contains($updated, 'use Omnify\\SsoClient\\Models\\User')) {
            // Find the namespace line and add after it
            $updated = preg_replace(
                '/^(namespace\s+[^;]+;)/m',
                "$1\n\nuse Omnify\\SsoClient\\Models\\User as SsoUser;",
                $updated
            );
        }

        // Replace extends clause
        // Handle common patterns: extends Authenticatable, extends Model, etc.
        $patterns = [
            '/class\s+User\s+extends\s+Authenticatable(\s+implements|\s*{|\s*$)/m' => 'class User extends SsoUser$1',
            '/class\s+User\s+extends\s+\\\\Illuminate\\\\Foundation\\\\Auth\\\\User(\s+implements|\s*{|\s*$)/m' => 'class User extends SsoUser$1',
            '/class\s+User\s+extends\s+Model(\s+implements|\s*{|\s*$)/m' => 'class User extends SsoUser$1',
        ];

        $wasReplaced = false;
        foreach ($patterns as $pattern => $replacement) {
            $newUpdated = preg_replace($pattern, $replacement, $updated);
            if ($newUpdated !== $updated) {
                $updated = $newUpdated;
                $wasReplaced = true;
                break;
            }
        }

        if (! $wasReplaced) {
            $this->warn('Could not automatically update User model extends clause.');
            $this->showManualUserSetup();
            return;
        }

        // Remove traits that are now provided by SsoUser
        $traitsToRemove = [
            'use HasApiTokens, HasFactory, Notifiable;',
            'use HasApiTokens;',
            'use Notifiable;',
            'use HasFactory;',
            'use Authenticatable, Authorizable, CanResetPassword, MustVerifyEmail;',
        ];

        foreach ($traitsToRemove as $trait) {
            // Only remove if the line only contains this trait
            $updated = str_replace("    {$trait}\n", '', $updated);
        }

        // Remove use statements for traits now provided by parent
        $useStatementsToRemove = [
            'use Illuminate\\Foundation\\Auth\\User as Authenticatable;',
            'use Laravel\\Sanctum\\HasApiTokens;',
            'use Illuminate\\Notifications\\Notifiable;',
            'use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;',
        ];

        foreach ($useStatementsToRemove as $useStatement) {
            $updated = str_replace($useStatement . "\n", '', $updated);
        }

        File::put($path, $updated);
        $this->info('Updated app/Models/User.php to extend SSO Client User.');
        $this->warn('Please review the changes and remove any redundant code.');
    }

    /**
     * Show manual setup instructions for User model.
     */
    protected function showManualUserSetup(): void
    {
        $this->newLine();
        $this->line('To manually update your User model:');
        $this->newLine();
        $this->line('1. Add the import:');
        $this->line('   use Omnify\\SsoClient\\Models\\User as SsoUser;');
        $this->newLine();
        $this->line('2. Change the extends clause:');
        $this->line('   class User extends SsoUser');
        $this->newLine();
        $this->line('3. Remove redundant traits (already in SsoUser):');
        $this->line('   - HasApiTokens');
        $this->line('   - Notifiable');
        $this->line('   - Authenticatable traits');
        $this->newLine();
    }

    protected function syncPermissions(): void
    {
        $this->newLine();

        if ($this->confirm('Sync admin permissions to database?', true)) {
            $this->call('sso:sync-permissions');
        } else {
            $this->line('Skipped. You can run "php artisan sso:sync-permissions" later.');
        }
    }

    protected function publishConfig(): void
    {
        $this->call('vendor:publish', [
            '--tag' => 'sso-client-config',
            '--force' => $this->option('force'),
        ]);
    }

    protected function publishMigrations(): void
    {
        $this->call('vendor:publish', [
            '--tag' => 'sso-client-migrations',
            '--force' => $this->option('force'),
        ]);
    }

    protected function handleOmnifySchemas(): void
    {
        // Check if Omnify is available
        $omnifyConfigPath = base_path('omnify.config.ts');

        if (! File::exists($omnifyConfigPath)) {
            $this->warn('Omnify config not found. Skipping schema setup.');
            $this->line('You need to manually add the SSO fields to your User migration.');

            return;
        }

        $this->info('Omnify detected. Schema path will be registered automatically.');
        $this->line('Package schemas are located at: vendor/omnify/sso-client/database/schemas/Sso/');

        // Check if User.yaml exists and has SSO fields
        $this->checkUserSchema();

        // Ask if user wants to run omnify generate
        if ($this->confirm('Do you want to run "npx omnify generate" now?', false)) {
            $this->call('shell:exec', ['command' => 'npx omnify generate']);
        }
    }

    protected function checkUserSchema(): void
    {
        // Try to find User.yaml in common locations
        $possiblePaths = [
            base_path('.omnify/schemas/User.yaml'),
            base_path('.omnify/schemas/Auth/User.yaml'),
            base_path('database/schemas/User.yaml'),
        ];

        $userSchemaPath = null;
        foreach ($possiblePaths as $path) {
            if (File::exists($path)) {
                $userSchemaPath = $path;
                break;
            }
        }

        if (! $userSchemaPath) {
            $this->warn('User.yaml schema not found.');
            $this->line('Make sure your User schema exists and the package\'s UserSso.yaml partial will extend it.');

            return;
        }

        $this->info("Found User schema at: {$userSchemaPath}");

        // Check if SSO fields are already present
        $content = File::get($userSchemaPath);

        if (str_contains($content, 'console_user_id')) {
            $this->line('SSO fields already present in User schema.');
        } else {
            $this->line('The UserSso.yaml partial schema will add SSO fields to your User model.');
        }
    }

    protected function showNextSteps(): void
    {
        $this->newLine();
        $this->info('Next Steps:');
        $this->newLine();

        $this->line('1. Add these environment variables to your .env:');
        $this->newLine();
        $this->line('   SSO_CONSOLE_URL=http://auth.test');
        $this->line('   SSO_SERVICE_SLUG=your-service-slug');
        $this->newLine();

        $this->line('2. Run migrations (package migrations run automatically):');
        $this->newLine();
        $this->line('   php artisan migrate');
        $this->newLine();

        $this->line('3. Sync admin permissions (if not done during install):');
        $this->newLine();
        $this->line('   php artisan sso:sync-permissions');
        $this->newLine();

        $this->line('4. (Optional) Add custom methods to your User model:');
        $this->newLine();
        $this->line('   // app/Models/User.php');
        $this->line('   class User extends SsoUser');
        $this->line('   {');
        $this->line('       // Your custom methods...');
        $this->line('   }');
        $this->newLine();

        $this->line('5. To update permissions after package update:');
        $this->newLine();
        $this->line('   php artisan sso:sync-permissions --force');
    }
}
