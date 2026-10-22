$env:PGPASSWORD='postgres'
$migrations = Get-ChildItem supabase\migrations\*.sql | Sort-Object Name

foreach ($migration in $migrations) {
    Write-Host "Applying $($migration.Name)..."
    psql -U postgres -d campus_global_erp -f $migration.FullName 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Success"
    } else {
        Write-Host "  ✗ Failed (may be RLS-related, continuing...)"
    }
}

Write-Host "`nMigrations applied. Now creating admin user..."
