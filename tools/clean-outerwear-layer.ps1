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

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$bitmap = [System.Drawing.Bitmap]::new($sourcePath)
$outputBitmap = [System.Drawing.Bitmap]::new($bitmap)

for ($y = 250; $y -le 850; $y++) {
  for ($x = 220; $x -le 810; $x++) {
    $pixel = $outputBitmap.GetPixel($x, $y)
    if ($pixel.A -eq 0) { continue }
    $hsv = Get-Hsv -Color $pixel
    $hue = $hsv[0]
    $saturation = $hsv[1]
    $value = $hsv[2]
    $skinHue = $hue -le 32 -or $hue -ge 350
    $brightNeutral = $saturation -lt 0.2 -and $value -gt 0.64
    $cuffSkin = $y -gt 510 -and ($x -lt 420 -or $x -gt 604) -and $skinHue -and $saturation -gt 0.2 -and $value -gt 0.32
    $openingSkin = $x -ge 420 -and $x -le 604 -and $skinHue -and $saturation -gt 0.2 -and $value -gt 0.5
    if ($brightNeutral -or $cuffSkin -or $openingSkin) {
      $outputBitmap.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
    }
  }
}

$outputBitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$outputBitmap.Dispose()
$bitmap.Dispose()
Write-Host "Cleaned $Output"
