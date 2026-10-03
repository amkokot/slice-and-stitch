param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Output
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Get-Hsv {
  param([System.Drawing.Color]$Color)
  $red = $Color.R / 255.0
  $green = $Color.G / 255.0
  $blue = $Color.B / 255.0
  $max = [Math]::Max($red, [Math]::Max($green, $blue))
  $min = [Math]::Min($red, [Math]::Min($green, $blue))
  $delta = $max - $min
  $hue = 0.0
  if ($delta -gt 0) {
    if ($max -eq $red) { $hue = 60 * ((($green - $blue) / $delta) % 6) }
    elseif ($max -eq $green) { $hue = 60 * ((($blue - $red) / $delta) + 2) }
    else { $hue = 60 * ((($red - $green) / $delta) + 4) }
    if ($hue -lt 0) { $hue += 360 }
  }
  $saturation = if ($max -eq 0) { 0 } else { $delta / $max }
  return @($hue, $saturation, $max)
}

$bitmap = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $Source).Path)
$outputBitmap = [System.Drawing.Bitmap]::new($bitmap)
for ($y = 1240; $y -lt 1345; $y++) {
  for ($x = 240; $x -lt 790; $x++) {
    $pixel = $outputBitmap.GetPixel($x, $y)
    if ($pixel.A -eq 0) { continue }
    $hsv = Get-Hsv -Color $pixel
    $skinHue = $hsv[0] -le 38 -or $hsv[0] -ge 350
    if ($skinHue -and $hsv[1] -gt 0.28 -and $hsv[2] -gt 0.32) {
      $outputBitmap.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
    }
  }
}

$outputBitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$outputBitmap.Dispose()
$bitmap.Dispose()
Write-Host "Cleaned $Output"
