param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Output,
  [int]$Left,
  [int]$Top,
  [int]$Right,
  [int]$Bottom,
  [double]$HueMin,
  [double]$HueMax,
  [double]$MinSaturation = 0.12,
  [double]$MaxSaturation = 1.0,
  [double]$MinValue = 0.08,
  [double]$MaxValue = 1.0,
  [int]$Grow = 5
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
$width = $bitmap.Width
$height = $bitmap.Height
$Left = [Math]::Max(0, $Left)
$Top = [Math]::Max(0, $Top)
$Right = [Math]::Min($width - 1, $Right)
$Bottom = [Math]::Min($height - 1, $Bottom)
$mask = [bool[]]::new($width * $height)

for ($y = $Top; $y -le $Bottom; $y++) {
  for ($x = $Left; $x -le $Right; $x++) {
    $pixel = $bitmap.GetPixel($x, $y)
    if ($pixel.A -lt 16) { continue }
    $hsv = Get-Hsv -Color $pixel
    $hueMatch = if ($HueMin -le $HueMax) {
      $hsv[0] -ge $HueMin -and $hsv[0] -le $HueMax
    } else {
      $hsv[0] -ge $HueMin -or $hsv[0] -le $HueMax
    }
    if ($hueMatch -and $hsv[1] -ge $MinSaturation -and $hsv[1] -le $MaxSaturation -and $hsv[2] -ge $MinValue -and $hsv[2] -le $MaxValue) {
      $mask[$y * $width + $x] = $true
    }
  }
}

for ($pass = 0; $pass -lt $Grow; $pass++) {
  $next = [bool[]]$mask.Clone()
  for ($y = $Top + 1; $y -lt $Bottom; $y++) {
    for ($x = $Left + 1; $x -lt $Right; $x++) {
      $index = $y * $width + $x
      if ($mask[$index]) { continue }
      if (
        $mask[$index - 1] -or $mask[$index + 1] -or
        $mask[$index - $width] -or $mask[$index + $width] -or
        $mask[$index - $width - 1] -or $mask[$index - $width + 1] -or
        $mask[$index + $width - 1] -or $mask[$index + $width + 1]
      ) { $next[$index] = $true }
    }
  }
  $mask = $next
}

$outputBitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outputBitmap.SetResolution(96, 96)
for ($y = $Top; $y -le $Bottom; $y++) {
  for ($x = $Left; $x -le $Right; $x++) {
    if ($mask[$y * $width + $x]) {
      $pixel = $bitmap.GetPixel($x, $y)
      if ($pixel.A -ge 16) { $outputBitmap.SetPixel($x, $y, $pixel) }
    }
  }
}

$outputDirectory = Split-Path -Parent $Output
if ($outputDirectory) { New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null }
$outputBitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$outputBitmap.Dispose()
$bitmap.Dispose()

