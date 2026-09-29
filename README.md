# PowerRunner

PowerShell Script runnner that loads scripts from paths and parses commmand line parameters to present a tabbed form and output window.

# Example

``` PowerShell
param (
  [string]$name = 'MyApp',
  [string]$connectionString = 'Server=myServerAddress;Database=myDataBase;Trusted_Connection=True;',
  [string][ValidateSet("Dev", "Test", "Stage", "Prod")]$environment = "Dev",
  [bool]$configure = $true,
  [switch]$revert = $false
)

$ESC = [char]27
Write-Host "Deploying $name to $environment environment."
Write-Host "$ESC[32mConnection:$ESC[0m $connectionString"
Write-Host "Configure: $configure"
Write-Host "Revert: $revert" -ForegroundColor Blue
```

<br>

![Overview](docs/images/overview.png)

# Features
- Set all command parameters using inputs, drop downs, and checkboxes that auto-size
- Displays script description and details
- Keep track of many instances in a tabbed experience
- Scans requested directories to show heirarchical scripts in one place
- Double click a script to quickly edit and run
- Store and share saved command line parameters as a profile
- Copy current command and parameters to clipboard
- Run as administrator to execute elevated scripts
- Run scripts in their own window
- Quickly stop and start runs with a button
- Search and browse console output
- Click Edit to go directly to source
- Automatically keeps itself up to date

# Setup
1. Click `PowerRunnerSetup.exe` from [Releases](https://github.com/greggbjensen/power-runner/releases/) to install
2. Keep the download, and click to launch it
3. Click on `More info` on the blue Windows prompt, then `Run anyway`

    ![Overview](docs/images/windows-approve-dialog.png) ![Overview](docs/images/windows-approve-dialog-run-anyway.png)
    

4. When the application starts for the first time, the settings page will be shown
5. Click on the folder to browse to your root directory for searching for scripts
6. Leave **PowerShell Executable** at its default to use Windows PowerShell, or browse to `C:\Program Files\PowerShell\7\pwsh.exe` to use PowerShell 7
7. Enter a pattern for searching for your PowerShell scripts
    
    Example:
    ```
    MyProject\**\*.ps1
    ```

To verify which PowerShell version PowerRunner uses, run a script containing:

```PowerShell
$PSVersionTable
```

The output should show the selected edition and version (for PowerShell 7, `PSEdition` is `Core`).

# Contributing

## Development baseline

- Node.js `24.15.x` (LTS)
- npm `12.1.x`
- Angular CLI/Core/Material/CDK `22.2.x`
- TypeScript `6.0.x`, RxJS `7.8.x`, Zone.js `0.16.x`
- The repository uses `package-lock.json` as the canonical lockfile. Use `npm ci --ignore-scripts` for deterministic installs.

## Baseline commands

```bash
npm install --global npm@12.1.0
npm ci --ignore-scripts
npm run build
npm run lint
npm run test:ci
```

These commands are non-interactive and suitable for CI. `npm ci --ignore-scripts` avoids native postinstall work that is not needed for the renderer lint/build/test pipeline. The regular `npm test` command starts Karma in watch mode for local development.

### Frontend toolchain decisions

- The renderer uses Angular 22.2 with the current application builder and the Material 2 theme APIs. Material 2 is retained to preserve the existing interface rather than redesigning it around Material 3.
- ESLint replaces TSLint/Codelyzer. The lint target covers renderer source, templates, and renderer tests; the Electron process remains a separate migration scope.
- Protractor has been removed. Playwright is the selected approach for future browser/Electron end-to-end flows; it is not wired into this renderer-only change because the Electron upgrade is tracked separately.
- Karma remains for the existing Jasmine browser unit suite. Angular's supported build package still provides a Karma builder, so replacing the runner would add test-framework churn without improving the renderer upgrade. Re-evaluate Vitest when the suite is next materially reworked.
- For future Angular major updates, apply the Angular CLI, Core, Material, and CDK migrations one major version at a time with `ng update`, and run the build, lint, and unit tests at each step. This upgrade moves the legacy NgModule application to the supported builder while preserving its module structure and existing UI.

1. Install `Node.js 24.15.x` from https://nodejs.org/en/ and install npm `12.1.0` with `npm install --global npm@12.1.0`.
2. Install `Visual Studio Code` from https://code.visualstudio.com/
3. Clone the repository and create a new feature branch
4. Install project dependencies by running the following from the command line in the repository directory:

    ```bash
    npm ci --ignore-scripts
    ```
5. Make any changes and submit a pull request

# Creating a Release
1. Start a new `feature/` branch from `develop`
2. Update the package.json to have the desired version
3. Complete a pull request for the `feature/` branch into the `develop` branch
4. Create a `release/` version branch from `develop`
5. Merge the `release/` branch into `master`
6. Delete the `release\PowerRunner-win32-x64` folder if it exists
7. Remove any versions you no longer want to support as an upgrade from `release\installers\PowerRunner-win32-x64`
8. Run `npm run package-installer`
9. Create a new release on GitHub
10. Copy the files from `release\installers\PowerRunner-win32-x64` to that release

# Troubleshooting
- If you update the Electron version, refresh any npm install artifacts from a clean checkout before rebuilding native dependencies.
