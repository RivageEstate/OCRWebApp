Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Match {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value,
        [Parameter(Mandatory = $true)]
        [string]$Pattern,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    if ($Value -notmatch $Pattern) {
        throw $Message
    }
}

function Assert-PathExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [ValidateSet("Leaf", "Container")]
        [string]$PathType
    )

    if (-not (Test-Path $Path -PathType $PathType)) {
        throw "Missing required path: $Path ($PathType)"
    }
}

function Assert-DocHeaders {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $content = Get-Content $Path -Raw
    Assert-Match -Value $content -Pattern "(?m)^- Title:\s*.*$" -Message "Missing header in ${Path}: Title"
    Assert-Match -Value $content -Pattern "(?m)^- Status:\s*" -Message "Missing header in ${Path}: Status"
    Assert-Match -Value $content -Pattern "(?m)^- Created:\s*" -Message "Missing header in ${Path}: Created"
    Assert-Match -Value $content -Pattern "(?m)^- Last Updated:\s*" -Message "Missing header in ${Path}: Last Updated"
    Assert-Match -Value $content -Pattern "(?m)^- Owner:\s*" -Message "Missing header in ${Path}: Owner"
    Assert-Match -Value $content -Pattern "(?m)^- Language:\s*JA/EN\s*$" -Message "Missing header in ${Path}: Language: JA/EN"

    if (-not $content.Contains("## 概要 / Summary (JA)")) {
        throw "Missing section in ${Path}: 概要 / Summary (JA)"
    }
    if (-not $content.Contains("## Summary (EN)")) {
        throw "Missing section in ${Path}: Summary (EN)"
    }
    if (-not $content.Contains("## 結論 / Conclusion (JA)")) {
        throw "Missing section in ${Path}: 結論 / Conclusion (JA)"
    }
    if (-not $content.Contains("## Conclusion (EN)")) {
        throw "Missing section in ${Path}: Conclusion (EN)"
    }
}

Write-Host "[check] markdown files exist"
Assert-PathExists -Path "README.md" -PathType "Leaf"

Write-Host "[check] agent instructions exist"
Assert-PathExists -Path "AGENTS.md" -PathType "Leaf"

Write-Host "[check] workflow exists"
Assert-PathExists -Path ".github/workflows/ci.yml" -PathType "Leaf"
Assert-PathExists -Path ".github/workflows/branch-name-check.yml" -PathType "Leaf"
Assert-PathExists -Path ".github/workflows/release.yml" -PathType "Leaf"

Write-Host "[check] release config exists"
Assert-PathExists -Path ".github/release.yml" -PathType "Leaf"

Write-Host "[check] japanese PR template exists"
Assert-PathExists -Path ".github/pull_request_template.md" -PathType "Leaf"

Write-Host "[check] japanese issue templates exist"
Assert-PathExists -Path ".github/ISSUE_TEMPLATE/bug_report.md" -PathType "Leaf"
Assert-PathExists -Path ".github/ISSUE_TEMPLATE/feature_request.md" -PathType "Leaf"
Assert-PathExists -Path ".github/ISSUE_TEMPLATE/config.yml" -PathType "Leaf"

Write-Host "[check] issue templates configured (blank issue disabled)"
$issueConfig = (Get-Content .github/ISSUE_TEMPLATE/config.yml -Raw).Replace("`r", "")
if ($issueConfig -notmatch "(?m)^blank_issues_enabled:\s*false\s*$") {
    throw "blank_issues_enabled:false was not found in .github/ISSUE_TEMPLATE/config.yml"
}

Write-Host "[check] docs directories exist"
Assert-PathExists -Path "docs" -PathType "Container"
Assert-PathExists -Path "docs/requirements" -PathType "Container"
Assert-PathExists -Path "docs/design" -PathType "Container"
Assert-PathExists -Path "docs/operations" -PathType "Container"
Assert-PathExists -Path "docs/adr" -PathType "Container"
Assert-PathExists -Path "docs/templates" -PathType "Container"

Write-Host "[check] docs guidance files exist"
Assert-PathExists -Path "docs/README.md" -PathType "Leaf"
Assert-PathExists -Path "docs/requirements/README.md" -PathType "Leaf"
Assert-PathExists -Path "docs/design/README.md" -PathType "Leaf"
Assert-PathExists -Path "docs/operations/README.md" -PathType "Leaf"
Assert-PathExists -Path "docs/adr/README.md" -PathType "Leaf"

Write-Host "[check] docs templates exist"
Assert-PathExists -Path "docs/templates/requirements-template.md" -PathType "Leaf"
Assert-PathExists -Path "docs/templates/design-template.md" -PathType "Leaf"
Assert-PathExists -Path "docs/templates/operations-template.md" -PathType "Leaf"
Assert-PathExists -Path "docs/templates/adr-template.md" -PathType "Leaf"
Assert-PathExists -Path "docs/templates/release-notes-template.md" -PathType "Leaf"

Write-Host "[check] docs filenames follow naming rules"
$datedDirs = @("docs/requirements", "docs/design", "docs/operations")
foreach ($dir in $datedDirs) {
    $files = Get-ChildItem -Path $dir -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
    foreach ($file in $files) {
        Assert-Match -Value $file.Name -Pattern "^[0-9]{8}-[a-z0-9]+(-[a-z0-9]+)*\.md$" -Message "Invalid docs filename: $($file.FullName)"
    }
}
$adrFiles = Get-ChildItem -Path "docs/adr" -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
foreach ($file in $adrFiles) {
    Assert-Match -Value $file.Name -Pattern "^[0-9]{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$" -Message "Invalid docs filename: $($file.FullName)"
}

Write-Host "[check] docs required headers and bilingual summary/conclusion"
$headerTargets = @()
$headerTargets += Get-ChildItem -Path "docs/templates" -Filter "*.md" -File
$headerTargets += Get-ChildItem -Path "docs/requirements" -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
$headerTargets += Get-ChildItem -Path "docs/design" -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
$headerTargets += Get-ChildItem -Path "docs/operations" -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
$headerTargets += Get-ChildItem -Path "docs/adr" -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
foreach ($file in $headerTargets | Sort-Object FullName) {
    Assert-DocHeaders -Path $file.FullName
}

Write-Host "[check] PR template includes docs review checklist"
$prTemplate = Get-Content .github/pull_request_template.md -Raw
if ($prTemplate -notmatch "仕様/挙動変更がある場合、関連docsを更新した") {
    throw "Expected checklist entry was not found: docs update"
}
if ($prTemplate -notmatch "ADRが必要な変更ではADRを追加した") {
    throw "Expected checklist entry was not found: ADR"
}
if ($prTemplate -notmatch "更新対象docsのパス") {
    throw "Expected checklist entry was not found: docs path"
}
if (-not $prTemplate.Contains('ブランチ名が `type/short-slug` ルールに準拠している')) {
    throw "Expected checklist entry was not found: branch rule"
}

Write-Host "[check] branch name validator exists"
Assert-PathExists -Path "scripts/validate-branch-name.sh" -PathType "Leaf"

Write-Host "[check] shell scripts use LF line endings"
$shellScripts = Get-ChildItem -Path "scripts" -Filter "*.sh" -File
foreach ($script in $shellScripts) {
    $content = Get-Content $script.FullName -Raw
    if ($content.Contains("`r")) {
        throw "Detected CRLF in shell script: $($script.FullName)"
    }
}

Write-Host "All lightweight checks passed."
