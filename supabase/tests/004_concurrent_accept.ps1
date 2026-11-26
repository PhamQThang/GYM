param(
  [string]$Database = 'gym_invites_clean',
  [int]$Port = 55439,
  [string]$DatabaseUser = 'gym_test'
)
$ErrorActionPreference = 'Stop'
# Always loopback; never use this committed-fixture test against a real project.
$connection = @('-h', '127.0.0.1', '-p', "$Port", '-U', $DatabaseUser, '-d', $Database, '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A')
$testDirectory = Join-Path $env:TEMP ('gym-invite-concurrency-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testDirectory | Out-Null
function Invoke-TestSql([string]$Sql) {
  $file = Join-Path $testDirectory ([guid]::NewGuid().ToString('N') + '.sql')
  Set-Content -LiteralPath $file -Value $Sql -Encoding utf8
  $result = & psql @connection -f $file
  if ($LASTEXITCODE -ne 0) { throw 'SQL test command failed' }
  return $result
}
$setup = @'
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('a5000000-0000-4000-8000-000000000001','pt@concurrency-test.invalid',now(),'{}'),
('a5000000-0000-4000-8000-000000000002','client@concurrency-test.invalid',now(),'{}');
update public.profiles set role='pt' where id='a5000000-0000-4000-8000-000000000001';
insert into public.clients(id,pt_id,full_name,email) values
('b5000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001','Race fixture','client@concurrency-test.invalid');
set role authenticated;
set request.jwt.claim.sub='a5000000-0000-4000-8000-000000000001';
select token from public.issue_client_invitation('b5000000-0000-4000-8000-000000000001');
'@
$cleanup = @'
delete from public.client_invitations where client_id='b5000000-0000-4000-8000-000000000001';
delete from public.clients where id='b5000000-0000-4000-8000-000000000001';
delete from auth.users where id in ('a5000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000002');
'@
$processA = $null
$processB = $null
try {
  $token = (Invoke-TestSql $setup | Where-Object { $_ -match '^[0-9a-f]{64}$' })
  if (@($token).Count -ne 1) { throw 'Expected one synthetic invitation token' }
  $fileA = Join-Path $testDirectory 'accept-a.sql'
  $fileB = Join-Path $testDirectory 'accept-b.sql'
  # Session A locks the account first, so B must wait and re-check after A commits.
  $sqlA = @"
set application_name='gym_invite_race_a';
begin;
select id from auth.users where id='a5000000-0000-4000-8000-000000000002' for update;
set local role authenticated;
set local request.jwt.claim.sub='a5000000-0000-4000-8000-000000000002';
select pg_sleep(2);
select public.accept_client_invitation('$token');
commit;
"@
  $sqlB = @"
set role authenticated;
set request.jwt.claim.sub='a5000000-0000-4000-8000-000000000002';
select public.accept_client_invitation('$token');
"@
  Set-Content -LiteralPath $fileA -Value $sqlA -Encoding utf8
  Set-Content -LiteralPath $fileB -Value $sqlB -Encoding utf8
  $psqlPath = (Get-Command psql).Source
  $processA = Start-Process -FilePath $psqlPath -ArgumentList ($connection + @('-f', ('"' + $fileA + '"'))) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testDirectory 'a.out') -RedirectStandardError (Join-Path $testDirectory 'a.err')
  $processA.Handle | Out-Null
  $sleeping = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    $active = Invoke-TestSql "select count(*) from pg_stat_activity where application_name='gym_invite_race_a' and wait_event='PgSleep';"
    if ($active -contains '1') { $sleeping = $true; break }
    Start-Sleep -Milliseconds 25
  }
  if (-not $sleeping) { throw 'Could not observe controlled concurrency window' }
  $processB = Start-Process -FilePath $psqlPath -ArgumentList ($connection + @('-f', ('"' + $fileB + '"'))) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testDirectory 'b.out') -RedirectStandardError (Join-Path $testDirectory 'b.err')
  $processB.Handle | Out-Null
  $processA.WaitForExit()
  $processB.WaitForExit()
  if ($processA.ExitCode -ne 0 -or $processB.ExitCode -eq 0) { throw 'Expected one successful acceptance and one rejection' }
  if ((Get-Content -LiteralPath (Join-Path $testDirectory 'b.err') -Raw) -notmatch 'Account is not eligible') { throw 'Unexpected concurrent rejection reason' }
  Invoke-TestSql @'
do $$ begin
  if (select count(*) from public.clients where user_id='a5000000-0000-4000-8000-000000000002') <> 1
     or (select count(*) from public.client_invitations where accepted_by='a5000000-0000-4000-8000-000000000002') <> 1 then
    raise exception 'Concurrent redemption produced incorrect state';
  end if;
end $$;
'@ | Out-Null
  Write-Output 'PASS: concurrent redemption linked exactly one client and consumed exactly one invitation.'
} finally {
  if ($processA -and -not $processA.HasExited) { $processA.WaitForExit() }
  if ($processB -and -not $processB.HasExited) { $processB.WaitForExit() }
  Invoke-TestSql $cleanup | Out-Null
}
