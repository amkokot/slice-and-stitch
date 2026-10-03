param(
  [Parameter(Mandatory = $true)][ValidateSet('top', 'bottom')][string]$Kind,
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

function Test-RegistrationZone {
  param([int]$X, [int]$Y, [string]$LayerKind)
  if ($LayerKind -eq 'top') {
    $neckOpening = $X -ge 428 -and $X -le 596 -and $Y -ge 280 -and $Y -le 455
    $sleeveEdges = $Y -ge 465 -and $Y -le 525 -and (($X -ge 265 -and $X -le 370) -or ($X -ge 654 -and $X -le 760))
    $lowerHem = $X -ge 330 -and $X -le 690 -and $Y -ge 705 -and $Y -le 790
    return $neckOpening -or $sleeveEdges -or $lowerHem
  }
  $waist = $X -ge 345 -and $X -le 680 -and $Y -ge 620 -and $Y -le 675
  $ankles = $Y -ge 1235 -and $Y -le 1300 -and (($X -ge 330 -and $X -le 475) -or ($X -ge 550 -and $X -le 700))
  return $waist -or $ankles
}

$bitmap = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $Source).Path)
$cleaned = [System.Drawing.Bitmap]::new($bitmap)

for ($y = 0; $y -lt $cleaned.Height; $y++) {
  for ($x = 0; $x -lt $cleaned.Width; $x++) {
    if (-not (Test-RegistrationZone -X $x -Y $y -LayerKind $Kind)) { continue }
    $pixel = $cleaned.GetPixel($x, $y)
    if ($pixel.A -eq 0) { continue }
    $hsv = Get-Hsv -Color $pixel
    $skinFringe = (($hsv[0] -ge 4 -and $hsv[0] -le 47) -or $hsv[0] -ge 350) -and $hsv[1] -ge 0.32 -and $hsv[2] -ge 0.28
    if ($skinFringe) {
      if ($Kind -eq 'bottom') {
        $button = $x -ge 493 -and $x -le 527 -and $y -ge 632 -and $y -le 670
        if ($button) { continue }
        $factor = [Math]::Max(0.45, [Math]::Min(1.45, $hsv[2] / 0.62))
        $red = [int][Math]::Round(82 * $factor)
        $green = [int][Math]::Round(78 * $factor)
        $blue = [int][Math]::Round(45 * $factor)
        $cleaned.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, $red, $green, $blue))
      } else {
        $cleaned.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
      }
    }
  }
}

$cleaned.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$cleaned.Dispose()
$bitmap.Dispose()
Write-Host "Cleaned $Kind registration fringe into $Output"
