<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Composer;

use Composer\Composer;
use Composer\EventDispatcher\EventSubscriberInterface;
use Composer\IO\IOInterface;
use Composer\Plugin\PluginInterface;
use Composer\Script\Event;
use Composer\Script\ScriptEvents;

/**
 * Composer plugin for Omnify package auto-discovery.
 *
 * Scans installed packages for `extra.omnify` configuration and generates
 * `.omnify-packages.json` manifest file for the Omnify CLI to consume.
 */
class OmnifyDiscoveryPlugin implements PluginInterface, EventSubscriberInterface
{
    private const MANIFEST_FILENAME = '.omnify-packages.json';
    private const MANIFEST_VERSION = 1;

    private Composer $composer;
    private IOInterface $io;

    public function activate(Composer $composer, IOInterface $io): void
    {
        $this->composer = $composer;
        $this->io = $io;
    }

    public function deactivate(Composer $composer, IOInterface $io): void
    {
        // Nothing to do
    }

    public function uninstall(Composer $composer, IOInterface $io): void
    {
        // Optionally remove manifest file
        $manifestPath = getcwd() . '/' . self::MANIFEST_FILENAME;
        if (file_exists($manifestPath)) {
            @unlink($manifestPath);
        }
    }

    /**
     * @return array<string, string>
     */
    public static function getSubscribedEvents(): array
    {
        return [
            ScriptEvents::POST_INSTALL_CMD => 'discoverPackages',
            ScriptEvents::POST_UPDATE_CMD => 'discoverPackages',
            ScriptEvents::POST_AUTOLOAD_DUMP => 'discoverPackages',
        ];
    }

    public function discoverPackages(Event $event): void
    {
        $this->io->write('<info>Omnify: Discovering package schemas...</info>');

        $packages = $this->findOmnifyPackages();

        if (empty($packages)) {
            $this->io->write('<comment>Omnify: No packages with schemas found.</comment>');
            $this->removeManifestIfExists();
            return;
        }

        $manifest = [
            '$schema' => 'https://omnify.dev/schemas/packages.json',
            'version' => self::MANIFEST_VERSION,
            'generated_at' => date('c'),
            'packages' => $packages,
        ];

        $outputPath = getcwd() . '/' . self::MANIFEST_FILENAME;
        $json = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            $this->io->writeError('<error>Omnify: Failed to encode manifest JSON</error>');
            return;
        }

        file_put_contents($outputPath, $json);

        $this->io->write(sprintf(
            '<info>Omnify: Found %d package(s), wrote %s</info>',
            count($packages),
            self::MANIFEST_FILENAME
        ));
    }

    /**
     * Find all packages with Omnify configuration.
     *
     * @return array<string, array<string, mixed>>
     */
    private function findOmnifyPackages(): array
    {
        $packages = [];
        $vendorDir = $this->composer->getConfig()->get('vendor-dir');
        $installedPath = $vendorDir . '/composer/installed.json';

        if (!file_exists($installedPath)) {
            return $packages;
        }

        $content = file_get_contents($installedPath);
        if ($content === false) {
            return $packages;
        }

        $installed = json_decode($content, true);
        if (!is_array($installed)) {
            return $packages;
        }

        // Handle both old and new installed.json format
        $packageList = $installed['packages'] ?? $installed;
        if (!is_array($packageList)) {
            return $packages;
        }

        foreach ($packageList as $package) {
            if (!is_array($package)) {
                continue;
            }

            $omnifyConfig = $package['extra']['omnify'] ?? null;
            if ($omnifyConfig === null || !is_array($omnifyConfig)) {
                continue;
            }

            $packageName = $package['name'] ?? null;
            if (!is_string($packageName)) {
                continue;
            }

            $packagePath = $vendorDir . '/' . $packageName;

            // Build package configuration
            $config = [
                'schemas' => $packagePath . '/' . ($omnifyConfig['schemas'] ?? 'database/schemas'),
                'namespace' => $omnifyConfig['namespace'] ?? $this->deriveNamespace($packageName),
                'priority' => $omnifyConfig['priority'] ?? 100,
            ];

            // Add version if available
            if (isset($package['version']) && is_string($package['version'])) {
                $config['version'] = $package['version'];
            }

            // Process options
            if (isset($omnifyConfig['options']) && is_array($omnifyConfig['options'])) {
                $options = $omnifyConfig['options'];

                // Resolve relative paths
                if (isset($options['migrationsPath']) && is_string($options['migrationsPath'])) {
                    $options['migrationsPath'] = $packagePath . '/' . $options['migrationsPath'];
                }
                if (isset($options['factoriesPath']) && is_string($options['factoriesPath'])) {
                    $options['factoriesPath'] = $packagePath . '/' . $options['factoriesPath'];
                }

                $config['options'] = $options;
            }

            $packages[$packageName] = $config;
        }

        // Sort by priority (lower = first)
        uasort($packages, function ($a, $b) {
            return ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100);
        });

        return $packages;
    }

    /**
     * Derive namespace from package name.
     * e.g., "famgia/billing" → "FamgiaBilling"
     */
    private function deriveNamespace(string $packageName): string
    {
        $parts = preg_split('/[-_\/]/', $packageName) ?: [$packageName];
        return implode('', array_map('ucfirst', $parts));
    }

    /**
     * Remove manifest file if it exists (when no packages found).
     */
    private function removeManifestIfExists(): void
    {
        $manifestPath = getcwd() . '/' . self::MANIFEST_FILENAME;
        if (file_exists($manifestPath)) {
            @unlink($manifestPath);
        }
    }
}
