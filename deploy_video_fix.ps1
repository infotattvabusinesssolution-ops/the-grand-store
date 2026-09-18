$askpass = "$env:TEMP\askpass.bat"
"@echo Yoga@1431430" | Out-File -FilePath $askpass -Encoding ascii
$env:SSH_ASKPASS = $askpass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"
ssh -o StrictHostKeyChecking=no root@191.215.37.241 "curl -I https://grandstore.co.za/assets/media/grand-store-hero-scrub.mp4"
Remove-Item -Force $askpass
